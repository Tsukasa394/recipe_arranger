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
function processGeminiResponse(text: string): NextResponse {
  console.log('Gemini API response length:', text.length);
  console.log('Gemini API response (first 500 chars):', text.substring(0, 500));

    // JSONの抽出（```json や ``` で囲まれている可能性がある）
    let jsonText = text.trim();
    
    // コードブロックを除去
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/g, '');
    }
    
    // 先頭・末尾の不要な文字を除去
    jsonText = jsonText.trim();
    
    // JSONオブジェクトの開始位置を探す
    const jsonStart = jsonText.indexOf('{');
    
    if (jsonStart === -1) {
      console.error('No JSON object found in response');
      return NextResponse.json(
        { error: 'レシピの生成に失敗しました。JSON形式が見つかりません' },
        { status: 500 }
      );
    }
    
    // ネストされたJSONを正しく抽出するため、括弧のバランスを取る
    // 文字列内の括弧を無視する必要がある
    let braceCount = 0;
    let jsonEnd = -1;
    let inString = false;
    let escapeNext = false;
    
    for (let i = jsonStart; i < jsonText.length; i++) {
      const char = jsonText[i];
      
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      
      if (char === '"') {
        inString = !inString;
        continue;
      }
      
      if (!inString) {
        if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          if (braceCount === 0) {
            jsonEnd = i;
            break;
          }
        }
      }
    }
    
    if (jsonEnd === -1 || jsonEnd <= jsonStart) {
      console.error('Invalid JSON structure, braceCount:', braceCount);
      // フォールバック: 最後の}を使用（ただし、文字列内でないことを確認）
      let lastBrace = -1;
      let inStringFallback = false;
      let escapeNextFallback = false;
      
      for (let i = jsonText.length - 1; i >= jsonStart; i--) {
        const char = jsonText[i];
        
        if (escapeNextFallback) {
          escapeNextFallback = false;
          continue;
        }
        
        if (char === '\\') {
          escapeNextFallback = true;
          continue;
        }
        
        if (char === '"') {
          inStringFallback = !inStringFallback;
          continue;
        }
        
        if (!inStringFallback && char === '}') {
          lastBrace = i;
          break;
        }
      }
      
      if (lastBrace > jsonStart) {
        jsonEnd = lastBrace;
      } else {
        return NextResponse.json(
          { error: 'レシピの生成に失敗しました。JSON構造が不正です' },
          { status: 500 }
        );
      }
    }
    
    jsonText = jsonText.substring(jsonStart, jsonEnd + 1);

    // JSONパース
    let recipeData: { recipes: any[] };
    try {
      console.log('Attempting to parse JSON, length:', jsonText.length);
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
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Response text length:', text.length);
      console.error('Response text (first 1000 chars):', text.substring(0, 1000));
      console.error('Extracted JSON text length:', jsonText.length);
      console.error('Extracted JSON text (first 1000 chars):', jsonText.substring(0, 1000));
      console.error('Extracted JSON text (last 500 chars):', jsonText.substring(Math.max(0, jsonText.length - 500)));
      
      // エスケープされたJSON文字列の可能性をチェック
      try {
        const unescaped = jsonText.replace(/\\n/g, '\n').replace(/\\"/g, '"');
        recipeData = JSON.parse(unescaped);
        console.log('Successfully parsed after unescaping');
      } catch (secondParseError) {
        console.error('Second parse also failed:', secondParseError);
        
        // デバッグ用: レスポンスの一部を返す（開発環境のみ）
        if (process.env.NODE_ENV === 'development') {
          return NextResponse.json(
            { 
              error: 'レシピの生成に失敗しました。もう一度お試しください',
              debug: {
                originalTextLength: text.length,
                extractedJsonLength: jsonText.length,
                extractedJsonPreview: jsonText.substring(0, 500),
                extractedJsonEnd: jsonText.substring(Math.max(0, jsonText.length - 200))
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
    }

    // レスポンス形式に変換
    const recipeResponse: RecipeResponse = {
      recipes: recipeData.recipes || [],
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(recipeResponse);
}

