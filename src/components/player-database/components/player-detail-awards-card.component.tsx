import { useTypewriterReveal } from '@/components/player-database/hooks/use-typewriter-enter.hook';
import type { PlayerAwardSummary } from '@/components/player-database/player-database.types';
import { getAllSeasonsList, getCollapsedSeasonSummary } from '@/components/player-database/utils/format-award-seasons';
import { getAwardTierColor } from '@/components/player-database/utils/get-award-tier-color';
import { AnimatedCascadeItem } from '@/components/primitives/animated-cascade-item.component';
import { CardSectionHeader } from '@/components/primitives/card-section-header.component';
import { Card } from '@/components/primitives/card.component';
import { useTheme } from '@/utils/theme-provider';
import { useEffect, useRef, useState } from 'react';
import { Easing, Pressable, Animated as RNAnimated, Text, View } from 'react-native';

const ANIMATION_DURATION = 400;
const FADE_DURATION = 140;
const CURSOR_BLINK_DURATION = 550;
const THEME_BODY_FONT = 'VT323_400Regular';
const ACCENT_ANCHOR_Y = 12;

type Phase =
  | 'collapsed'
  | 'wiping-in'
  | 'typing-in-expanded'
  | 'expanded'
  | 'fading-out-expanded'
  | 'wiping-out'
  | 'summary-fading-in';

type PlayerDetailAwardsCardProps = {
  awardSummaries: PlayerAwardSummary[];
};

function AwardRow({
  award,
  isExpanded,
  onToggle,
}: {
  award: PlayerAwardSummary;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { colors } = useTheme();
  const progress = useRef(new RNAnimated.Value(0)).current;
  const summaryOpacity = useRef(new RNAnimated.Value(1)).current;
  const expandedOpacity = useRef(new RNAnimated.Value(1)).current;
  const [phase, setPhase] = useState<Phase>('collapsed');
  const [cursorVisible, setCursorVisible] = useState(true);
  const [expandedBlockHeight, setExpandedBlockHeight] = useState(0);

  const tierColor = getAwardTierColor(award.tier, colors);
  const { label: collapsedLabel, isTruncatable } = getCollapsedSeasonSummary(award.seasons);
  const expandedLabel = getAllSeasonsList(award.seasons);

  useEffect(() => {
    if (isExpanded) {
      expandedOpacity.setValue(1);
      summaryOpacity.setValue(0);
      setPhase('wiping-in');
      RNAnimated.timing(progress, {
        toValue: 1,
        duration: ANIMATION_DURATION,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }).start(() => {
        setPhase('typing-in-expanded');
      });
    } else {
      setPhase('fading-out-expanded');
      RNAnimated.timing(expandedOpacity, { toValue: 0, duration: FADE_DURATION, useNativeDriver: true }).start(() => {
        setPhase('wiping-out');
        RNAnimated.timing(progress, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }).start(() => {
          setPhase('summary-fading-in');
          RNAnimated.timing(summaryOpacity, { toValue: 1, duration: FADE_DURATION, useNativeDriver: true }).start(() => {
            setPhase('collapsed');
          });
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded]);

  const expandedTextPhase =
    phase === 'typing-in-expanded' ? 'typing' : phase === 'expanded' || phase === 'fading-out-expanded' ? 'shown' : 'hidden';

  const expandedTyped = useTypewriterReveal({
    text: expandedLabel,
    phase: expandedTextPhase,
    charDurationMs: 8,
    onDone: () => setPhase('expanded'),
  });

  const showCursor = expandedTextPhase === 'typing' || expandedTextPhase === 'shown';

  useEffect(() => {
    if (!showCursor) {
      setCursorVisible(true);
      return;
    }

    setCursorVisible(true);
    const interval = setInterval(() => {
      setCursorVisible((prev) => !prev);
    }, CURSOR_BLINK_DURATION);

    return () => clearInterval(interval);
  }, [showCursor]);

  const accentWidth = progress.interpolate({ inputRange: [0, 1], outputRange: [8, 4] });
  const accentHeight = progress.interpolate({ inputRange: [0, 1], outputRange: [8, 18] });
  const accentRadius = progress.interpolate({ inputRange: [0, 1], outputRange: [4, 2] });
  const labelFontSize = progress.interpolate({ inputRange: [0, 1], outputRange: [18, 20] });
  const rowPaddingBottom = progress.interpolate({ inputRange: [0, 1], outputRange: [4, 10] });
  const expandedBlockAnimatedHeight = progress.interpolate({ inputRange: [0, 1], outputRange: [0, expandedBlockHeight] });

  const handlePress = () => {
    if (!isTruncatable) return;
    onToggle();
  };

  return (
    <View className="relative overflow-hidden rounded-md">
      <RNAnimated.View
        pointerEvents="none"
        className="bg-muted absolute inset-0 rounded-md"
        style={{ transform: [{ scaleY: progress }], transformOrigin: `50% ${ACCENT_ANCHOR_Y}px` }}
      />

      <Pressable onPress={handlePress}>
        <RNAnimated.View style={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: rowPaddingBottom, gap: 4 }}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <RNAnimated.View
                style={{
                  width: accentWidth,
                  height: accentHeight,
                  borderRadius: accentRadius,
                  backgroundColor: tierColor,
                }}
              />
              <RNAnimated.Text
                style={{
                  fontFamily: THEME_BODY_FONT,
                  fontSize: labelFontSize,
                  fontWeight: '600',
                  color: colors.primary,
                }}
              >
                {award.label}
              </RNAnimated.Text>
            </View>

            <RNAnimated.Text
              style={{
                fontFamily: THEME_BODY_FONT,
                fontSize: 18,
                color: colors.mutedForeground,
                opacity: summaryOpacity,
              }}
            >
              {collapsedLabel}
            </RNAnimated.Text>
          </View>

          {isTruncatable && (
            <View style={{ position: 'relative' }}>
              <Text
                style={{
                  position: 'absolute',
                  right: 0,
                  opacity: 0,
                  fontFamily: THEME_BODY_FONT,
                  fontSize: 18,
                  textAlign: 'right',
                }}
                onLayout={(event) => {
                  const measured = event.nativeEvent.layout.height;
                  if (measured > 0 && measured !== expandedBlockHeight) {
                    setExpandedBlockHeight(measured);
                  }
                }}
              >
                {expandedLabel}
              </Text>

              <RNAnimated.View style={{ height: expandedBlockAnimatedHeight, overflow: 'hidden' }}>
                <RNAnimated.View
                  style={{ opacity: expandedOpacity, flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap' }}
                >
                  <Text style={{ fontFamily: THEME_BODY_FONT, fontSize: 18, color: colors.mutedForeground }}>{expandedTyped}</Text>
                  {showCursor && (
                    <Text
                      style={{
                        fontFamily: THEME_BODY_FONT,
                        fontSize: 18,
                        color: colors.level2,
                        opacity: cursorVisible ? 1 : 0,
                        fontWeight: '300',
                      }}
                    >
                      |
                    </Text>
                  )}
                </RNAnimated.View>
              </RNAnimated.View>
            </View>
          )}
        </RNAnimated.View>
      </Pressable>
    </View>
  );
}

export function PlayerDetailAwardsCard({ awardSummaries }: PlayerDetailAwardsCardProps) {
  const [expandedAwardLabel, setExpandedAwardLabel] = useState<string | null>(null);

  if (awardSummaries.length === 0) {
    return null;
  }

  const handleToggleAward = (label: string) => {
    setExpandedAwardLabel((prev) => (prev === label ? null : label));
  };

  return (
    <Card className="mx-4">
      <CardSectionHeader label="Awards" />

      <View className="gap-2.5">
        {awardSummaries.map((award, index) => (
          <AnimatedCascadeItem key={award.label} index={index} staggerDelayMs={25} fadeDurationMs={300} translateYStart={6}>
            <AwardRow
              award={award}
              isExpanded={expandedAwardLabel === award.label}
              onToggle={() => handleToggleAward(award.label)}
            />
          </AnimatedCascadeItem>
        ))}
      </View>
    </Card>
  );
}