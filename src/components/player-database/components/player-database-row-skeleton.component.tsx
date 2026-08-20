import { Skeleton } from '@/components/primitives/skeleton.component';
import { View } from 'react-native';

type PlayerRowSkeletonProps = {
  isFirst?: boolean;
};

export function PlayerRowSkeleton({ isFirst }: PlayerRowSkeletonProps) {
  return (
    <View className={`flex-row items-center gap-3 px-1 py-3 ${isFirst ? '' : 'border-border border-t'}`}>
      <Skeleton className="h-8 w-20 rounded-md" />
      <Skeleton className="h-5 flex-1" />
      <Skeleton className="h-4 w-10" />
    </View>
  );
}