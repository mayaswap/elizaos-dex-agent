#!/bin/bash

# Simple Telegram Test - No Database
echo "🧪 Testing Simple Telegram Bot..."

# Clear any database URLs
unset POSTGRES_URL
unset DATABASE_URL

# Set minimal required variables
export TELEGRAM_BOT_TOKEN="7832529066:AAFXtf1Rcs1qSU-J8Kt7rj7L3kbFYPOyLGY"
export ANTHROPIC_API_KEY="sk-ant-api03-AXHfxhLpJGLh-RY5mGrZhB7-JDqGDiZxNqOBqWZtZa4A0gnEt1RJx4i8L7WLXVjQjKYKdY5YIl_4_Xo28qfOVA-J1Jm2wAA"

# Add Bun to PATH
export PATH="$HOME/.bun/bin:$PATH"

echo "✅ Minimal environment set"
echo "📱 Telegram Bot Token: ${TELEGRAM_BOT_TOKEN:0:20}..."
echo "🤖 Testing simple character..."

# Start with simple character
elizaos start --character="characters/simple-telegram-dex.character.json" 