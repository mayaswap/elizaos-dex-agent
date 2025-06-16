# 🚀 ElizaOS DEX Agent - Deployment Guide

Deploy your ElizaOS-powered DEX trading agent to any cloud platform in minutes!

## 🌟 Quick Start - One-Click Deployments

### Railway (Recommended)
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)

1. **Click "Deploy on Railway"**
2. **Set Environment Variables:**
   ```
   DEPLOYMENT_MODE=web
   OPENAI_API_KEY=your_key_here
   ANTHROPIC_API_KEY=your_claude_key_here
   ```
3. **Deploy and Done!** 🎉

### Heroku
```bash
# Clone and deploy
git clone https://github.com/your-username/elizaos-dex-agent.git
cd elizaos-dex-agent
heroku create your-app-name
heroku config:set DEPLOYMENT_MODE=web
heroku config:set OPENAI_API_KEY=your_key_here
git push heroku main
```

### Vercel
```bash
npm install -g vercel
vercel --prod
# Add environment variables in Veroku dashboard
```

## 🎯 Deployment Modes

Your ElizaOS DEX Agent supports multiple deployment modes:

| Mode | Description | Use Case |
|------|-------------|----------|
| `web` | Web server + API | Public web interface, REST API |
| `telegram` | Telegram bot only | Private Telegram trading bot |
| `discord` | Discord bot only | Discord server integration |
| `all` | All modes combined | Maximum flexibility |

## 🔧 Environment Configuration

### Required Variables
```bash
# AI Service (choose one or both)
OPENAI_API_KEY=sk-...                    # OpenAI API key
ANTHROPIC_API_KEY=sk-ant-...             # Claude API key (recommended)

# Deployment
DEPLOYMENT_MODE=web                       # web, telegram, discord, all
PORT=3000                                # Auto-set by platforms
```

### Optional Variables
```bash
# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token        # From @BotFather

# Database (production)
POSTGRES_URL=postgresql://...            # Auto-provided by Railway

# Security  
WALLET_ENCRYPTION_KEY=32_char_key        # For wallet encryption

# Blockchain
PULSECHAIN_RPC_URL=https://rpc.pulsechain.com
DEX_SUBGRAPH_URL=https://graph.9mm.pro/subgraphs/name/pulsechain/9mm-v3-latest
```

## 🏗️ Platform-Specific Guides

### Railway (Recommended)

**Why Railway?**
- ✅ Zero-config deployments
- ✅ Automatic HTTPS
- ✅ Built-in PostgreSQL
- ✅ Environment management
- ✅ Health checks

**Steps:**
1. Connect GitHub repo to Railway
2. Add environment variables:
   ```
   DEPLOYMENT_MODE=web
   OPENAI_API_KEY=your_key
   ANTHROPIC_API_KEY=your_claude_key
   ```
3. Railway auto-detects and deploys!

**Database:** Railway automatically provides PostgreSQL via `DATABASE_URL`

### Heroku

**Setup:**
```bash
# Install Heroku CLI
npm install -g heroku

# Create app
heroku create elizaos-dex-agent

# Set environment variables
heroku config:set DEPLOYMENT_MODE=web
heroku config:set OPENAI_API_KEY=your_key
heroku config:set ANTHROPIC_API_KEY=your_claude_key

# Deploy
git push heroku main
```

**Database:** Add Heroku Postgres addon:
```bash
heroku addons:create heroku-postgresql:hobby-dev
```

### Vercel

**Setup:**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

**Note:** Vercel is best for web-only mode. For Telegram bots, use Railway or Heroku.

### DigitalOcean App Platform

1. Create new app from GitHub
2. Set environment variables in dashboard
3. Choose Basic plan ($5/month)

### Google Cloud Run

```bash
# Build container
gcloud builds submit --tag gcr.io/PROJECT-ID/elizaos-dex-agent

# Deploy
gcloud run deploy --image gcr.io/PROJECT-ID/elizaos-dex-agent --platform managed
```

## 🤖 Telegram Bot Setup

1. **Create Bot:**
   - Message @BotFather on Telegram
   - Send `/newbot`
   - Choose name and username
   - Copy the token

2. **Deploy with Telegram:**
   ```bash
   # Set environment variables
   DEPLOYMENT_MODE=telegram  # or 'all' for web + telegram
   TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
   OPENAI_API_KEY=your_openai_key
   ```

3. **Test Bot:**
   - Search for your bot on Telegram
   - Send `/start`
   - Try: "what's the price of HEX?"

## 🌐 Web Interface Features

When deployed in `web` or `all` mode, you get:

- **Landing Page:** `https://your-app.com/`
- **Health Check:** `https://your-app.com/health`
- **Chat API:** `POST https://your-app.com/api/chat`
- **Interactive Demo:** Built-in chat interface

### API Usage
```javascript
// Chat with the agent via API
const response = await fetch('https://your-app.com/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "what's the price of HEX?",
    userId: "user123",
    platform: "web"
  })
});

const data = await response.json();
console.log(data.message); // AI response
```

## 💾 Database Configuration

### Development (SQLite)
- Automatic - no setup required
- Data stored in `./data/elizaos_dex.db`

### Production (PostgreSQL)
- **Railway:** Automatically provided
- **Heroku:** `heroku addons:create heroku-postgresql`
- **Manual:** Set `POSTGRES_URL=postgresql://...`

## 🔒 Security Best Practices

1. **Environment Variables:**
   - Never commit `.env` files
   - Use platform environment dashboards
   - Rotate API keys regularly

2. **Wallet Security:**
   - Set strong `WALLET_ENCRYPTION_KEY` (32 characters)
   - Use different keys per environment
   
3. **API Security:**
   - Enable rate limiting in production
   - Monitor usage patterns

## 🚨 Troubleshooting

### Common Issues

**Build Fails:**
```bash
# Clear cache and rebuild
npm run build
```

**Bot Not Responding:**
```bash
# Check logs for token issues
heroku logs --tail  # Heroku
railway logs        # Railway
```

**Database Connection:**
```bash
# Verify POSTGRES_URL is set
echo $POSTGRES_URL
```

### Debug Mode
```bash
# Enable debug logging
LOG_LEVEL=debug
DEBUG_MODE=true
```

## 📊 Monitoring

### Health Checks
- **URL:** `/health`
- **Status Codes:** 200 (healthy), 500 (error)
- **Response:** JSON with system status

### Logs
```bash
# View logs
heroku logs --tail          # Heroku
railway logs               # Railway  
vercel --logs              # Vercel
```

## 🎉 Success!

Your ElizaOS DEX Agent is now live! 

**Test it:**
- Web: Visit your deployment URL
- Telegram: Message your bot
- API: Send POST requests to `/api/chat`

**Features Available:**
- ✅ 22 DeFi trading actions
- ✅ Real AI intelligence (Claude/GPT)
- ✅ Secure wallet management
- ✅ Multi-platform support
- ✅ Real-time price data
- ✅ Database persistence

## 🆘 Support

- **Issues:** [GitHub Issues](https://github.com/your-repo/issues)
- **Documentation:** [ElizaOS Docs](https://github.com/elizaos/eliza)
- **Community:** [Discord](https://discord.gg/elizaos)

---

**Made with ❤️ using ElizaOS Framework** 