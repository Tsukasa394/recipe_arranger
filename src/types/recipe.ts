// レシピ型定義

export type Difficulty = 'すごくかんたん' | 'かんたん' | 'ふつう' | 'むずかしい';
export type DifficultyValue = 'very_easy' | 'easy' | 'medium' | 'hard';

export interface Recipe {
  id?: string;                    // オプション（フロント生成）
  title: string;                  // レシピ名
  description: string;            // 一言説明（30文字以内）
  difficulty: Difficulty;          // 難易度
  cookingTime: number;            // 調理時間（分）
  additionalIngredients: string[]; // 追加食材リスト
  steps: string[];                // 手順リスト
  tips: string;                   // コツ・アドバイス
  savedAt?: string;              // 保存日時（お気に入り用）
}

export interface RecipeRequest {
  ingredients: string[];          // 入力食材
  preferences?: {
    difficulty?: DifficultyValue;
    time?: number;                // 調理時間上限（分）
  };
}

export interface RecipeResponse {
  recipes: Recipe[];              // レシピ配列（3つ）
  generatedAt: string;            // 生成日時（ISO8601）
}

