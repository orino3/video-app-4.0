export default function VideoLoading() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Video Player Skeleton */}
        <div className="bg-gray-200 rounded-lg overflow-hidden mb-6 animate-pulse">
          <div className="aspect-video"></div>
        </div>

        {/* Video Info Skeleton */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
