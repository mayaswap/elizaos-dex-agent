#!/bin/bash

# Ultra Minimal Test - No Database, No Plugins
echo "🧪 Testing Ultra Minimal DEX Master..."

# Clear any database URLs
unset POSTGRES_URL
unset DATABASE_URL

# Set minimal required variables
export TELEGRAM_BOT_TOKEN="7832529066:AAFXtf1Rcs1qSU-J8Kt7rj7L3kbFYPOyLGY"
export ANTHROPIC_API_KEY="sk-ant-api03-AXHfxhLpJGLh-RY5mGrZhB7-JDqGDiZxNqOBqWZtZa4A0gnEt1RJx4i8L7WLXVjQjKYKdY5YIl_4_Xo28qfOVA-J1Jm2wAA"

# Add Bun to PATH
export PATH="$HOME/.bun/bin:$PATH"

echo "✅ Ultra minimal environment set"
echo "🤖 Testing character without any plugins..."

# Start with ultra minimal character
elizaos start --character="characters/minimal-dex.character.json" 