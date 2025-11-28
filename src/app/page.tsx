'use client';

import { useState } from 'react';
import { Recipe, RecipeRequest, RecipeResponse, DifficultyValue } from '@/types/recipe';
import Loading from '@/components/Loading';
import RecipeCard from '@/components/RecipeCard';
import RecipeModal from '@/components/RecipeModal';
import { saveFavoriteRecipe } from '@/utils/favorites';

export default function Home() {
  const [ingredients, setIngredients] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyValue>('easy');
  const [cookingTime, setCookingTime] = useState(15);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);

  const difficultyOptions: { value: DifficultyValue; label: string }[] = [
    { value: 'very_easy', label: 'すごくかんたん' },
    { value: 'easy', label: 'かんたん' },
    { value: 'medium', label: 'ふつう' },
    { value: 'hard', label: 'むずかしい' },
  ];

  const handleExampleClick = () => {
    setIngredients('残りカレー, ご飯, チーズ');
  };

  const parseIngredients = (text: string): string[] => {
    return text
      .split(/[,，\n]/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedIngredients = parseIngredients(ingredients);
    if (parsedIngredients.length === 0) {
      setError('食材を入力してください');
      return;
    }

    setIsLoading(true);
    setRecipes([]);

    try {
      const requestBody: RecipeRequest = {
        ingredients: parsedIngredients,
        preferences: {
          difficulty,
          time: cookingTime,
        },
      };

      const response = await fetch('/api/generate-recipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'レシピの生成に失敗しました');
      }

      const data: RecipeResponse = await response.json();
      
      // IDを付与
      const recipesWithId = data.recipes.map((recipe, index) => ({
        ...recipe,
        id: `recipe-${Date.now()}-${index}`,
      }));
      
      setRecipes(recipesWithId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '予期しないエラーが発生しました';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveFavorite = (recipe: Recipe) => {
    saveFavoriteRecipe(recipe);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900">ちょい足しアレンジレシピアプリ</h1>
          <p className="mt-2 text-lg text-gray-600">
            冷蔵庫の残り物が、プロ級の一品に変身！
          </p>
        </header>

        <form onSubmit={handleSubmit} className="mx-auto max-w-2xl">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="mb-4">
              <label htmlFor="ingredients" className="block text-sm font-medium text-gray-700 mb-2">
                食材・料理を入力
              </label>
              <textarea
                id="ingredients"
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                placeholder="残りカレー, ご飯, チーズ"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows={3}
              />
              <button
                type="button"
                onClick={handleExampleClick}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
              >
                入力例を使う
              </button>
            </div>

            <details className="mb-4">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                オプション設定
              </summary>
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-2">
                    難易度
                  </label>
                  <select
                    id="difficulty"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as DifficultyValue)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {difficultyOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="cookingTime" className="block text-sm font-medium text-gray-700 mb-2">
                    調理時間: {cookingTime}分
                  </label>
                  <input
                    id="cookingTime"
                    type="range"
                    min="5"
                    max="60"
                    step="5"
                    value={cookingTime}
                    onChange={(e) => setCookingTime(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="mt-1 flex justify-between text-xs text-gray-500">
                    <span>5分</span>
                    <span>60分</span>
                  </div>
                </div>
              </div>
            </details>

            {error && (
              <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? '生成中...' : 'レシピを生成'}
            </button>
          </div>
        </form>

        {isLoading && <Loading />}

        {recipes.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">生成されたレシピ</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {recipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onViewDetails={setSelectedRecipe}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <RecipeModal
        recipe={selectedRecipe}
        onClose={() => setSelectedRecipe(null)}
        onSaveFavorite={handleSaveFavorite}
      />
    </div>
  );
}
