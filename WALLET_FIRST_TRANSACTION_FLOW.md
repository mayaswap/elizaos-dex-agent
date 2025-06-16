# Wallet-First Transaction Flow with Global Settings

This document explains the new enhanced trading system that implements:

1. **Wallet-First Flow**: Users must create wallets before transactions
2. **Global Settings in Memory**: Settings persist across all platforms  
3. **Transaction Confirmations**: All transactions require yes/no confirmation
4. **Simple Price Queries**: Price requests work without wallets

## 🏗️ System Architecture

### Core Components

1. **SessionService** (`src/services/sessionService.ts`)
   - Manages user sessions in memory
   - Stores global settings across platforms
   - Handles pending transaction confirmations
   - Auto-cleanup of expired sessions

2. **WalletGuard** (`src/utils/walletGuard.ts`)
   - Enforces wallet requirements for transactions
   - Validates user platform identification
   - Provides user-friendly wallet creation prompts

3. **Transaction Confirmation System**
   - Creates pending transactions with 5-minute expiry
   - Supports yes/no confirmation flow
   - Handles cancellation and execution

## 🔄 User Flow Examples

### First-Time User Experience

#### Step 1: User tries to make a transaction without wallet
```
User: "Swap 1000 USDC for HEX"

Bot: 🚨 **Wallet Required**

You need to create a wallet before making transactions!

**Quick Setup:**
• "Create wallet" - Generate new secure wallet
• "Import wallet" - Use existing private key
• "Import from mnemonic" - Use seed phrase

**Security Features:**
• AES-256 encryption
• Platform isolation
• Multi-wallet support (up to 5)
• Private key protection

Create your wallet now to get started! 🚀
```

#### Step 2: User creates wallet
```
User: "Create wallet"

Bot: 🎉 **New Wallet Created Successfully!**

**Platform:** TELEGRAM
**Wallet Name:** Wallet 1

📋 **Full Address (Tap to Copy):**
`0x742d35Cc6634C0532925a3b8D40cc62d33C4A35f`

✅ All trading features now unlocked!
Ready to start trading on PulseChain! 🚀
```

#### Step 3: User can now make transactions
```
User: "Swap 1000 USDC for HEX"

Bot: 🔄 **Swap Confirmation Required**

**Trade Details:**
• **Amount:** 1000 USDC → HEX
• **You'll receive:** ~22,345.67 HEX
• **Price Impact:** 0.12%
• **Slippage:** 0.5%
• **Gas Estimate:** ~150K gas units

⚠️ **This is a REAL transaction that will use your funds!**

**Confirm this trade?**
• Reply "yes" or "confirm" to execute
• Reply "no" or "cancel" to cancel
• Quote expires in 5 minutes

**Transaction ID:** `tx_1703123456789_abc123def`
```

#### Step 4: User confirms transaction
```
User: "yes"

Bot: 🔄 **Executing Transaction...**

Processing Trade:
• 1000 USDC → HEX
• Transaction ID: `tx_1703123456789_abc123def`

⏳ Please wait while we execute your trade on-chain...

---

✅ **Transaction Successful!**

**Completed Trade:**
• **Amount:** 1000 USDC → HEX
• **Transaction Hash:** `0x1234...abcd`
• **Status:** Confirmed on PulseChain

🎉 **Trade executed successfully!**
```

### Price Queries (No Wallet Required)

```
User: "What's the price of HEX?"

Bot: 📊 **HEX Price**

**Current Price:** $0.0045 USD
**Token:** HEX
**Decimals:** 8
**Address:** `0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39`

*Price sourced from 9mm price API on PulseChain*
```

## ⚙️ Global Settings Management

### Settings Stored in Memory
- **Slippage Percentage**: Default 0.5%
- **MEV Protection**: Default enabled
- **Auto Slippage**: Default disabled
- **Transaction Deadline**: Default 20 minutes
- **Gas Price Preference**: slow/standard/fast
- **Notifications**: Price alerts, transaction updates, portfolio changes

### Settings Persistence
- Settings are stored **in memory** for instant access
- Persist across all platforms (Telegram, Discord, Web, API)
- Automatic cleanup after 24 hours of inactivity
- Platform-isolated user identification

## 🔐 Security Features

### Wallet Security
- **AES-256 encryption** for private keys
- **Platform isolation** (telegram:userId, discord:userId, etc.)
- **Multi-wallet support** (up to 5 per platform user)
- **Secure key derivation** and storage

### Transaction Security
- **5-minute expiry** on pending transactions
- **User confirmation required** for all trades
- **Real-time quote validation**
- **Safe cancellation** preserves funds

### Session Security
- **Memory-only storage** for fast access
- **Automatic cleanup** of expired sessions
- **User isolation** by platform
- **No persistent sensitive data**

## 🚀 Implementation Details

### Database Schema
```sql
-- Wallets table (persistent)
CREATE TABLE wallets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    encryptedPrivateKey TEXT NOT NULL,
    userPlatformId TEXT NOT NULL,  -- e.g., "telegram:12345"
    platform TEXT NOT NULL,
    platformUserId TEXT NOT NULL,
    settings TEXT NOT NULL,  -- JSON encoded
    createdAt TEXT NOT NULL,
    lastUsed TEXT NOT NULL,
    isActive INTEGER NOT NULL DEFAULT 0
);

-- Sessions stored in memory only (no database table)
```

### Memory Management
```typescript
interface UserSession {
    platformUser: PlatformUser;
    hasWallet: boolean;
    activeWalletId?: string;
    settings: GlobalSettings;
    pendingTransactions: Map<string, PendingTransaction>;
    lastActivity: number;
}
```

### Platform User Identification
```typescript
interface PlatformUser {
    platform: 'telegram' | 'discord' | 'web' | 'api';
    platformUserId: string;
    platformUsername?: string;
    displayName?: string;
}

// Examples:
// telegram:123456789
// discord:987654321
// web:session_abc123
// api:key_def456
```

## 🔄 Action Flow

### Wallet-Required Actions
These actions require wallet creation first:
- `EXECUTE_SWAP`
- `ADD_LIQUIDITY`
- `REMOVE_LIQUIDITY`
- `ADVANCED_ORDERS`
- `TOKEN_ALLOWANCE`
- `TRANSACTION_HISTORY`

### Wallet-Not-Required Actions
These work without wallets:
- `GET_PRICE`
- `QUERY_POOLS` 
- `DEFI_ANALYTICS`
- `GAS_PRICE`

### Transaction Confirmation Flow
1. **Parse command** (e.g., "swap 1000 USDC for HEX")
2. **Check wallet requirement** via WalletGuard
3. **Get user settings** from SessionService
4. **Fetch quote** with user's preferred slippage
5. **Create pending transaction** with 5-minute expiry
6. **Show confirmation prompt** with transaction details
7. **Wait for user response** ("yes"/"no")
8. **Execute or cancel** based on user choice

## 📱 Multi-Platform Support

### Supported Platforms
- **Telegram**: Full feature support with inline buttons
- **Discord**: Full feature support with reactions
- **Web**: Full feature support with UI buttons
- **API**: Programmatic access to all features

### Platform Isolation
- Each platform maintains separate user accounts
- Wallets are isolated by platform
- Settings are shared across platforms for same user
- Cross-platform synchronization available

## 🛠️ Configuration

### Environment Variables
```bash
# Required
WALLET_ENCRYPTION_KEY=your-64-character-hex-key

# Platform Tokens
TELEGRAM_BOT_TOKEN=your-telegram-token
DISCORD_BOT_TOKEN=your-discord-token

# Database
DATABASE_URL=your-database-url

# 9mm DEX Configuration
NINEMM_API_URL=https://api.9mm.pro
NINEMM_GRAPH_URL=https://graph.9mm.pro/subgraphs/name/pulsechain/9mm-v3-latest
```

### Feature Flags
```typescript
// In sessionService.ts
const DEFAULT_SETTINGS = {
    slippagePercentage: 0.5,
    mevProtection: true,
    autoSlippage: false,
    transactionDeadline: 20,
    preferredGasPrice: 'standard'
};
```

## 🧪 Testing

### Test Wallet-First Flow
1. Start fresh (no wallets)
2. Try: "swap 100 USDC for HEX"
3. Should get wallet creation prompt
4. Create wallet: "create wallet"
5. Retry swap: "swap 100 USDC for HEX"
6. Should get confirmation prompt
7. Confirm: "yes"
8. Should execute transaction

### Test Price Queries
1. Try: "What's the price of HEX?"
2. Should get immediate price (no wallet required)

### Test Settings Persistence
1. Set slippage: "set slippage to 1%"
2. Switch platforms (if testing multi-platform)
3. Settings should persist in memory

## 🐛 Troubleshooting

### Common Issues

**"No wallet found"**
- User needs to create wallet first
- Check if sessionService has correct wallet status

**"Transaction expired"**
- Pending transactions expire after 5 minutes
- User needs to create new swap request

**"Settings not persisting"**
- Check sessionService memory storage
- Verify platform user identification

### Debug Commands
```typescript
// Check session stats
const stats = sessionService.getStats();

// Check user session
const session = sessionService.getSession(platformUser);

// Check pending transactions
const pending = sessionService.getPendingTransactions(platformUser);
```

## 🎯 Benefits

### User Experience
- **Clear onboarding flow** with wallet requirement
- **Safe transaction confirmations** prevent accidental trades
- **Instant price queries** for information gathering
- **Persistent settings** across platforms

### Security
- **Wallet-first architecture** ensures proper setup
- **Transaction confirmations** prevent mistakes
- **Memory-based sessions** for performance
- **Platform isolation** for security

### Development
- **Modular architecture** with clear separation
- **Easy testing** with predictable flows
- **Extensible design** for new features
- **Comprehensive error handling**

---

This system provides a robust, secure, and user-friendly trading experience that prioritizes security while maintaining ease of use across all supported platforms. 