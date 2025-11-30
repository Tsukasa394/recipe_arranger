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

# 制約
- 追加食材は最大3つまで
- 手順は5ステップ以内
- 実現可能性を重視
- レシピは必ず3つ生成してください`;
}

// JSONスキーマ定義
function getRecipeJsonSchema() {
  return {
    type: 'object',
    properties: {
      recipes: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'レシピ名'
            },
            description: {
              type: 'string',
              description: '一言説明（30文字以内）'
            },
            difficulty: {
              type: 'string',
              enum: ['すごくかんたん', 'かんたん', 'ふつう', 'むずかしい'],
              description: '難易度'
            },
            cookingTime: {
              type: 'number',
              description: '調理時間（分）'
            },
            additionalIngredients: {
              type: 'array',
              items: {
                type: 'string'
              },
              maxItems: 3,
              description: '追加食材リスト（最大3つ）'
            },
            steps: {
              type: 'array',
              items: {
                type: 'string'
              },
              maxItems: 5,
              description: '手順リスト（最大5ステップ）'
            },
            tips: {
              type: 'string',
              description: 'コツ・アドバイス'
            }
          },
          required: ['title', 'description', 'difficulty', 'cookingTime', 'additionalIngredients', 'steps', 'tips']
        },
        minItems: 3,
        maxItems: 3,
        description: 'レシピ配列（3つ）'
      }
    },
    required: ['recipes']
  };
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
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
        responseJsonSchema: getRecipeJsonSchema(),
      },
    });

    // レスポンスからテキストを取得
    let text = response.text;
    
    // フォールバック: candidatesから直接テキストを取得
    if (!text && response.candidates && response.candidates.length > 0) {
      const firstCandidate = response.candidates[0];
      if (firstCandidate.content && firstCandidate.content.parts) {
        const textParts = firstCandidate.content.parts
          .filter((part: any) => part.text)
          .map((part: any) => part.text)
          .join('');
        if (textParts) {
          console.log('Using fallback text from candidates');
          text = textParts;
        }
      }
    }
    
    if (!text) {
      console.error('Empty response from Gemini API');
      console.error('Response object keys:', Object.keys(response));
      console.error('Response candidates:', response.candidates);
      return NextResponse.json(
        { error: 'レシピの生成に失敗しました。APIからの応答が空です' },
        { status: 500 }
      );
    }
    
    return processGeminiResponse(text);
  } catch (error) {
    console.error('API error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error details:', errorMessage);
    return NextResponse.json(
      { error: '予期しないエラーが発生しました', details: errorMessage },
      { status: 500 }
    );
  }
}

// Gemini APIレスポンスを処理する関数
// responseMimeType: 'application/json'が設定されているため、レスポンスはJSON形式で返される
function processGeminiResponse(text: string): NextResponse {
  console.log('Gemini API response length:', text.length);
  console.log('Gemini API response (first 500 chars):', text.substring(0, 500));

  // JSON形式で返されるため、直接パースを試みる
  let jsonText = text.trim();
  
  // 念のため、コードブロックを除去（通常は不要だが、互換性のため）
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/g, '');
  }
  
  jsonText = jsonText.trim();

  // JSONパース
  let recipeData: { recipes: any[] };
  try {
    recipeData = JSON.parse(jsonText);
    console.log('JSON parsed successfully, recipes count:', recipeData.recipes?.length);
    
    // レシピが3つあるか確認
    if (!recipeData.recipes || !Array.isArray(recipeData.recipes) || recipeData.recipes.length === 0) {
      console.error('Invalid recipes array:', recipeData);
      return NextResponse.json(
        { error: 'レシピの生成に失敗しました。レシピデータが不正です' },
        { status: 500 }
      );
    }
    
    // レシピが3つ未満の場合は警告をログに記録
    if (recipeData.recipes.length < 3) {
      console.warn(`Expected 3 recipes, but got ${recipeData.recipes.length}`);
    }
  } catch (parseError) {
    console.error('JSON parse error:', parseError);
    console.error('Response text length:', text.length);
    console.error('Response text (first 1000 chars):', text.substring(0, 1000));
    
    // デバッグ用: レスポンスの一部を返す（開発環境のみ）
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json(
        { 
          error: 'レシピの生成に失敗しました。JSONパースエラーが発生しました',
          debug: {
            originalTextLength: text.length,
            responsePreview: text.substring(0, 500),
            parseError: parseError instanceof Error ? parseError.message : String(parseError)
          }
        },
        { status: 500 }
      );
    }
    
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
}

