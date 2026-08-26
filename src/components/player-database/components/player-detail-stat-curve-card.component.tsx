import { PlayerDetailStatCurveChart } from '@/components/player-database/components/player-detail-stat-curve-chart.component';
import { PlayerDetailStatCurveToggle } from '@/components/player-database/components/player-detail-stat-curve-toggle.component';
import type { PlayerDetail } from '@/components/player-database/hooks/use-player-detail.hook';
import { useStatDistributions } from '@/components/player-database/hooks/use-stat-distributions.hook';
import { getStatCurveConfigsForGroup, type StatCurveGroup } from '@/components/player-database/utils/stat-curve-config';
import {
  buildEmpiricalCurve,
  buildParametricCurve,
  normalizedPositionForValue,
  percentileForEmpirical,
  percentileForParametric,
  smoothCurve,
  tierForPercentile,
  valueAtCumulativePercentileEmpirical,
  valueAtCumulativePercentileParametric,
} from '@/components/player-database/utils/stat-curve-math';
import { CardSectionHeader } from '@/components/primitives/card-section-header.component';
import { Card } from '@/components/primitives/card.component';
import { Skeleton } from '@/components/primitives/skeleton.component';
import { Text } from '@/components/primitives/text.component';
import { adjustHslAlpha } from '@/utils/color';
import { useTheme } from '@/utils/theme-provider';
import { useState } from 'react';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';

type PlayerDetailStatCurveCardProps = {
  player: PlayerDetail;
  group: StatCurveGroup;
};

const MAX_RETRY_ATTEMPTS = 3;
const CHART_HEIGHT = 140;

export function PlayerDetailStatCurveCard({ player, group }: PlayerDetailStatCurveCardProps) {
  const { colors } = useTheme();
  const { distributions, loading, error, retry } = useStatDistributions();
  const configs = getStatCurveConfigsForGroup(group);
  const [activeKey, setActiveKey] = useState(configs[0]?.key ?? '');
  const [retryCount, setRetryCount] = useState(0);
  const [chartWidth, setChartWidth] = useState(0);

  if (configs.length === 0) {
    return null;
  }

  const handleRetry = () => {
    if (retryCount >= MAX_RETRY_ATTEMPTS) return;
    setRetryCount((prev) => prev + 1);
    retry();
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    const measuredWidth = event.nativeEvent.layout.width;
    if (measuredWidth > 0 && measuredWidth !== chartWidth) {
      setChartWidth(measuredWidth);
    }
  };

  return (
    <Card className="mx-4">
      <CardSectionHeader label={group === 'batting' ? 'Batting Performance vs. League' : 'Pitching Performance vs. League'} />

      {loading && (
        <View className="gap-3">
          <Skeleton className="h-8 w-full rounded-md" />
          <Skeleton className="h-36 w-full rounded-md" />
        </View>
      )}

      {!loading && error && (
        <View className="items-center gap-3 py-4">
          <Text variant="muted" className="text-center text-base">
            {`Couldn't load performance data`}
          </Text>
          {retryCount < MAX_RETRY_ATTEMPTS ? (
            <Pressable
              onPress={handleRetry}
              className="rounded-md px-4 py-2 active:opacity-70"
              style={{ backgroundColor: colors.muted }}
              accessibilityRole="button"
            >
              <Text className="text-foreground text-sm font-semibold">Try Again ({MAX_RETRY_ATTEMPTS - retryCount} left)</Text>
            </Pressable>
          ) : (
            <Text variant="muted" className="text-center text-sm">
              Please check back later.
            </Text>
          )}
        </View>
      )}

      {!loading && !error && distributions && (
        <View className="gap-3" onLayout={handleLayout}>
          <PlayerDetailStatCurveToggle configs={configs} activeKey={activeKey} onSelect={setActiveKey} />

          {chartWidth > 0 &&
            configs
              .filter((config) => config.key === activeKey)
              .map((config) => {
                const distribution = distributions[config.key];
                const rawValue = config.getValue(player);

                if (!distribution || rawValue === null) {
                  return (
                    <View key={config.key} className="items-center justify-center" style={{ height: CHART_HEIGHT }}>
                      <Text variant="muted" className="text-base">
                        No data available
                      </Text>
                    </View>
                  );
                }

                const isEmpirical = distribution.distributionType === 'empirical';
                const { points: rawPoints, domainMin, domainMax } = isEmpirical
                  ? buildEmpiricalCurve(distribution.value)
                  : buildParametricCurve(distribution.value);
                const points = isEmpirical ? smoothCurve(rawPoints) : rawPoints;

                const markerX = normalizedPositionForValue(rawValue, domainMin, domainMax);
                const percentile = isEmpirical
                  ? percentileForEmpirical(rawValue, distribution.value)
                  : percentileForParametric(rawValue, distribution.value);
                const tier = tierForPercentile(percentile, config.higherIsBetter);
                const tierColor = tier === 'level1' ? colors.level1 : tier === 'level2' ? colors.level2 : colors.level3;
                const tierLabel = tier === 'level1' ? 'Below Average' : tier === 'level2' ? 'Pretty Good' : 'Elite';

                const p33Value = isEmpirical
                  ? valueAtCumulativePercentileEmpirical(distribution.value, 33.33)
                  : valueAtCumulativePercentileParametric(distribution.value, 33.33);
                const p67Value = isEmpirical
                  ? valueAtCumulativePercentileEmpirical(distribution.value, 66.67)
                  : valueAtCumulativePercentileParametric(distribution.value, 66.67);
                const p33X = normalizedPositionForValue(p33Value, domainMin, domainMax);
                const p67X = normalizedPositionForValue(p67Value, domainMin, domainMax);
                const bandBoundaries: [number, number] = [p33X, p67X];

                return (
                  <View key={config.key} className="gap-2">
                    <PlayerDetailStatCurveChart
                      points={points}
                      markerX={markerX}
                      tier={tier}
                      bandBoundaries={bandBoundaries}
                      higherIsBetter={config.higherIsBetter}
                      width={chartWidth}
                      height={CHART_HEIGHT}
                    />

                    <View className="gap-1">
                      <View className="flex-row items-center justify-between">
                        <Text variant="muted" className="flex-1 text-base" numberOfLines={1}>
                          {config.fullLabel}
                        </Text>
                        <View className="flex-row items-center gap-2">
                          <Text style={{ color: colors.primary }} className="text-lg font-semibold">
                            {config.format(rawValue)}
                          </Text>
                          <View
                            className="rounded-sm px-2 py-0.5"
                            style={{
                              backgroundColor: adjustHslAlpha(tierColor, 0.15),
                              borderWidth: 1,
                              borderColor: adjustHslAlpha(tierColor, 0.35),
                            }}
                          >
                            <Text style={{ color: tierColor }} className="text-xs font-semibold">
                              {tierLabel}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <Text variant="muted" className="text-sm">
                        {config.description}
                      </Text>
                    </View>
                  </View>
                );
              })}
        </View>
      )}
    </Card>
  );
}