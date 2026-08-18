import { Card } from '@/components/primitives/card.component';
import { Skeleton } from '@/components/primitives/skeleton.component';
import { View } from 'react-native';

type ProfileSkeletonProps =
  | { variant: 'overview' }
  | { variant: 'recent-games'; rows?: number }
  | { variant: 'mvp' };

function OverviewSkeleton() {
  return (
    <Card className="mx-4">
      <View className="flex-row items-center">
        {Array.from({ length: 3 }).map((_, index) => (
          <View key={index} className="flex-1 items-center gap-1 py-2">
            <Skeleton className="h-6 w-10" />
            <Skeleton className="h-3 w-12" />
          </View>
        ))}
      </View>
    </Card>
  );
}

function RecentGamesSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card className="mx-4">
      <Skeleton className="mb-2 h-4 w-28" />
      {Array.from({ length: rows }).map((_, index) => (
        <View
          key={index}
          className={`flex-row items-center justify-between py-2 ${index > 0 ? 'border-border border-t' : ''}`}
        >
          <Skeleton className="h-3 w-16" />
          <Skeleton className="mx-2 h-5 w-12 rounded-full" />
          <Skeleton className="h-3 w-3" />
          <Skeleton className="mx-2 h-3 flex-1" />
          <Skeleton className="h-3 w-10" />
        </View>
      ))}
    </Card>
  );
}

function MvpSkeleton() {
  return (
    <Card className="mx-4">
      <Skeleton className="mb-2 h-5 w-24" />
      <View className="flex-row gap-4">
        <Skeleton style={{ width: 64, height: 110, borderRadius: 12 }} />
        <View className="flex-1 justify-between">
          <Skeleton className="h-6 w-3/4" />
          <View className="flex-row flex-wrap justify-between gap-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <View key={index} className="items-center gap-1">
                <Skeleton className="h-5 w-8" />
                <Skeleton className="h-3 w-6" />
              </View>
            ))}
          </View>
        </View>
      </View>
      <Skeleton className="mt-5 h-1 w-full" />
      <View className="mt-4 flex-row flex-wrap">
        {Array.from({ length: 6 }).map((_, index) => (
          <View key={index} style={{ flexBasis: '16.66%' }} className="items-center gap-1 px-0.5 py-1">
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-3 w-6" />
          </View>
        ))}
      </View>
    </Card>
  );
}

export function ProfileSkeleton(props: ProfileSkeletonProps) {
  switch (props.variant) {
    case 'overview':
      return <OverviewSkeleton />;
    case 'recent-games':
      return <RecentGamesSkeleton rows={props.rows} />;
    case 'mvp':
      return <MvpSkeleton />;
  }
}