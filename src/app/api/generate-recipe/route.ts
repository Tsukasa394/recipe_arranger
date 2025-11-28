import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { RecipeRequest, RecipeResponse } from '@/types/recipe';

// レート制限管理（簡易版）
const requestTimestamps: number[] = [];
const MAX_REQUESTS_PER_MINUTE = 5;

function checkRateLimit(): boolean {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;
  
  // 1分以上前のリクエストを削除
  while (requestTimestamps.length > 0 && requestTimestamps[0] < oneMinuteAgo) {
    requestTimestamps.shift();
  }
  
  if (requestTimestamps.length >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }
  
  requestTimestamps.push(now);
  return true;
}

// 難易度の変換
function convertDifficulty(difficulty: string): string {
  const difficultyMap: Record<string, string> = {
    'very_easy': 'すごくかんたん',
    'easy': 'かんたん',
    'medium': 'ふつう',
    'hard': 'むずかしい',
  };
  return difficultyMap[difficulty] || 'かんたん';
}

// プロンプト生成
function generatePrompt(ingredients: string[], difficulty: string, time: number): string {
  const ingredientsText = ingredients.join(', ');
  const difficultyText = convertDifficulty(difficulty);
  
  return `あなたはプロの料理研究家です。
以下の残り物・食材から、創造的で実用的なアレンジレシピを3つ提案してください。

# 入力食材
${ingredientsText}

# 条件
- 難易度: ${difficultyText}
- 調理時間: ${time}分以内
- 家庭にある調味料は自由に使用可能

# 出力形式（JSON）
以下のJSON形式で回答してください:
{
  "recipes": [
    {
      "title": "レシピ名",
      "description": "一言説明（30文字以内）",
      "difficulty": "かんたん",
      "cookingTime": 15,
      "additionalIngredients": ["追加食材1", "追加食材2"],
      "steps": ["手順1", "手順2", "手順3"],
      "tips": "美味しく作るコツ"
    }
  ]
}

# 制約
- 追加食材は最大3つまで
- 手順は5ステップ以内
- 実現可能性を重視
- 必ずJSONのみを返してください。他のテキストは含めないでください。`;
}

export async function POST(request: NextRequest) {
  try {
    // レート制限チェック
    if (!checkRateLimit()) {
      return NextResponse.json(
        { error: 'リクエストが多すぎます。1分後に再試行してください' },
        { status: 429 }
      );
    }

    // リクエストボディの取得とバリデーション
    const body: RecipeRequest = await request.json();
    
    if (!body.ingredients || !Array.isArray(body.ingredients) || body.ingredients.length === 0) {
      return NextResponse.json(
        { error: '食材を入力してください' },
        { status: 400 }
      );
    }

    // 環境変数の確認
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not set');
      return NextResponse.json(
        { error: 'サーバーエラーが発生しました。しばらくしてから再試行してください' },
        { status: 500 }
      );
    }

    // Gemini APIの初期化
    const ai = new GoogleGenAI({ apiKey });

    // プロンプト生成
    const difficulty = body.preferences?.difficulty || 'easy';
    const time = body.preferences?.time || 15;
    const prompt = generatePrompt(body.ingredients, difficulty, time);

    // Gemini API呼び出し
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    });

    const text = response.text;

    // JSONの抽出（```json や ``` で囲まれている可能性がある）
    let jsonText = text.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    }

    // JSONパース
    let recipeData: { recipes: any[] };
    try {
      recipeData = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Response text:', text);
      return NextResponse.json(
        { error: 'レシピの生成に失敗しました。もう一度お試しください' },
        { status: 500 }
      );
    }

    // レスポンス形式に変換
    const recipeResponse: RecipeResponse = {
      recipes: recipeData.recipes || [],
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(recipeResponse);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: '予期しないエラーが発生しました' },
      { status: 500 }
    );
  }
}

