#!/bin/bash
# API動作確認用スクリプト

echo "=== API動作確認 ==="
echo "リクエスト送信中..."
curl -X POST http://localhost:3000/api/generate-recipe \
  -H "Content-Type: application/json" \
  -d @api-test/test-request.json \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s | python -m json.tool 2>/dev/null || cat

echo ""
echo "=== テスト完了 ==="

