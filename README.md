# 🚀 ElizaOS DEX Trading Agent

> **Deploy-Ready Multi-Platform DEX Trading Agent powered by ElizaOS**

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)
[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

A sophisticated AI trading agent that operates across multiple platforms (Telegram, Discord, Web, API) to provide seamless DeFi trading experiences on PulseChain. **Ready for one-click deployment!**

## 🎯 Project Overview

This project is a migration from a CLI-only DEX trading agent to a full-featured, multi-platform AI agent using the ElizaOS runtime. The agent specializes in:

- **DeFi Trading**: Automated token swaps with intelligent routing
- **Portfolio Management**: Real-time tracking and analytics
- **Liquidity Providing**: Automated LP position management
- **Risk Management**: Smart slippage and gas optimization
- **Educational Guidance**: Teaching users about DeFi safety

## ⚡ Quick Start - Deploy Now!

### Railway (Recommended)
1. **Click "Deploy on Railway" above**
2. **Set Environment Variables:**
   ```
   DEPLOYMENT_MODE=web
   OPENAI_API_KEY=your_openai_key
   ANTHROPIC_API_KEY=your_claude_key  # Recommended
   ```
3. **Deploy!** Your agent will be live in minutes 🎉

### Local Development
```bash
git clone https://github.com/your-username/elizaos-dex-agent.git
cd elizaos-dex-agent
npm install
npm run dev  # Starts all services (web + telegram)
```

### Docker
```bash
docker-compose up  # Full stack with database
# OR
docker run -p 3000:3000 -e DEPLOYMENT_MODE=web elizaos-dex-agent
```

## 🎯 Deployment Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| `web` | Web server + API | Public interface, REST API |
| `telegram` | Telegram bot only | Private trading bot |
| `all` | Web + Telegram + API | Full-featured deployment |

## 🚀 Features

### Multi-Platform Support
- **🤖 Telegram Bot**: Direct trading commands and portfolio tracking
- **💬 Discord Integration**: Community trading and market insights
- **🌐 Web Interface**: Advanced dashboard and analytics
- **🔌 REST API**: Programmatic access for external integrations

### Trading Capabilities
- Token swaps with optimal routing
- Real-time price monitoring
- Portfolio tracking and analytics
- Liquidity pool management
- Gas optimization strategies
- Slippage protection

### AI-Powered Features
- Natural language command processing
- Market trend analysis
- Personalized trading recommendations
- Risk assessment and warnings
- Learning from user preferences

## 🏗️ Architecture

```
├── src/
│   ├── index.ts              # ElizaOS runtime entry point
│   ├── agent.ts              # Legacy CLI agent (backup)
│   ├── actions/              # Trading actions (swap, price, etc.)
│   ├── providers/            # Context providers (market data, portfolio)
│   ├── evaluators/           # Learning evaluators (success, preferences)
│   ├── services/             # Core services (price monitor, etc.)
│   ├── utils/                # Utilities (wallet storage, helpers)
│   ├── config/               # Configuration management
│   └── types/                # TypeScript type definitions
├── characters/               # Agent character configurations
├── knowledge/                # DeFi knowledge base
└── .env.example             # Environment configuration template
```

## 🛠️ Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/elizaos-dex-agent.git
cd elizaos-dex-agent

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### Environment Configuration
```bash
# Core DEX Configuration
DEXSCREENER_API_KEY=your_api_key
GRAPHQL_ENDPOINT=https://graph.9mm.pro/subgraphs/name/pulsechain/9mm-v3-latest
DEFAULT_WALLET_PRIVATE_KEY=your_private_key

# Platform Integration
TELEGRAM_BOT_TOKEN=your_telegram_token
DISCORD_BOT_TOKEN=your_discord_token
OPENAI_API_KEY=your_openai_key

# Database (choose one)
POSTGRES_URL=postgresql://user:pass@localhost:5432/elizaos
# OR
SQLITE_DATA_DIR=./database
```

## 🚀 Usage

### Development Mode
```bash
# Start all services (web + telegram + API)
npm run dev

# Start specific mode
npm run web        # Web server only
npm run telegram   # Telegram bot only
npm run all        # All services
```

### Production Mode  
```bash
# Build and start
npm run build
npm start          # Uses DEPLOYMENT_MODE env var

# Or specify mode directly
npm run railway    # For Railway deployment
npm run heroku     # For Heroku deployment
```

### Environment Variables
```bash
# Required
DEPLOYMENT_MODE=web              # web, telegram, all
OPENAI_API_KEY=sk-...           # OpenAI API key
ANTHROPIC_API_KEY=sk-ant-...    # Claude API key (recommended)

# Optional
TELEGRAM_BOT_TOKEN=...          # For telegram mode
POSTGRES_URL=postgresql://...   # Production database
PORT=3000                       # Server port (auto-set by platforms)
```

### Platform-Specific Commands

#### Telegram
```
/swap 100 USDC for HEX
/price HEX
/portfolio
/help
```

#### Discord
```
@dexmaster swap 50 PLS for USDT
@dexmaster what's the price of PLSX?
@dexmaster show my portfolio
```

#### Web Interface
Access the web dashboard at `http://localhost:3000`

#### API Endpoints
```bash
# Get price information
GET /api/price/HEX

# Execute swap
POST /api/swap
{
  "fromToken": "USDC",
  "toToken": "HEX", 
  "amount": "100"
}

# Get portfolio
GET /api/portfolio
```

## 🧠 Knowledge Base

The agent includes comprehensive DeFi education:

- **DeFi Basics**: AMMs, liquidity pools, yield farming
- **PulseChain Guide**: Network specifics, native tokens, DEX usage
- **Trading Strategies**: Beginner to advanced techniques
- **Risk Management**: Safety practices and loss prevention
- **Liquidity Providing**: LP strategies and impermanent loss

## 🔧 Development

### Adding New Actions
```typescript
// src/actions/my-action.ts
export default {
  name: "MY_ACTION",
  similes: ["ALIAS1", "ALIAS2"],
  validate: async (runtime, message) => {
    // Validation logic
    return true;
  },
  handler: async (runtime, message, state, options, callback) => {
    // Action implementation
  }
};
```

### Adding Context Providers
```typescript
// src/providers/my-provider.ts
export const myProvider = {
  name: "my_data",
  get: async (runtime, message) => ({
    // Context data
  })
};
```

## 📊 Project Status - DEPLOYMENT READY! 🚀

- ✅ **Phase 1**: Foundation Setup (COMPLETE)
  - ✅ Enhanced project structure with 22 trading actions
  - ✅ ElizaOS integration and character setup
  - ✅ Environment configuration
  - ✅ Comprehensive database system

- ✅ **Phase 2**: Runtime Migration (COMPLETE)  
  - ✅ Full ElizaOS runtime integration
  - ✅ All 22 actions migrated and operational
  - ✅ Multi-database support (SQLite + PostgreSQL)
  - ✅ Enhanced wallet system with AES-256 encryption

- ✅ **Phase 3**: Platform Integration (COMPLETE)
  - ✅ Unified server.js deployment entry point
  - ✅ Multi-mode deployment (web/telegram/all)
  - ✅ Web interface with API endpoints
  - ✅ Telegram bot integration
  - ✅ Health checks and monitoring

- ✅ **Phase 4**: Deployment Infrastructure (COMPLETE)
  - ✅ One-click Railway/Heroku deployment
  - ✅ Docker containerization
  - ✅ Comprehensive environment configuration
  - ✅ Production-ready monitoring and logging
  - ✅ Multi-platform wallet isolation

## 🎉 **STATUS: PRODUCTION READY**

**All systems operational!** Deploy now with confidence:
- 🚀 **22 Trading Actions** - Complete DeFi toolkit
- 🧠 **Real AI Intelligence** - Claude/GPT integration
- 💾 **Database-Driven** - Persistent user data
- 🔐 **Secure Wallets** - AES-256 encryption
- 📱 **Multi-Platform** - Web, Telegram, API
- ⚡ **One-Click Deploy** - Railway/Heroku ready

## 🔒 Security

- **Private Key Management**: Encrypted wallet storage
- **API Authentication**: JWT-based security
- **Input Validation**: Comprehensive parameter validation
- **Rate Limiting**: Protection against abuse
- **Audit Logging**: Complete transaction history

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests if applicable
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the `/knowledge` directory
- **Issues**: Open a GitHub issue
- **Discord**: Join our community server
- **Telegram**: Contact @dexmaster

## ⚠️ Disclaimer

This software is for educational and research purposes. Trading cryptocurrencies involves significant financial risk. Always:

- Do your own research (DYOR)
- Never invest more than you can afford to lose
- Understand the risks of DeFi protocols
- Keep your private keys secure
- Start with small amounts for testing

---

**🚀 Ready to revolutionize DeFi trading with AI? Let's build the future together!** 