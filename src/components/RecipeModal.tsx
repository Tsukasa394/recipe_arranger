'use client';

import { useEffect } from 'react';
import { Recipe } from '@/types/recipe';

interface RecipeModalProps {
  recipe: Recipe | null;
  onClose: () => void;
  onSaveFavorite: (recipe: Recipe) => void;
}

export default function RecipeModal({ recipe, onClose, onSaveFavorite }: RecipeModalProps) {
  useEffect(() => {
    if (recipe) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [recipe]);

  if (!recipe) return null;

  const difficultyColors: Record<string, string> = {
    'すごくかんたん': 'bg-green-100 text-green-800',
    'かんたん': 'bg-blue-100 text-blue-800',
    'ふつう': 'bg-yellow-100 text-yellow-800',
    'むずかしい': 'bg-red-100 text-red-800',
  };

  const difficultyColor = difficultyColors[recipe.difficulty] || 'bg-gray-100 text-gray-800';

  const handleSaveFavorite = () => {
    onSaveFavorite(recipe);
    alert('お気に入りに保存しました！');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          aria-label="閉じる"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="mb-4 text-2xl font-bold text-gray-900">{recipe.title}</h2>
        <p className="mb-6 text-gray-600">{recipe.description}</p>

        <div className="mb-6 flex flex-wrap gap-2">
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${difficultyColor}`}>
            {recipe.difficulty}
          </span>
          <span className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {recipe.cookingTime}分
          </span>
        </div>

        {recipe.additionalIngredients.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">追加で必要な食材</h3>
            <ul className="list-disc pl-6">
              {recipe.additionalIngredients.map((ingredient, index) => (
                <li key={index} className="text-gray-700">
                  {ingredient}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mb-6">
          <h3 className="mb-3 text-lg font-semibold text-gray-900">作り方</h3>
          <ol className="list-decimal pl-6 space-y-2">
            {recipe.steps.map((step, index) => (
              <li key={index} className="text-gray-700">
                {step}
              </li>
            ))}
          </ol>
        </div>

        {recipe.tips && (
          <div className="mb-6 rounded-lg bg-yellow-50 p-4">
            <h3 className="mb-2 text-sm font-semibold text-yellow-900">ワンポイントアドバイス</h3>
            <p className="text-sm text-yellow-800">{recipe.tips}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleSaveFavorite}
            className="flex-1 rounded-md bg-orange-500 px-4 py-2 font-medium text-white transition-colors hover:bg-orange-600"
          >
            お気に入りに保存
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}

