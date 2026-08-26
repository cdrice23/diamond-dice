import { supabase } from '@/utils/supabase';
import { useEffect, useState } from 'react';

export type EmpiricalDistribution = {
  rangeMin: number;
  rangeMax: number;
  buckets: number[];
  computedAt: string;
};

export type ParametricDistribution = {
  mean: number;
  stddev: number;
  skewness: number;
  computedAt: string;
};

export type StatDistribution =
  | { distributionType: 'empirical'; value: EmpiricalDistribution }
  | { distributionType: 'parametric'; value: ParametricDistribution };

type StatDistributionsMap = Record<string, StatDistribution>;

let cache: StatDistributionsMap | null = null;
let inFlightRequest: Promise<StatDistributionsMap> | null = null;

async function fetchStatDistributions(): Promise<StatDistributionsMap> {
  const { data, error } = await supabase.from('stat_distributions').select('stat_key, distribution_type, value');

  if (error) {
    throw error;
  }

  const result: StatDistributionsMap = {};
  for (const row of data ?? []) {
    result[row.stat_key] = { distributionType: row.distribution_type, value: row.value } as StatDistribution;
  }
  return result;
}

function requestDistributions(): Promise<StatDistributionsMap> {
  if (cache) return Promise.resolve(cache);
  if (!inFlightRequest) {
    inFlightRequest = fetchStatDistributions()
      .then((result) => {
        cache = result;
        inFlightRequest = null;
        return result;
      })
      .catch((error) => {
        inFlightRequest = null;
        throw error;
      });
  }
  return inFlightRequest;
}

export function prefetchStatDistributions() {
  requestDistributions().catch(() => {});
}

export function useStatDistributions() {
  const [distributions, setDistributions] = useState<StatDistributionsMap | null>(cache);
  const [loading, setLoading] = useState(!cache);
  const [error, setError] = useState<Error | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    if (cache) {
      setDistributions(cache);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    requestDistributions()
      .then((result) => {
        if (!cancelled) {
          setDistributions(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to load stat distributions'));
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
     
  }, [retryToken]);

  const retry = () => {
    cache = null;
    inFlightRequest = null;
    setRetryToken((prev) => prev + 1);
  };

  return { distributions, loading, error, retry };
}