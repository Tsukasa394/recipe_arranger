'use client';

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
      </div>
      <p className="mt-4 text-lg text-gray-600">レシピを考えています...</p>
    </div>
  );
}

