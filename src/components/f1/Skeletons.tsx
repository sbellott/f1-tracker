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

export function PredictionsModuleSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <Skeleton className="h-10 w-48 mx-auto mb-2" />
        <Skeleton className="h-5 w-72 mx-auto" />
      </div>

      {/* Main Score Card */}
      <Card className="border-border/50 overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-primary/20 via-accent/20 to-chart-3/20" />
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-3 items-center">
            {/* User 1 */}
            <div className="p-4 md:p-6 text-center">
              <Skeleton className="w-12 h-12 md:w-16 md:h-16 rounded-full mx-auto mb-3" />
              <Skeleton className="h-5 w-24 mx-auto mb-2" />
              <Skeleton className="h-10 w-16 mx-auto mb-1" />
              <Skeleton className="h-3 w-12 mx-auto" />
            </div>
            {/* VS */}
            <div className="p-3 md:p-6 text-center border-y md:border-y-0 md:border-x border-border/30 flex md:block items-center justify-center gap-4">
              <Skeleton className="w-6 h-6 md:w-10 md:h-10 rounded-full" />
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            {/* User 2 */}
            <div className="p-4 md:p-6 text-center">
              <Skeleton className="w-12 h-12 md:w-16 md:h-16 rounded-full mx-auto mb-3" />
              <Skeleton className="h-5 w-24 mx-auto mb-2" />
              <Skeleton className="h-10 w-16 mx-auto mb-1" />
              <Skeleton className="h-3 w-12 mx-auto" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4 border-border/50">
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="w-4 h-4 rounded" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-8 w-12 mb-1" />
            <Skeleton className="h-3 w-16" />
          </Card>
        ))}
      </div>

      {/* Next Race Card */}
      <Card className="border-border/50">
        <CardHeader className="border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="w-8 h-8 rounded-xl" />
              <Skeleton className="h-5 w-24" />
            </div>
            <Skeleton className="h-6 w-32 rounded-full" />
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-32 mb-4" />
          <div className="flex gap-3">
            <Skeleton className="h-10 flex-1 rounded-md" />
            <Skeleton className="h-10 w-28 rounded-md" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function NewsCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/50">
      <Skeleton className="h-48 w-full" />
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex items-center gap-2 pt-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

export function ExplorerCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/50 hover:border-primary/50 transition-all">
      <div className="relative h-32">
        <Skeleton className="w-full h-full" />
        <div className="absolute top-2 right-2">
          <Skeleton className="h-6 w-8 rounded" />
        </div>
      </div>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-5 w-32 mb-1" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="flex justify-between pt-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
      </CardContent>
    </Card>
  );
}

export function ConstructorCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/50">
      <div className="h-24 relative">
        <Skeleton className="w-full h-full" />
        <div className="absolute bottom-2 left-4">
          <Skeleton className="h-12 w-12 rounded-xl" />
        </div>
      </div>
      <CardContent className="p-4 pt-2 space-y-2">
        <Skeleton className="h-6 w-32" />
        <div className="flex justify-between">
          <div className="space-y-1">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-12" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-8" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CircuitCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/50">
      <div className="relative h-40">
        <Skeleton className="w-full h-full" />
        <div className="absolute top-2 left-2">
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
      <CardContent className="p-4 space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-4 pt-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

export function GroupCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/50">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-4 w-24" />
          <div className="flex -space-x-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-8 rounded-full border-2 border-background" />
            ))}
          </div>
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </CardContent>
    </Card>
  );
}