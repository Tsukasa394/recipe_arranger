'use client';

import { Recipe } from '@/types/recipe';

interface RecipeCardProps {
  recipe: Recipe;
  onViewDetails: (recipe: Recipe) => void;
}

export default function RecipeCard({ recipe, onViewDetails }: RecipeCardProps) {
  const difficultyColors: Record<string, string> = {
    'すごくかんたん': 'bg-green-100 text-green-800',
    'かんたん': 'bg-blue-100 text-blue-800',
    'ふつう': 'bg-yellow-100 text-yellow-800',
    'むずかしい': 'bg-red-100 text-red-800',
  };

  const difficultyColor = difficultyColors[recipe.difficulty] || 'bg-gray-100 text-gray-800';

  return (
    <div className="flex flex-col rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <h3 className="mb-2 text-xl font-semibold text-gray-900">{recipe.title}</h3>
      <p className="mb-4 text-sm text-gray-600">{recipe.description}</p>
      
      <div className="mb-4 flex flex-wrap gap-2">
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${difficultyColor}`}>
          {recipe.difficulty}
        </span>
        <span className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {recipe.cookingTime}分
        </span>
      </div>

      {recipe.additionalIngredients.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-xs font-medium text-gray-500">追加食材</p>
          <div className="flex flex-wrap gap-2">
            {recipe.additionalIngredients.slice(0, 3).map((ingredient, index) => (
              <span
                key={index}
                className="rounded-md bg-orange-50 px-2 py-1 text-xs text-orange-700"
              >
                {ingredient}
              </span>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => onViewDetails(recipe)}
        className="mt-auto rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
      >
        詳細を見る
      </button>
    </div>
  );
}

