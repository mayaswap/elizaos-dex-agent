# 🚀 ElizaOS DEX Trading Agent

> **Multi-platform DEX Trading Agent powered by ElizaOS**

A sophisticated AI trading agent that operates across multiple platforms (Telegram, Discord, Web, API) to provide seamless DeFi trading experiences on PulseChain.

## 🎯 Project Overview

This project is a migration from a CLI-only DEX trading agent to a full-featured, multi-platform AI agent using the ElizaOS runtime. The agent specializes in:

- **DeFi Trading**: Automated token swaps with intelligent routing
- **Portfolio Management**: Real-time tracking and analytics
- **Liquidity Providing**: Automated LP position management
- **Risk Management**: Smart slippage and gas optimization
- **Educational Guidance**: Teaching users about DeFi safety

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
# Start the ElizaOS agent
npm run dev

# Or run the legacy CLI agent (backup)
npm run agent
```

### Production Mode
```bash
# Build the project
npm run build

# Start production server
npm start
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

## 📊 Migration Status

- ✅ **Phase 1**: Foundation Setup (Complete)
  - Package dependencies installed
  - Enhanced project structure
  - Environment configuration
  - Character enhancement

- 🚧 **Phase 2**: Runtime Migration (In Progress)  
  - ElizaOS entry point
  - Action compatibility
  - Provider implementation
  - Database adapter setup

- ⏳ **Phase 3**: Platform Integration (Planned)
  - Telegram bot setup
  - Discord integration  
  - Web interface deployment
  - API endpoint configuration

- ⏳ **Phase 4**: Advanced Features (Planned)
  - Learning evaluators
  - Enhanced providers
  - Memory system integration
  - Multi-user testing

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