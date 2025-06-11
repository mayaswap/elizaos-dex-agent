# ElizaOS DEX Agent - Project Rules & Technical Guidelines

## ElizaOS Architecture Overview

This project follows ElizaOS framework architecture with these core components:

### Core Components
1. **AgentRuntime**: Foundation execution environment for the agent
2. **Actions**: Agent behaviors (swap, price, portfolio, etc.) 
3. **Providers**: Context providers for enhanced decision making
4. **Evaluators**: Learning and evaluation systems
5. **Services**: Core functionality services
6. **Characters**: Agent personality and configuration

### Package Structure
```
src/
├── actions/          # Trading actions (swap, price, etc.)
├── providers/        # Context providers (market data, portfolio)
├── evaluators/       # Learning evaluators (success, preferences)
├── services/         # Core services (price monitor, etc.)
├── utils/            # Utilities (parser, aggregator, helpers)
├── config/           # Configuration (chains, tokens)
├── types/            # TypeScript type definitions
└── index.ts          # ElizaOS runtime entry point
```

## Development Rules

### 1. Action Development
- **Structure**: All actions must follow ElizaOS Action interface:
  ```typescript
  interface Action {
    name: string;
    similes: string[];
    validate: (runtime: IAgentRuntime, message: Memory) => Promise<boolean>;
    handler: (runtime, message, state?, options?, callback?) => Promise<boolean>;
    description: string;
    examples: ActionExample[][];
  }
  ```
- **Validation**: Always implement proper validation in `validate` method
- **Error Handling**: Use try-catch blocks and proper error messages
- **Callback Pattern**: Use callback for user responses, return boolean for success/failure
- **Examples**: Provide comprehensive examples for training

### 2. Provider Development  
- **Context**: Providers supply contextual information to enhance agent decisions
- **Structure**: Follow provider interface with `get` method returning relevant data
- **Types**: Market data, portfolio info, gas optimization, user preferences
- **Caching**: Implement appropriate caching for expensive operations

### 3. Character Configuration
- **File**: `characters/dex-master.character.json`
- **Required Fields**: name, username, bio, style, topics, adjectives
- **Platform Specific**: Configure behavior for different platforms (telegram, discord, web)
- **Knowledge Base**: Reference knowledge files in `knowledge/` directory
- **Examples**: Provide messageExamples and postExamples for training

### 4. ElizaOS Runtime Initialization
- **Required Parameters**: 
  - `token`: API key for LLM (OpenAI, Anthropic, etc.)
  - `character`: Loaded character configuration
  - `plugins`: Array of ElizaOS plugins
- **Optional Parameters**:
  - `databaseAdapter`: For persistence (SQLite/PostgreSQL)
  - `actions`: Custom action array
  - `providers`: Context provider array  
  - `evaluators`: Learning evaluator array
  - `services`: Service array

### 5. Database & Persistence
- **Adapters**: Use ElizaOS database adapters (SQLite for dev, PostgreSQL for prod)
- **Memory**: Conversations and relationships are automatically persisted
- **Wallet Storage**: Implement secure wallet storage for multi-user support
- **Migration**: Plan database migrations for schema changes

### 6. Security Requirements
- **Environment Variables**: Never commit API keys or private keys
- **Input Validation**: Validate all user inputs thoroughly
- **Error Messages**: Don't expose sensitive information in error messages
- **Rate Limiting**: Implement rate limiting for API calls
- **Wallet Security**: Encrypt wallet private keys, use secure storage

### 7. Multi-Platform Support
- **Platforms**: Support Telegram, Discord, Web, API simultaneously
- **Message Formatting**: Adapt responses for each platform (emojis, markdown, etc.)
- **User Context**: Maintain user sessions across platforms
- **Configuration**: Platform-specific settings in character config

### 8. Testing Strategy
- **Unit Tests**: Test individual actions, providers, evaluators
- **Integration Tests**: Test complete workflows (swap, price queries)
- **E2E Tests**: Test multi-platform interactions
- **Mock APIs**: Use mocks for external API testing
- **Test Data**: Maintain test datasets for consistent testing

### 9. Performance Guidelines
- **Caching**: Cache expensive operations (price data, user balances)
- **Async Operations**: Use async/await for all I/O operations
- **Connection Pooling**: Reuse connections for database and APIs
- **Memory Management**: Clean up unused resources
- **Rate Limiting**: Respect API rate limits, implement backoff

### 10. Migration Strategy Rules
- **Gradual Migration**: Keep existing CLI agent as backup during migration
- **Compatibility**: Ensure 100% action compatibility between old and new systems
- **Testing**: Thoroughly test each phase before proceeding
- **Rollback Plan**: Maintain ability to rollback to previous version
- **Documentation**: Document all changes and migration steps

## ElizaOS Specific Implementation Notes

### Runtime Creation Pattern
```typescript
import { AgentRuntime } from "@elizaos/core";

const runtime = new AgentRuntime({
  token: process.env.OPENAI_API_KEY!,
  character: characterData,
  plugins: [bootstrapPlugin],
  actions: [...customActions],
  providers: [...contextProviders],
  evaluators: [...learningEvaluators],
  services: [...coreServices]
});
```

### Action Implementation Pattern
```typescript
const actionName: Action = {
  name: "ACTION_NAME",
  similes: ["ALIAS1", "ALIAS2"],
  validate: async (runtime, message) => {
    // Validation logic
    return true/false;
  },
  handler: async (runtime, message, state, options, callback) => {
    // Implementation
    if (callback) {
      callback({ text: "Response" });
    }
    return true; // success
  },
  description: "Action description",
  examples: [/* training examples */]
};
```

### Provider Implementation Pattern
```typescript
const providerName = {
  name: "provider_name",
  get: async (runtime, message) => ({
    // Context data
  })
};
```

## Technology Stack Rules

### Core Dependencies
- **ElizaOS Core**: `@elizaos/core` for runtime and types
- **TypeScript**: Strict typing for all code
- **Node.js**: ESM modules, async/await patterns
- **Database**: SQLite (dev) / PostgreSQL (prod)

### DEX Integration
- **9mm Aggregator**: Primary DEX aggregator for PulseChain
- **Ethers.js**: Blockchain interactions
- **GraphQL**: Subgraph queries for pool data
- **WebSocket**: Real-time price feeds

### Development Tools
- **tsx**: TypeScript execution
- **tsup**: Build tooling
- **vitest**: Testing framework
- **eslint/prettier**: Code formatting

## Deployment Guidelines

### Environment Configuration
- **Development**: Use SQLite, local testing
- **Staging**: PostgreSQL, full platform testing
- **Production**: PostgreSQL, monitoring, logging

### Platform Deployment
- **Telegram**: Bot token configuration
- **Discord**: Application ID and bot token
- **Web**: Port configuration, SSL certificates
- **API**: Rate limiting, authentication

### Monitoring & Logging
- **ElizaOS Logger**: Use built-in logging system
- **Error Tracking**: Implement error tracking (Sentry)
- **Metrics**: Track trading success, user engagement
- **Alerts**: Set up alerts for critical failures

## Quality Standards

### Code Quality
- **TypeScript**: 100% type coverage
- **ESLint**: No linting errors
- **Prettier**: Consistent formatting
- **Tests**: >80% test coverage

### Documentation
- **README**: Comprehensive setup and usage
- **API Docs**: Document all actions and providers
- **Knowledge Base**: Maintain DeFi education content
- **Migration Guide**: Document migration process

### Performance Targets
- **Response Time**: <2 seconds for most queries
- **Uptime**: 99.9% availability
- **Throughput**: Handle 100+ concurrent users
- **Memory**: Efficient memory usage, no leaks

---

**Note**: This project follows ElizaOS framework patterns and must maintain compatibility with the ElizaOS ecosystem while providing specialized DeFi trading functionality. 