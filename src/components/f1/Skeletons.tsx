import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function DriverCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/50">
      <div className="relative h-56">
        <Skeleton className="w-full h-full" />
      </div>
      <CardHeader className="space-y-2">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center space-y-2">
            <Skeleton className="h-8 w-12 mx-auto" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>
          <div className="text-center space-y-2">
            <Skeleton className="h-8 w-12 mx-auto" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>
          <div className="text-center space-y-2">
            <Skeleton className="h-8 w-12 mx-auto" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CalendarCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/50">
      <div className="relative h-48">
        <Skeleton className="w-full h-full" />
      </div>
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-7 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </CardContent>
    </Card>
  );
}

export function StandingsTableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-7 w-48 mb-2" />
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-5 w-8" />
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-5 flex-1" />
              <Skeleton className="h-6 w-12" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function CountdownSkeleton() {
  return (
    <Card className="relative overflow-hidden border-border/50">
      <div className="absolute inset-0 opacity-10">
        <Skeleton className="w-full h-full" />
      </div>
      <CardHeader className="relative z-10">
        <Skeleton className="h-5 w-48 mb-2" />
        <Skeleton className="h-8 w-64" />
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="grid grid-cols-4 gap-4 mb-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="text-center space-y-2">
              <Skeleton className="h-16 w-16 mx-auto rounded-xl" />
              <Skeleton className="h-4 w-12 mx-auto" />
            </div>
          ))}
        </div>
        <Skeleton className="h-4 w-48 mx-auto" />
      </CardContent>
    </Card>
  );
}

export function HeroSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-3xl p-8 lg:p-12">
      <Skeleton className="absolute inset-0" />
      <div className="relative z-10 max-w-2xl space-y-4">
        <Skeleton className="h-6 w-32 rounded-full" />
        <Skeleton className="h-12 w-96" />
        <Skeleton className="h-6 w-80" />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <Card className="p-6">
      <Skeleton className="h-10 w-16 mb-2" />
      <Skeleton className="h-4 w-24" />
    </Card>
  );
}

export function FeatureCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-12 w-12 rounded-2xl mb-4" />
        <Skeleton className="h-6 w-40 mb-2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </CardHeader>
    </Card>
  );
}
