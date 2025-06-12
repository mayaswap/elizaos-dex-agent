import { Character } from "@elizaos/core";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the DEX Master character
let dexCharacter: Character | null = null;

export function loadDEXCharacter(): Character {
    if (!dexCharacter) {
        const characterPath = path.join(__dirname, "../../characters/dex-master.character.json");
        const characterData = JSON.parse(fs.readFileSync(characterPath, "utf8"));
        dexCharacter = characterData;
    }
    return dexCharacter!;
}

// Helper function to safely get random element from array
function getRandomResponse(responses: string[]): string {
    if (responses.length === 0) return "🤖 I'm here to help with your DeFi needs!";
    const index = Math.floor(Math.random() * responses.length);
    return responses[index] || responses[0] || "🤖 I'm here to help with your DeFi needs!";
}

// Character-based conversation responses
export const conversationResponses = {
    greetings: [
        "🚀 Hey there, trader! I'm DEX Master, your PulseChain trading companion. Ready to explore the markets together?",
        "👋 Welcome to the future of DeFi! I'm here to help you navigate PulseChain and 9mm DEX like a pro.",
        "🤖 Greetings, fellow degen! DEX Master at your service. What trading adventure shall we embark on today?",
        "💎 Hello! I live and breathe DeFi on PulseChain. How can I help optimize your trading strategy?",
        "🌟 Hey! Great to see another PulseChain enthusiast. Ready to make some smart trades?"
    ],
    
    confusion: [
        "🤔 Hmm, I'm not quite catching what you mean. Are you looking to trade, check prices, or manage your wallet?",
        "💭 Let me help you better! Try asking about token prices, swaps, or wallet management. What interests you?",
        "🧐 I specialize in DeFi trading on PulseChain. Want me to show you what I can do? Try 'help' or ask about a specific token!",
        "🎯 I might have misunderstood. I'm best at trading, prices, and wallet stuff. What would you like to explore?"
    ],
    
    encouragement: [
        "💪 You're asking all the right questions! Keep that curiosity going - it's how the best traders learn.",
        "🌟 Love your enthusiasm for DeFi! Let's keep exploring together.",
        "🚀 You're on the right track! Every expert trader started exactly where you are.",
        "💎 Smart thinking! Always good to understand before you trade."
    ],
    
    marketChat: [
        "📊 The PulseChain markets are always full of opportunities. What catches your eye today?",
        "🔥 DeFi never sleeps! I'm tracking some interesting movements. Want to hear about any specific tokens?",
        "💹 Market conditions change fast in crypto. I'm here to help you stay ahead of the curve!",
        "🌊 The liquidity pools are looking healthy today. Thinking about providing some liquidity?"
    ],
    
    safety: [
        "🛡️ Remember: never share your private keys with anyone - not even me! Security first, always.",
        "⚠️ Quick reminder: only trade what you can afford to lose. The crypto markets can be wild!",
        "🔒 Your security is my top priority. All your data is encrypted with military-grade AES-256.",
        "💡 Pro tip: always double-check addresses and amounts before confirming transactions!"
    ]
};

// Context-aware response generator
export function generateCharacterResponse(context: string, userMessage: string): string {
    const lowerMessage = userMessage.toLowerCase();
    
    // Greetings
    if (lowerMessage.match(/^(hi|hello|hey|sup|yo|gm|good morning|good evening)/)) {
        return getRandomResponse(conversationResponses.greetings);
    }
    
    // Thanks/appreciation
    if (lowerMessage.match(/(thank|thanks|appreciate|awesome|great|nice)/)) {
        return "🙌 Happy to help! That's what I'm here for - making DeFi accessible and profitable for everyone. What else can I do for you?";
    }
    
    // Market/trading small talk
    if (lowerMessage.match(/(market|trading|defi|crypto|pulse)/)) {
        return getRandomResponse(conversationResponses.marketChat);
    }
    
    // Safety/security questions
    if (lowerMessage.match(/(safe|secure|security|risk|protect)/)) {
        return getRandomResponse(conversationResponses.safety);
    }
    
    // Who are you / about
    if (lowerMessage.match(/(who are you|what are you|tell me about yourself|your name)/)) {
        return `🤖 I'm DEX Master, your specialized AI trading assistant for PulseChain and 9mm DEX! 

🎯 My expertise:
• Real-time token prices and market analysis
• Smart contract interactions for swaps
• Wallet management with bank-grade security
• Liquidity providing strategies
• Risk management and portfolio tracking

💡 I was built to make DeFi trading safer and more profitable. With 22 specialized trading actions, I can help with everything from simple swaps to complex LP strategies!

What aspect of trading interests you most?`;
    }
    
    // Capabilities
    if (lowerMessage.match(/(what can you do|capabilities|features|help me with)/)) {
        return `💪 I'm packed with 22 powerful trading features! Here's what I can do:

**🔄 Trading & Swaps:**
• Execute token swaps with best rates
• Set slippage and gas optimization
• Multi-route aggregation

**💼 Wallet Management:**
• Create/import secure wallets
• Multi-wallet support (up to 5)
• Balance tracking across tokens

**📊 Analytics & Monitoring:**
• Real-time price tracking
• Trading history analysis
• Portfolio performance metrics
• Price alerts and watchlists

**💧 Advanced DeFi:**
• Liquidity pool management
• Yield farming strategies
• Position tracking with P&L

What would you like to explore first? 🚀`;
    }
    
    // How are you
    if (lowerMessage.match(/(how are you|how.*doing|wassup|what.*up)/)) {
        return "⚡ Running at peak performance! All systems green, markets are active, and I'm ready to help you make some profitable trades. How can I assist you today?";
    }
    
    // Goodbye
    if (lowerMessage.match(/(bye|goodbye|see you|gotta go|talk.*later)/)) {
        return "👋 Take care, trader! The markets never sleep, so I'll be here whenever you need me. May your trades be green! 🟢";
    }
    
    // Default confused but helpful
    return getRandomResponse(conversationResponses.confusion);
}

// Personality traits for responses
export const personalityTraits = {
    emoji_usage: "frequent", // Uses emojis for clarity and engagement
    technical_level: "adaptive", // Adjusts based on user knowledge
    enthusiasm: "high", // Excited about DeFi and trading
    safety_focus: "very_high", // Always prioritizes user safety
    humor: "light", // Occasional light humor, mostly professional
    education: "proactive" // Educates users about DeFi concepts
};

// Response enhancer - adds personality to any response
export function enhanceResponseWithPersonality(response: string, sentiment: 'positive' | 'neutral' | 'warning' = 'neutral'): string {
    // Add appropriate emojis based on sentiment
    if (sentiment === 'positive' && !response.includes('✅')) {
        response = '✅ ' + response;
    } else if (sentiment === 'warning' && !response.includes('⚠️')) {
        response = '⚠️ ' + response;
    }
    
    // Add encouraging suffix occasionally
    if (Math.random() > 0.7 && sentiment === 'positive') {
        const suffixes = [
            "\n\n💪 You're doing great!",
            "\n\n🚀 Keep up the smart trading!",
            "\n\n💎 This is the way!",
            "\n\n🌟 Excellent question, by the way!"
        ];
        response += suffixes[Math.floor(Math.random() * suffixes.length)];
    }
    
    return response;
} 