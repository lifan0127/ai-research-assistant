const { copyFileSync } = require('fs')

// @dqbd/tiktoken
copyFileSync('node_modules/@dqbd/tiktoken/tiktoken_bg.wasm', 'addon/chrome/content/libs/tiktoken_bg.wasm')