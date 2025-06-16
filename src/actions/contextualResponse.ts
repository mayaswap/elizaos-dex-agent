import {
    ActionExample,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    State,
    type Action,
} from "@elizaos/core";
import { parseCommand } from "../utils/smartParser.js";
import { sessionService } from "../services/sessionService.js";
import { createPlatformUser } from "../services/walletService.js";
import { fuzzyMatcher } from "../utils/fuzzyMatching.js";

const contextualResponseAction: Action = {
    name: "CONTEXTUAL_RESPONSE",
    similes: [
        "CONTEXT_AWARE_RESPONSE",
        "PENDING_TRANSACTION_CONTEXT",
        "MULTI_INTENT_HANDLER"
    ],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const text = message.content.text;
        const platformUser = createPlatformUser(runtime as any, message);
        
        if (!platformUser) return false;
        
        // Only validate if user has pending transactions AND asks a non-confirmation question
        const pendingTx = sessionService.getPendingTransactions(platformUser);
        if (pendingTx.length === 0) return false;
        
        // Check if this is NOT a confirmation response
        const confirmationMatch = fuzzyMatcher.matchConfirmation(text);
        if (confirmationMatch.isConfirmation || confirmationMatch.isAmbiguous) {
            return false; // Let the confirmation action handle this
        }
        
        // Check if user is asking something else (price, balance, etc.)
        const parsed = await parseCommand(text);
        return parsed.intent === 'price' || parsed.intent === 'balance' || parsed.intent === 'help' || parsed.intent === 'wallet';
    },
    description: "Handle context-aware responses when users have pending transactions but ask other questions",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
        _options?: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        const text = message.content.text;
        const platformUser = createPlatformUser(runtime as any, message);
        
        if (!platformUser) {
            if (callback) {
                callback({
                    text: "❌ Unable to identify user. Please try again."
                });
            }
            return false;
        }

        // Get the pending transaction
        const pendingTransaction = sessionService.getMostRecentPendingTransaction(platformUser);
        
        if (!pendingTransaction) {
            return false; // No pending transaction, let other actions handle
        }

        // Parse the current request
        const parsed = await parseCommand(text);
        
        // Create contextual response based on what user asked
        let contextualResponse = "";
        const timeLeft = Math.ceil((pendingTransaction.expires - Date.now()) / 60000);
        
        if (parsed.intent === 'price') {
            // User asked for price while having pending transaction
            contextualResponse = `📊 I can get that price for you, but first - you have a pending transaction!

⏳ **Pending Trade:**
• ${pendingTransaction.amount} ${pendingTransaction.fromToken} → ${pendingTransaction.toToken}
• Expires in: ${timeLeft} minute${timeLeft === 1 ? '' : 's'}

**Quick Decision Needed:**
• Reply "yes" to confirm and execute the trade
• Reply "no" to cancel and then I'll get the price

*I want to make sure you don't miss your trade opportunity!* ⚠️`;
            
        } else if (parsed.intent === 'balance') {
            // User asked for balance while having pending transaction
            contextualResponse = `💰 I can check your balance, but you have an active trade waiting!

⏳ **Pending Trade:**
• ${pendingTransaction.amount} ${pendingTransaction.fromToken} → ${pendingTransaction.toToken}
• Expires in: ${timeLeft} minute${timeLeft === 1 ? '' : 's'}

**Confirm first, then check balance:**
• Reply "yes" to execute the trade
• Reply "no" to cancel, then I'll show your balance

*Your quote expires soon - decide quickly!* ⚡`;
            
        } else if (parsed.intent === 'wallet') {
            // User asked about wallet while having pending transaction
            contextualResponse = `👛 I can help with wallet info, but you have a trade waiting for confirmation!

⏳ **Pending Trade:**
• ${pendingTransaction.amount} ${pendingTransaction.fromToken} → ${pendingTransaction.toToken}
• Expires in: ${timeLeft} minute${timeLeft === 1 ? '' : 's'}

**Complete the trade first:**
• Reply "yes" to confirm and execute
• Reply "no" to cancel, then ask about wallets

*Don't let your quote expire!* 🚨`;
            
        } else if (parsed.intent === 'help') {
            // User asked for help while having pending transaction
            contextualResponse = `❓ I can provide help, but URGENT - you have an active trade!

⏳ **Pending Trade:**
• ${pendingTransaction.amount} ${pendingTransaction.fromToken} → ${pendingTransaction.toToken}
• Expires in: ${timeLeft} minute${timeLeft === 1 ? '' : 's'}

**First things first:**
• Reply "yes" to confirm this trade
• Reply "no" to cancel this trade
• Then I'll give you all the help you need

*Your trading quote expires in ${timeLeft} minute${timeLeft === 1 ? '' : 's'}!* ⏰`;
            
        } else {
            // Generic response for other intents
            contextualResponse = `⚠️ **Hold on!** You have a pending transaction that needs attention.

⏳ **Pending Trade:**
• ${pendingTransaction.amount} ${pendingTransaction.fromToken} → ${pendingTransaction.toToken}
• Expires in: ${timeLeft} minute${timeLeft === 1 ? '' : 's'}

**Please confirm or cancel first:**
• Reply "yes" to execute the trade
• Reply "no" to cancel the trade

After that, I'll help with: "${text}"

*Trading quotes expire quickly to protect you from price changes!* 🛡️`;
        }

        // Add expiry urgency if needed
        if (timeLeft <= 1) {
            contextualResponse += `\n\n🚨 **URGENT: Less than 1 minute left!** 🚨`;
        }

        if (callback) {
            callback({
                text: contextualResponse
            });
        }

        return true;
    },
    examples: [
        [
            {
                name: "{{user1}}",
                content: { text: "what's the price of HEX?" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "I can get the HEX price, but you have a pending swap that expires soon! Please confirm or cancel it first.",
                    action: "CONTEXTUAL_RESPONSE"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "show my balance" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "I'll check your balance after you handle your pending transaction. Please confirm or cancel it first.",
                    action: "CONTEXTUAL_RESPONSE"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "help" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "I can help you, but first please confirm or cancel your pending trade - it expires soon!",
                    action: "CONTEXTUAL_RESPONSE"
                }
            }
        ]
    ] as ActionExample[][],
};

export default contextualResponseAction; 