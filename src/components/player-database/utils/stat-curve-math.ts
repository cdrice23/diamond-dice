import type { EmpiricalDistribution, ParametricDistribution } from "../hooks/use-stat-distributions.hook";

export type CurvePoint = { x: number; y: number };

export type CurveTier = 'level1' | 'level2' | 'level3';

const SAMPLE_COUNT = 80;
const MAX_ABS_SKEWNESS = 0.99;

function standardNormalPdf(z: number): number {
  return Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
}

// Abramowitz-Stegun erf approximation
function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * absX);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
  return sign * y;
}

function standardNormalCdf(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

function skewnessForAlpha(alpha: number): number {
  const delta = alpha / Math.sqrt(1 + alpha * alpha);
  const num = Math.pow(delta * Math.sqrt(2 / Math.PI), 3);
  const denom = Math.pow(1 - (2 * delta * delta) / Math.PI, 1.5);
  return ((4 - Math.PI) / 2) * (num / denom);
}

// Solves for the skew-normal shape parameter that produces a target skewness,
// via bisection. Target is clamped to what skew-normal can represent.
function solveAlphaForSkewness(targetSkewness: number): number {
  const clamped = Math.max(-MAX_ABS_SKEWNESS, Math.min(MAX_ABS_SKEWNESS, targetSkewness));
  let low = -50;
  let high = 50;
  for (let i = 0; i < 60; i++) {
    const mid = (low + high) / 2;
    const midSkew = skewnessForAlpha(mid);
    if (midSkew < clamped) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return (low + high) / 2;
}

function skewNormalParams(mean: number, stddev: number, skewness: number) {
  const alpha = solveAlphaForSkewness(skewness);
  const delta = alpha / Math.sqrt(1 + alpha * alpha);
  const omega = stddev / Math.sqrt(1 - (2 * delta * delta) / Math.PI);
  const xi = mean - omega * delta * Math.sqrt(2 / Math.PI);
  return { alpha, omega, xi };
}

function skewNormalPdf(x: number, xi: number, omega: number, alpha: number): number {
  const z = (x - xi) / omega;
  return (2 / omega) * standardNormalPdf(z) * standardNormalCdf(alpha * z);
}

export function buildParametricCurve(dist: ParametricDistribution): { points: CurvePoint[]; domainMin: number; domainMax: number } {
  const { mean, stddev, skewness } = dist;
  const { alpha, omega, xi } = skewNormalParams(mean, stddev, skewness);

  const domainMin = mean - 4 * stddev;
  const domainMax = mean + 4 * stddev;
  const step = (domainMax - domainMin) / (SAMPLE_COUNT - 1);

  const raw: CurvePoint[] = [];
  let maxY = 0;
  for (let i = 0; i < SAMPLE_COUNT; i++) {
    const x = domainMin + i * step;
    const y = skewNormalPdf(x, xi, omega, alpha);
    raw.push({ x, y });
    if (y > maxY) maxY = y;
  }

  const points = raw.map((p) => ({ x: (p.x - domainMin) / (domainMax - domainMin), y: maxY > 0 ? p.y / maxY : 0 }));
  return { points, domainMin, domainMax };
}

export function buildEmpiricalCurve(dist: EmpiricalDistribution): { points: CurvePoint[]; domainMin: number; domainMax: number } {
  const { rangeMin, rangeMax, buckets } = dist;
  const maxCount = Math.max(...buckets, 1);

  // One point per bucket midpoint, normalized.
  const points: CurvePoint[] = buckets.map((count, index) => {
    const bucketFraction = (index + 0.5) / buckets.length;
    return { x: bucketFraction, y: count / maxCount };
  });

  return { points, domainMin: rangeMin, domainMax: rangeMax };
}

// Catmull-Rom-ish light smoothing pass so a 40-bucket histogram reads as a
// continuous curve rather than a jagged stairstep, without pulling in a
// spline library. Averages each point with its neighbors, a few passes.
export function smoothCurve(points: CurvePoint[], passes = 2): CurvePoint[] {
  let result = points;
  for (let pass = 0; pass < passes; pass++) {
    result = result.map((point, index) => {
      if (index === 0 || index === result.length - 1) return point;
      const prev = result[index - 1];
      const next = result[index + 1];
      return { x: point.x, y: (prev.y * 0.25 + point.y * 0.5 + next.y * 0.25) };
    });
  }
  return result;
}

export function normalizedPositionForValue(value: number, domainMin: number, domainMax: number): number {
  if (domainMax === domainMin) return 0.5;
  return Math.max(0, Math.min(1, (value - domainMin) / (domainMax - domainMin)));
}

export function percentileForParametric(value: number, dist: ParametricDistribution): number {
  const { mean, stddev, skewness } = dist;
  const { alpha, omega, xi } = skewNormalParams(mean, stddev, skewness);

  const lowerBound = mean - 6 * stddev;
  const steps = 300;
  const stepSize = (value - lowerBound) / steps;
  if (stepSize <= 0) return 0;

  let cumulative = 0;
  for (let i = 0; i < steps; i++) {
    const x = lowerBound + i * stepSize;
    cumulative += skewNormalPdf(x, xi, omega, alpha) * stepSize;
  }
  return Math.max(0, Math.min(100, cumulative * 100));
}

export function percentileForEmpirical(value: number, dist: EmpiricalDistribution): number {
  const { rangeMin, rangeMax, buckets } = dist;
  const clamped = Math.max(rangeMin, Math.min(rangeMax, value));
  const fraction = (clamped - rangeMin) / (rangeMax - rangeMin || 1);
  const exactIndex = fraction * buckets.length;
  const bucketIndex = Math.min(buckets.length - 1, Math.floor(exactIndex));

  const total = buckets.reduce((sum, c) => sum + c, 0) || 1;
  const countBefore = buckets.slice(0, bucketIndex).reduce((sum, c) => sum + c, 0);
  const withinBucketFraction = exactIndex - bucketIndex;
  const countWithinBucket = buckets[bucketIndex] * withinBucketFraction;

  return ((countBefore + countWithinBucket) / total) * 100;
}

export function tierForPercentile(percentile: number, higherIsBetter: boolean): CurveTier {
  const qualityPercentile = higherIsBetter ? percentile : 100 - percentile;
  if (qualityPercentile < 33.33) return 'level1';
  if (qualityPercentile < 66.67) return 'level2';
  return 'level3';
}

export function curveYAtX(points: CurvePoint[], xFraction: number): number {
  if (points.length === 0) return 0;
  const exactIndex = xFraction * (points.length - 1);
  const lowerIndex = Math.max(0, Math.min(points.length - 1, Math.floor(exactIndex)));
  const upperIndex = Math.min(points.length - 1, lowerIndex + 1);
  const fraction = exactIndex - lowerIndex;
  return points[lowerIndex].y + (points[upperIndex].y - points[lowerIndex].y) * fraction;
}

function bisectForValue(evaluate: (value: number) => number, target: number, low: number, high: number): number {
  let lo = low;
  let hi = high;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (evaluate(mid) < target) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return (lo + hi) / 2;
}

export function valueAtCumulativePercentileParametric(dist: ParametricDistribution, targetPercentile: number): number {
  const low = dist.mean - 6 * dist.stddev;
  const high = dist.mean + 6 * dist.stddev;
  return bisectForValue((value) => percentileForParametric(value, dist), targetPercentile, low, high);
}

export function valueAtCumulativePercentileEmpirical(dist: EmpiricalDistribution, targetPercentile: number): number {
  const { rangeMin, rangeMax, buckets } = dist;
  const total = buckets.reduce((sum, c) => sum + c, 0) || 1;

  let cumulative = 0;
  for (let i = 0; i < buckets.length; i++) {
    const nextCumulative = cumulative + buckets[i];
    const cumulativePercent = (cumulative / total) * 100;
    const nextCumulativePercent = (nextCumulative / total) * 100;

    if (targetPercentile <= nextCumulativePercent || i === buckets.length - 1) {
      const bucketFraction =
        nextCumulativePercent > cumulativePercent
          ? (targetPercentile - cumulativePercent) / (nextCumulativePercent - cumulativePercent)
          : 0;
      const bucketWidth = (rangeMax - rangeMin) / buckets.length;
      return rangeMin + (i + Math.max(0, Math.min(1, bucketFraction))) * bucketWidth;
    }
    cumulative = nextCumulative;
  }
  return rangeMax;
}

export function buildBandFillPath(
  points: CurvePoint[],
  xStart: number,
  xEnd: number,
  width: number,
  usableHeight: number
): string {
  const toScreenY = (yFraction: number) => usableHeight - yFraction * usableHeight;

  const startY = toScreenY(curveYAtX(points, xStart));
  let d = `M ${xStart * width} ${usableHeight} L ${xStart * width} ${startY}`;

  const sampleCount = 20;
  for (let i = 1; i <= sampleCount; i++) {
    const xFraction = xStart + ((xEnd - xStart) * i) / sampleCount;
    const y = toScreenY(curveYAtX(points, xFraction));
    d += ` L ${xFraction * width} ${y}`;
  }

  d += ` L ${xEnd * width} ${usableHeight} Z`;
  return d;
}