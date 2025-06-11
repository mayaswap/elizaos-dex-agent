#!/bin/bash

# ElizaOS DEX Agent - Telegram Startup Script (SQLite for local testing)
echo "🚀 Starting ElizaOS DEX Agent for Telegram..."

# Set environment variables
export TELEGRAM_BOT_TOKEN="7832529066:AAFXtf1Rcs1qSU-J8Kt7rj7L3kbFYPOyLGY"
export ANTHROPIC_API_KEY="sk-ant-api03-AXHfxhLpJGLh-RY5mGrZhB7-JDqGDiZxNqOBqWZtZa4A0gnEt1RJx4i8L7WLXVjQjKYKdY5YIl_4_Xo28qfOVA-J1Jm2wAA"

# Force SQLite by explicitly unsetting Postgres
unset POSTGRES_URL
unset DATABASE_URL

# Add Bun to PATH
export PATH="$HOME/.bun/bin:$PATH"

echo "✅ Environment variables set"
echo "📱 Telegram Bot Token: ${TELEGRAM_BOT_TOKEN:0:20}..."
echo "🧠 AI Model: Anthropic"
echo "🗄️ Database: SQLite (local - forced)"

# Create data directory if it doesn't exist
mkdir -p ./data

# Start the agent with SQLite
echo "🚀 Starting DEX Master on Telegram..."
elizaos start --character="characters/telegram-dex-master.character.json" 