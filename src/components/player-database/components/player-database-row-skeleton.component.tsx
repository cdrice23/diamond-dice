import { usePlayerRowEntrance } from '@/components/player-database/hooks/use-player-row-entrance.hook';
import { Skeleton } from '@/components/primitives/skeleton.component';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';

type PlayerDatabaseRowSkeletonProps = {
  isFirst?: boolean;
  indexInBatch?: number;
};

export function PlayerDatabaseRowSkeleton({ isFirst, indexInBatch = 0 }: PlayerDatabaseRowSkeletonProps) {
  const entranceStyle = usePlayerRowEntrance(indexInBatch);

  return (
    <Animated.View
      style={entranceStyle}
      className={`flex-row items-center gap-3 px-1 py-3 ${isFirst ? '' : 'border-border border-t'}`}
    >
      <Skeleton className="h-8 w-12 rounded-md" />
      <Skeleton className="h-5 flex-1" />
      <View className="flex-row items-center gap-1">
        <Skeleton className="h-5 w-5 rounded-sm" />
      </View>
    </Animated.View>
  );
}