import { ReactNode } from 'react';
import { cn } from '@/util/cn';

interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
}

export const Skeleton = ({
  width = 'w-full',
  height = 'h-4',
  className,
}: SkeletonProps) => (
  <div
    className={cn(
      `${width} ${height} bg-slate-200 dark:bg-slate-700 rounded animate-pulse`,
      className
    )}
    role="status"
    aria-busy="true"
    aria-label="Loading"
  />
);

export const StoryCardSkeleton = () => (
  <div className="p-6 rounded-[32px] border bg-white dark:bg-slate-800 space-y-4">
    <Skeleton height="h-6" width="w-3/4" />
    <Skeleton height="h-4" width="w-full" />
    <Skeleton height="h-4" width="w-5/6" />
    <div className="flex gap-2 pt-4">
      <Skeleton height="h-8" width="w-1/4" className="rounded-lg" />
      <Skeleton height="h-8" width="w-1/4" className="rounded-lg" />
    </div>
  </div>
);

export const ApiKeyCardSkeleton = () => (
  <div className="p-5 rounded-3xl border bg-white dark:bg-slate-700 space-y-3">
    <Skeleton height="h-5" width="w-2/3" />
    <Skeleton height="h-4" width="w-full" />
    <div className="flex justify-between pt-3">
      <Skeleton height="h-6" width="w-1/3" className="rounded-lg" />
      <Skeleton height="h-6" width="w-1/6" className="rounded-lg" />
    </div>
  </div>
);

export const ProfileSkeleton = () => (
  <div className="flex flex-col items-center gap-6">
    <Skeleton height="h-32" width="w-32" className="rounded-full" />
    <Skeleton height="h-6" width="w-2/3" />
    <div className="w-full space-y-3">
      <Skeleton height="h-10" width="w-full" className="rounded-lg" />
      <Skeleton height="h-10" width="w-full" className="rounded-lg" />
    </div>
  </div>
);
