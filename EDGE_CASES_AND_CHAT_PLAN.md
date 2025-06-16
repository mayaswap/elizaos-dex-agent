# Edge Cases & Chatting Plan

## 🚨 Critical Edge Cases Analysis

### 1. **Transaction Flow Edge Cases**

#### Multiple Pending Transactions
**Issue**: User creates multiple swap requests before confirming
```
User: "swap 100 USDC for HEX"
Bot: "Confirm? Transaction ID: tx_123"
User: "swap 200 PLS for USDT"  
Bot: "Confirm? Transaction ID: tx_456"
User: "yes" ← Which transaction?
```

**Solution**: 
- Limit to 1 pending transaction per user
- Cancel previous pending when new one created
- Clear messaging about which transaction is active

#### Expired Transaction Confirmations
**Issue**: User confirms after 5-minute expiry
```
User: "swap 100 USDC for HEX"
Bot: "Confirm? Expires in 5 minutes"
[7 minutes later]
User: "yes"
Bot: ???
```

**Solution**:
- Clear expiry messaging with timestamps
- Graceful handling with new quote option
- Auto-cleanup expired transactions

#### Context Switching Mid-Transaction
**Issue**: User starts new conversation while transaction pending
```
User: "swap 100 USDC for HEX"
Bot: "Confirm? Transaction ID: tx_123"
User: "what's the price of PLS?"
Bot: "PLS is $0.0001"
User: "yes" ← Confusing context
```

**Solution**:
- Smart context detection
- Reminder of pending transaction
- Clear separation of query vs confirmation

### 2. **Wallet Management Edge Cases**

#### Wallet Deletion During Pending Transaction
**Issue**: User deletes active wallet while transaction pending
```
User: "swap 100 USDC for HEX"
Bot: "Confirm? Using Wallet 1"
User: "delete wallet 1"
Bot: "Wallet deleted"
User: "yes" ← No wallet to execute with
```

**Solution**:
- Block wallet deletion with pending transactions
- Auto-cancel transactions when wallet deleted
- Clear error messaging

#### Database/Session Inconsistency
**Issue**: Session shows wallet exists but database doesn't
```
Session: hasWallet = true, activeWalletId = "wallet_123"
Database: No wallet found with ID "wallet_123"
User: "swap 100 USDC for HEX"
Bot: Runtime error
```

**Solution**:
- Validation layer between session and database
- Auto-sync when inconsistencies detected
- Graceful fallback to wallet creation

#### Platform Switching
**Issue**: User starts transaction on Telegram, tries to confirm on Discord
```
Telegram User: "swap 100 USDC for HEX"
Telegram Bot: "Confirm? Transaction ID: tx_123"
Discord User: "yes" ← Different platform, same user
```

**Solution**:
- Platform-isolated transactions
- Cross-platform sync for premium users
- Clear platform-specific messaging

### 3. **Natural Language Edge Cases**

#### Ambiguous Confirmations
**Issue**: Unclear user responses
```
User: "swap 100 USDC for HEX"
Bot: "Confirm?"
User: "maybe" / "sure" / "ok i guess" / "yep do it"
```

**Solution**:
- Expand confirmation keyword detection
- Ask for explicit "yes" or "no" when ambiguous
- Provide example responses

#### Mixed Intent Messages
**Issue**: Multiple requests in one message
```
User: "swap 100 USDC for HEX and what's the price of PLS and show my balance"
Bot: ??? (Which intent to handle first?)
```

**Solution**:
- Parse multiple intents and prioritize
- Handle transaction intents first
- Acknowledge all intents in response

#### Typos and Misspellings
**Issue**: Users make typing errors
```
User: "swpa 100 usdc for hx"  
User: "waht's my ballance?"
User: "confirn the trade"
```

**Solution**:
- Fuzzy matching for common terms
- Autocorrect suggestions
- Graceful fallback to closest match

### 4. **Security Edge Cases**

#### Private Key Exposure
**Issue**: User accidentally shares sensitive info
```
User: "my private key is 0x123... can you help?"
User: "import wallet: 0x456..." (in public group)
```

**Solution**:
- Detect private key patterns
- Immediately warn and delete message
- Provide security education

#### Social Engineering
**Issue**: Someone else tries to confirm user's transaction
```
User A: "swap 100 USDC for HEX"
Bot: "Confirm? @UserA"
User B: "yes" (pretending to be User A)
```

**Solution**:
- Strict user ID verification
- Platform-specific user matching
- No cross-user confirmations

#### Session Hijacking
**Issue**: Someone gains access to user's session
```
Attacker uses User's session to confirm transactions
```

**Solution**:
- Short session timeouts for sensitive actions
- Additional verification for large transactions
- Anomaly detection (location, timing, patterns)

### 5. **Technical Edge Cases**

#### Network Failures
**Issue**: APIs unavailable during critical operations
```
User: "yes" (confirms transaction)
Bot tries to execute: 9mm API down / RPC unavailable
```

**Solution**:
- Retry logic with exponential backoff
- Clear error messaging with retry options
- Graceful degradation

#### Rate Limiting
**Issue**: Too many API calls hit limits
```
Multiple users requesting quotes simultaneously
9mm API returns 429 Rate Limited
```

**Solution**:
- Request queuing and throttling
- Caching for repeated requests
- Alternative API endpoints

#### Memory Overflow
**Issue**: SessionService grows too large
```
Thousands of users with pending transactions
Memory usage exceeds server limits
```

**Solution**:
- Aggressive cleanup of expired sessions
- LRU eviction for old sessions
- Persistent storage for critical data

## 💬 Comprehensive Chatting Plan

### 1. **Conversation State Management**

#### Context Tracking
```typescript
interface ConversationContext {
    lastIntent: string;
    pendingTransaction?: PendingTransaction;
    waitingForConfirmation: boolean;
    lastAction: string;
    conversationFlow: string[];
    userPreferences: {
        verbosity: 'minimal' | 'detailed' | 'verbose';
        language: string;
        timezone: string;
    };
}
```

#### Smart Intent Recognition
```typescript
class IntentClassifier {
    async classifyMessage(message: string, context: ConversationContext): Promise<{
        primaryIntent: string;
        secondaryIntents: string[];
        confidence: number;
        requiresWallet: boolean;
        isConfirmation: boolean;
        isCancellation: boolean;
    }> {
        // Multi-intent parsing with context awareness
    }
}
```

### 2. **Natural Language Processing**

#### Fuzzy Matching Strategy
```typescript
const FUZZY_MAPPINGS = {
    // Common typos and variations
    actions: {
        'swpa': 'swap',
        'swapp': 'swap', 
        'swapt': 'swap',
        'exchnage': 'exchange',
        'trdae': 'trade'
    },
    tokens: {
        'hx': 'HEX',
        'psl': 'PLS',
        'usdt': 'USDT',
        'usdc': 'USDC'
    },
    confirmations: {
        'yep': 'yes',
        'yup': 'yes',
        'sure': 'yes',
        'ok': 'yes',
        'confirm': 'yes',
        'nah': 'no',
        'nope': 'no',
        'cancel': 'no'
    }
};
```

#### Conversation Flow Templates
```typescript
const CONVERSATION_FLOWS = {
    newUser: [
        'greeting' → 'wallet_creation_prompt' → 'wallet_created' → 'first_action'
    ],
    existingUser: [
        'greeting' → 'action_request' → 'execution'
    ],
    transactionFlow: [
        'swap_request' → 'quote_display' → 'confirmation_prompt' → 'execution' → 'completion'
    ],
    errorRecovery: [
        'error_detection' → 'explanation' → 'suggested_action' → 'retry_or_help'
    ]
};
```

### 3. **Error Recovery Strategies**

#### Progressive Error Handling
```typescript
class ErrorRecoverySystem {
    async handleError(error: Error, context: ConversationContext): Promise<string> {
        if (error instanceof WalletNotFoundError) {
            return this.handleWalletRequired(context);
        }
        
        if (error instanceof TransactionExpiredError) {
            return this.handleExpiredTransaction(context);
        }
        
        if (error instanceof NetworkError) {
            return this.handleNetworkIssue(context);
        }
        
        return this.handleGenericError(error, context);
    }
    
    private handleWalletRequired(context: ConversationContext): string {
        return `🚨 **Wallet Required**
        
        I see you're trying to make a transaction, but you need a wallet first!
        
        **Quick setup:**
        • Type "create wallet" - I'll generate a secure wallet
        • Type "import wallet" - Use your existing private key
        
        This only takes 30 seconds and your wallet will be encrypted and secure! 🔒`;
    }
}
```

#### Smart Retry Logic
```typescript
class RetryManager {
    async retryWithBackoff<T>(
        operation: () => Promise<T>,
        maxRetries: number = 3,
        baseDelay: number = 1000
    ): Promise<T> {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                if (attempt === maxRetries) throw error;
                
                const delay = baseDelay * Math.pow(2, attempt - 1);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        throw new Error('Max retries exceeded');
    }
}
```

### 4. **User Experience Enhancements**

#### Conversational Helpers
```typescript
const HELPFUL_RESPONSES = {
    walletCreation: {
        success: "🎉 Awesome! Your wallet is ready. Try saying 'swap 100 USDC for HEX' to test it out!",
        error: "Oops! Something went wrong creating your wallet. Let me try again - this usually works perfectly."
    },
    
    transactionPending: {
        reminder: "⏳ Just a reminder: you have a pending swap waiting for confirmation. Reply 'yes' to proceed or 'no' to cancel.",
        expiringSoon: "⚠️ Your transaction quote expires in 1 minute! Reply 'yes' to execute or 'no' to cancel."
    },
    
    priceQueries: {
        quick: "📊 Quick price check coming up!",
        detailed: "📊 Here's the detailed price info you requested:"
    }
};
```

#### Context-Aware Responses
```typescript
class ContextualResponseGenerator {
    generateResponse(intent: string, context: ConversationContext, data: any): string {
        const template = this.getTemplate(intent, context);
        const personalizedTemplate = this.personalize(template, context);
        return this.populateTemplate(personalizedTemplate, data);
    }
    
    private getTemplate(intent: string, context: ConversationContext): string {
        // Return appropriate template based on:
        // - User's verbosity preference
        // - Previous conversation history
        // - Current context state
        // - Time of day / user timezone
    }
}
```

### 5. **Security & Safety Measures**

#### Input Sanitization
```typescript
class InputSanitizer {
    sanitizeMessage(message: string): {
        cleanMessage: string;
        containsPrivateKey: boolean;
        containsMnemonic: boolean;
        containsSensitiveData: boolean;
        warnings: string[];
    } {
        const warnings: string[] = [];
        
        // Detect private keys
        if (/0x[a-fA-F0-9]{64}/.test(message)) {
            warnings.push('PRIVATE_KEY_DETECTED');
        }
        
        // Detect mnemonic phrases
        if (this.isMnemonicPhrase(message)) {
            warnings.push('MNEMONIC_DETECTED');
        }
        
        return {
            cleanMessage: this.stripSensitiveData(message),
            containsPrivateKey: warnings.includes('PRIVATE_KEY_DETECTED'),
            containsMnemonic: warnings.includes('MNEMONIC_DETECTED'),
            containsSensitiveData: warnings.length > 0,
            warnings
        };
    }
}
```

#### Transaction Verification
```typescript
class TransactionVerifier {
    async verifyTransactionSafety(
        transaction: PendingTransaction,
        userContext: ConversationContext
    ): Promise<{
        isReasonable: boolean;
        warnings: string[];
        requiresAdditionalConfirmation: boolean;
    }> {
        const warnings: string[] = [];
        
        // Check for unusually large amounts
        if (this.isUnusuallyLargeAmount(transaction.amount)) {
            warnings.push('LARGE_AMOUNT_WARNING');
        }
        
        // Check for rapid successive transactions
        if (this.hasRecentTransactions(userContext)) {
            warnings.push('FREQUENT_TRADING_WARNING');
        }
        
        // Check price impact
        if (transaction.quote.estimatedPriceImpact > 5) {
            warnings.push('HIGH_PRICE_IMPACT_WARNING');
        }
        
        return {
            isReasonable: warnings.length === 0,
            warnings,
            requiresAdditionalConfirmation: warnings.length > 0
        };
    }
}
```

### 6. **Implementation Priority**

#### Phase 1: Core Edge Cases (Immediate)
1. ✅ Multiple pending transaction handling
2. ✅ Expired transaction cleanup  
3. ✅ Wallet-session consistency checks
4. ✅ Basic fuzzy matching for confirmations

#### Phase 2: Enhanced UX (Next Week)
1. 🔄 Smart context tracking
2. 🔄 Progressive error recovery
3. 🔄 Conversational helpers
4. 🔄 Multi-intent parsing

#### Phase 3: Advanced Features (Future)
1. 📅 Cross-platform synchronization
2. 📅 Advanced security detection
3. 📅 Machine learning intent classification
4. 📅 Personalized conversation styles

### 7. **Monitoring & Analytics**

#### Key Metrics to Track
```typescript
interface ChatMetrics {
    intentRecognitionAccuracy: number;
    conversationCompletionRate: number;
    errorRecoverySuccessRate: number;
    userSatisfactionScore: number;
    averageTransactionTime: number;
    commonFailurePoints: string[];
}
```

#### Error Logging Strategy
```typescript
class ChatErrorLogger {
    logConversationError(
        error: Error,
        context: ConversationContext,
        userMessage: string,
        expectedIntent: string,
        actualResponse: string
    ): void {
        // Log for analysis and improvement
    }
}
```

---

This comprehensive plan addresses the major edge cases and provides a robust foundation for natural, secure, and user-friendly chat interactions while maintaining the wallet-first transaction security model. 