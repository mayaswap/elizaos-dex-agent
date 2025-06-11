# ElizaOS Complete Documentation

This document contains the complete ElizaOS documentation from https://eliza.how/llms-full.txt

## ElizaOS Overview

ElizaOS is a comprehensive AI agent framework with a monorepo structure containing core packages: Core (agent runtime, entities, actions, database), CLI (command-line interface), Client (frontend components), and various plugins. 

### Key Technical Components:
- **AgentRuntime**: Core execution environment for ElizaOS agents
- **Actions**: Define agent behaviors - executable capabilities for agents to respond and interact with systems
- **Providers**: Supply context to inform agent decisions in real time  
- **Evaluators**: Analyze conversations to extract insights and improve future responses
- **Services**: Enable functionality and platform integration
- **Characters**: Define personality and behavior
- **Database Adapters**: Handle persistence with support for PostgreSQL, SQLite, PGLite
- **Plugins**: Modular extensions that add new capabilities

### Database System:
- Vector-based semantic search for finding relevant memories
- Multi-level memory types (messages, facts, knowledge)
- Temporal awareness through timestamped memories
- Cross-platform continuity while maintaining appropriate context boundaries
- Support for PGLite (lightweight PostgreSQL) and full PostgreSQL

### Platform Integration:
- **Telegram**: Full bot integration with TelegramClientInterface
- **Discord**: Native Discord bot support
- **Twitter/X**: Social media integration
- **Web**: Browser-based interface
- **API**: RESTful API endpoints

## Telegram Integration Architecture

### TelegramClientInterface
Based on the official documentation, ElizaOS uses `TelegramClientInterface` from `@elizaos/client-telegram` package.

**Proper Usage Pattern:**
```typescript
import { TelegramClientInterface } from "@elizaos/client-telegram";

// Create Telegram client
const telegramClient = new TelegramClientInterface(runtime, process.env.TELEGRAM_BOT_TOKEN!);

// Start the client
await telegramClient.start();
```

### Character Configuration for Telegram
```json
{
  "clients": ["telegram"],
  "allowDirectMessages": true,
  "shouldOnlyJoinInAllowedGroups": false,
  "allowedGroupIds": [],
  "messageTrackingLimit": 100,
  "templates": {
    "telegramMessageHandlerTemplate": "Custom template here"
  },
  "secrets": {
    "key": "<telegram-bot-token>"
  }
}
```

### Environment Variables Required:
```bash
TELEGRAM_BOT_TOKEN=your-bot-token
ANTHROPIC_API_KEY=your-anthropic-key
POSTGRES_URL=postgresql://username:password@host:port/database
```

## AgentRuntime Implementation

### Core Runtime Creation:
```typescript
import {
    AgentRuntime,
    CacheManager,
    DbCacheAdapter,
    elizaLogger,
    FsCacheAdapter,
    stringToUuid,
    Character,
    defaultCharacter,
    ModelProviderName,
} from "@elizaos/core";
import { TelegramClientInterface } from "@elizaos/client-telegram";
import { PostgresDatabaseAdapter } from "@elizaos/adapter-postgres";
import { SqliteDatabaseAdapter } from "@elizaos/adapter-sqlite";

const runtime = new AgentRuntime({
    databaseAdapter: db,
    token: process.env.TELEGRAM_BOT_TOKEN!,
    modelProvider: ModelProviderName.ANTHROPIC,
    character,
    plugins: [bootstrapPlugin],
    providers: [],
    actions: actionList,
    services: [],
    managers: [],
    cacheManager: cache,
});
```

### Database Configuration:
- **PostgreSQL (Production)**: Use PostgresDatabaseAdapter with connection string
- **SQLite/PGLite (Development)**: Use SqliteDatabaseAdapter for local development

### Cache Management:
- DbCacheAdapter for database-backed caching
- FsCacheAdapter for file system caching

## Action System

Actions define what agents can do and follow this interface:
```typescript
interface Action {
    name: string;
    similes?: string[];
    description: string;
    validate: (runtime: IAgentRuntime, message: Memory, state?: State) => Promise<boolean>;
    handler: (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
        options?: any,
        callback?: HandlerCallback
    ) => Promise<boolean>;
    examples?: ActionExample[][];
    suppressInitialMessage?: boolean;
}
```

### Core Actions Include:
- REPLY: Standard text response
- GET_PRICE: Token price checks
- WALLET_MANAGEMENT: Enhanced wallet operations
- TRADING_ANALYTICS: Performance tracking
- PRICE_ALERTS: Monitoring and notifications
- SWAP: Token exchanges
- BALANCE: Account balance checks

## Memory and State Management

### Memory Types:
- **MESSAGE**: Conversation messages
- **DOCUMENT**: Knowledge documents  
- **FRAGMENT**: Document fragments
- **DESCRIPTION**: Entity descriptions
- **CUSTOM**: User-defined memory types

### State Composition:
```typescript
interface State {
    values: { [key: string]: any };
    data: { [key: string]: any };
    text: string;
}

// State building with providers
const state = await runtime.composeState(message, [
    'RECENT_MESSAGES',
    'CHARACTER',
    'KNOWLEDGE'
]);
```

## Plugin System

Plugins extend functionality through:
```typescript
interface Plugin {
    name: string;
    description: string;
    init?: (config: Record<string, string>, runtime: IAgentRuntime) => Promise<void>;
    services?: (typeof Service)[];
    actions?: Action[];
    providers?: Provider[];
    evaluators?: Evaluator[];
    routes?: Route[];
}
```

## Production Deployment

### Requirements:
- Node.js 23+
- Database (PostgreSQL recommended for production)
- Environment variables properly configured
- Telegram bot token from @BotFather

### Startup Process:
1. Initialize database connection
2. Load character configuration
3. Register all actions, providers, evaluators
4. Create AgentRuntime
5. Initialize TelegramClientInterface
6. Start the client

### Error Handling:
- Graceful shutdown handling
- Comprehensive logging with elizaLogger
- Error recovery mechanisms
- Rate limiting and API management

## Best Practices

1. **Database**: Use PostgreSQL for production, SQLite for development
2. **Security**: Never expose tokens, use environment variables
3. **Memory**: Implement proper cleanup and limits
4. **Actions**: Keep validation functions efficient
5. **State**: Cache expensive state computations
6. **Plugins**: Follow modular design principles
7. **Testing**: Use the built-in testing framework
8. **Monitoring**: Enable OpenTelemetry for production monitoring

This documentation should be referenced for all ElizaOS development and deployment decisions. 