import { LoadingSpinner } from '@/components/branding/components/loading-spinner.component';
import { BandedScreenBackdrop } from '@/components/navigation/components/banded-screen-backdrop.component';
import { useTheme } from '@/utils/theme-provider';
import { View } from 'react-native';

const TOP_BAND_HEIGHT = 40;

type AddTeamLoadingScreenProps = {
  bandColor?: string;
  svgColor?: string;
};

export function AddTeamLoadingScreen({ bandColor, svgColor }: AddTeamLoadingScreenProps) {
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1 }}>
      <BandedScreenBackdrop
        svgColor={svgColor ?? colors.primary}
        backgroundColor={colors.background}
        topBandHeight={TOP_BAND_HEIGHT}
        topBandBackgroundColor={bandColor}
        topBandSvgColor={svgColor}
      />
      <View className="flex-1 items-center justify-center gap-4">
        <LoadingSpinner size={80} />
      </View>
    </View>
  );
}