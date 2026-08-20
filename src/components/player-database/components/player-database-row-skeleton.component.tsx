import { Skeleton } from '@/components/primitives/skeleton.component';
import { View } from 'react-native';

type PlayerDatabaseRowSkeletonProps = {
  isFirst?: boolean;
};

export function PlayerDatabaseRowSkeleton({ isFirst }: PlayerDatabaseRowSkeletonProps) {
  return (
    <View className={`flex-row items-center gap-3 px-1 py-3 ${isFirst ? '' : 'border-border border-t'}`}>
      <Skeleton className="h-8 w-20 rounded-md" />
      <Skeleton className="h-5 flex-1" />
      <Skeleton className="h-4 w-10" />
    </View>
  );
}