export function ArticleCardSkeleton() {
  return (
    <div 
      className="relative overflow-hidden bg-surface-container-lowest border border-outline-variant/15 animate-pulse"
      style={{ 
        borderRadius: '80px 40px 100px 60px',
        height: '300px'
      }}
    >
      {/* Image placeholder */}
      <div className="absolute inset-0 bg-surface-container-high" />
      
      {/* Content placeholder */}
      <div className="absolute bottom-6 left-6 right-6 space-y-3">
        {/* Category badge */}
        <div className="w-24 h-5 bg-surface-container rounded-full" />
        
        {/* Title lines */}
        <div className="space-y-2">
          <div className="w-full h-6 bg-surface-container rounded-lg" />
          <div className="w-3/4 h-6 bg-surface-container rounded-lg" />
        </div>
        
        {/* Meta info */}
        <div className="flex gap-2">
          <div className="w-16 h-4 bg-surface-container rounded-full" />
          <div className="w-20 h-4 bg-surface-container rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function BriefCardSkeleton() {
  return (
    <div className="bg-surface-container-lowest/70 backdrop-blur-2xl border border-outline-variant/15 rounded-[60px] p-6 animate-pulse">
      <div className="flex gap-6">
        {/* Image placeholder */}
        <div className="w-32 h-32 rounded-full bg-surface-container-high shrink-0" />
        
        {/* Content placeholder */}
        <div className="flex-1 space-y-3">
          <div className="w-32 h-5 bg-surface-container rounded-full" />
          <div className="space-y-2">
            <div className="w-full h-6 bg-surface-container rounded-lg" />
            <div className="w-5/6 h-6 bg-surface-container rounded-lg" />
          </div>
          <div className="w-48 h-4 bg-surface-container rounded-full" />
        </div>
        
        {/* Play button placeholder */}
        <div className="w-12 h-12 rounded-full bg-surface-container-high shrink-0" />
      </div>
    </div>
  );
}

export function ProfileCardSkeleton() {
  return (
    <div className="bg-surface-container-lowest/70 backdrop-blur-xl border border-outline-variant/15 rounded-[40px] p-6 flex items-center gap-4 animate-pulse">
      <div className="w-16 h-16 rounded-full bg-surface-container-high" />
      <div className="flex-1 space-y-2">
        <div className="w-32 h-5 bg-surface-container rounded-lg" />
        <div className="w-48 h-4 bg-surface-container rounded-full" />
      </div>
    </div>
  );
}

export function CollectionCardSkeleton() {
  return (
    <div className="bg-surface-container-lowest/70 backdrop-blur-xl border border-outline-variant/15 rounded-[40px] p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-surface-container-high" />
        <div className="flex gap-2">
          <div className="w-8 h-8 rounded-full bg-surface-container" />
          <div className="w-8 h-8 rounded-full bg-surface-container" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="w-40 h-6 bg-surface-container rounded-lg" />
        <div className="w-full h-4 bg-surface-container rounded-full" />
        <div className="w-3/4 h-4 bg-surface-container rounded-full" />
      </div>
    </div>
  );
}
