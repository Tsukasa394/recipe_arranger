#!/bin/bash

# diagrams配下の全mmdファイルをSVGに変換するスクリプト
# 使用方法: ./convert-to-svg.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DIAGRAMS_DIR="$SCRIPT_DIR"
IMAGES_DIR="$SCRIPT_DIR/../images"

# imagesディレクトリが存在しない場合は作成
mkdir -p "$IMAGES_DIR"

# diagrams配下の全mmdファイルを処理
for file in "$DIAGRAMS_DIR"/*.mmd; do
  if [ -f "$file" ]; then
    filename=$(basename "$file" .mmd)
    echo "Converting: $filename.mmd -> $filename.svg"
    npx mmdc -i "$file" -o "$IMAGES_DIR/${filename}.svg" -w 1200
    
    if [ $? -eq 0 ]; then
      echo "✓ Successfully converted: $filename.svg"
    else
      echo "✗ Failed to convert: $filename.mmd"
    fi
  fi
done

echo "Conversion completed."

