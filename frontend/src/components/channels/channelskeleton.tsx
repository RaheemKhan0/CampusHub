import { Skeleton } from "../ui/skeleton";

export function ChannelPageSkeleton() {
  return (
    <div className="flex h-full flex-col justify-between">
      <div className="border-b border-border/40 bg-muted/20 px-6 py-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <div className="flex-1 space-y-6 px-6 py-6">
        {[0, 1, 2, 3].map((key) => (
          <div key={key} className="flex items-start gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-border/40 bg-muted/20 px-6 py-4">
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}



