# ちょい足しアレンジレシピアプリ

残り物の食材や料理を入力すると、Google Gemini APIがアレンジレシピを3つ提案するWebアプリケーションです。

## 📋 アプリケーションの概要

### コンセプト
「冷蔵庫の残り物が、プロ級の一品に変身！」

### 主な機能
- **食材入力**: 残り物や食材をカンマ区切りで入力
- **AI分析**: Gemini APIがアレンジレシピを3つ自動生成
- **レシピ表示**: カード形式でレシピを一覧表示
- **詳細表示**: モーダルウィンドウでレシピの詳細（手順・材料・コツ）を表示
- **お気に入り保存**: LocalStorageにレシピを保存
- **オプション設定**: 難易度や調理時間を指定可能

### 技術スタック
- **フレームワーク**: Next.js 16 (App Router)
- **言語**: TypeScript 5
- **スタイリング**: Tailwind CSS 4
- **AI API**: Google Gemini API (gemini-2.5-flash)
- **デプロイ**: Vercel

## 🚀 セットアップ方法

### 前提条件
- Node.js 18.x 以上
- npm, yarn, pnpm, または bun

### インストール手順

1. **リポジトリをクローン**
   ```bash
   git clone https://github.com/Tsukasa394/recipe_arranger.git
   cd recipe-arranger
   ```

2. **依存関係をインストール**
   ```bash
   npm install
   # または
   yarn install
   # または
   pnpm install
   ```

3. **環境変数を設定**
   
   プロジェクトルートに `.env.local` ファイルを作成し、以下の内容を追加してください：
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   
   > **注意**: Gemini APIキーは [Google AI Studio](https://makersuite.google.com/app/apikey) で取得できます。

4. **開発サーバーを起動**
   ```bash
   npm run dev
   # または
   yarn dev
   # または
   pnpm dev
   ```

5. **ブラウザで確認**
   
   [http://localhost:3000](http://localhost:3000) にアクセスしてアプリケーションを確認できます。

## 💻 使用方法

### 基本的な使い方

1. **食材を入力**
   - テキストエリアに残り物や食材をカンマ区切りで入力
   - 例: `残りカレー, ご飯, チーズ`

2. **オプションを設定（任意）**
   - 「オプション設定」をクリックして展開
   - 難易度と調理時間を設定

3. **レシピを生成**
   - 「レシピを生成」ボタンをクリック
   - AIが3つのアレンジレシピを提案します

4. **レシピを確認**
   - カード形式で表示されたレシピを確認
   - 「詳細を見る」ボタンで詳細情報を表示
   - お気に入りボタンでレシピを保存

### 入力例
- `残りカレー, ご飯, チーズ`
- `鶏もも肉, 玉ねぎ, じゃがいも`
- `冷やご飯, 卵, ベーコン`

## 📚 ドキュメント

詳細な仕様や設計については、以下のドキュメントを参照してください：

- **[プロダクト概要](./docs/design/product.md)**: プロジェクトの背景、目的、機能仕様
- **[システム仕様書](./docs/design/spec.md)**: 詳細な機能要件、API仕様、デプロイ仕様

## 🔧 ビルドとデプロイ

### 本番ビルド
```bash
npm run build
npm start
```

### Vercelへのデプロイ

1. [Vercel](https://vercel.com) にアカウントを作成
2. GitHubリポジトリをVercelにインポート
3. 環境変数 `GEMINI_API_KEY` を設定
4. 自動デプロイが実行されます

詳細は [デプロイ仕様書](./docs/design/spec.md#7-デプロイ仕様) を参照してください。

## 📝 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🤝 コントリビューション

プルリクエストやイシューの報告を歓迎します。詳細は [GitHub Issues](https://github.com/Tsukasa394/recipe_arranger/issues) をご確認ください。
