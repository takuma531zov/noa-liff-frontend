#!/bin/bash

# 環境変数をconfig.jsに埋め込む
sed "s|{{LIFF_ID}}|${LIFF_ID}|g; s|{{GAS_BASE_URL}}|${GAS_BASE_URL}|g" config.template.js > config.js

echo "Build completed: config.js generated with environment variables"
