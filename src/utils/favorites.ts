import { Recipe } from '@/types/recipe';

const STORAGE_KEY = 'favoriteRecipes';

export function saveFavoriteRecipe(recipe: Recipe): void {
  try {
    const favorites = getFavoriteRecipes();
    const recipeWithId: Recipe = {
      ...recipe,
      id: recipe.id || `recipe-${Date.now()}`,
      savedAt: new Date().toISOString(),
    };
    favorites.push(recipeWithId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.error('Failed to save favorite recipe:', error);
  }
}

export function getFavoriteRecipes(): Recipe[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to get favorite recipes:', error);
    return [];
  }
}

export function removeFavoriteRecipe(recipeId: string): void {
  try {
    const favorites = getFavoriteRecipes();
    const filtered = favorites.filter((r) => r.id !== recipeId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove favorite recipe:', error);
  }
}

