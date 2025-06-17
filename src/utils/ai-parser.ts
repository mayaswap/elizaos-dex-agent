import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import type { ParsedCommand } from './parser.js';
import { POPULAR_TOKENS } from '../config/chains.js';

// Load environment variables
dotenv.config();

// Initialize Anthropic client with proper environment variable handling
const getAnthropicKey = () => {
    return process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY; // Support both for backward compatibility
};

const client = new Anthropic({
    apiKey: getAnthropicKey(),
});

// Available tokens for validation
const AVAILABLE_TOKENS = Object.values(POPULAR_TOKENS.pulsechain);

/**
 * AI-Powered Natural Language Parser
 * Uses OpenAI to understand user commands with typos, variations, and natural language
 */
export class AIParser {
    private static instance: AIParser;
    private isEnabled: boolean = false;

    private constructor() {
        // Check if API key is available
        this.isEnabled = !!getAnthropicKey();
        if (!this.isEnabled) {
            console.log('🔧 AI parsing disabled - no ANTHROPIC_API_KEY or OPENAI_API_KEY found');
        }
    }

    public static getInstance(): AIParser {
        if (!AIParser.instance) {
            AIParser.instance = new AIParser();
        }
        return AIParser.instance;
    }

    /**
     * Parse natural language command using AI
     */
    public async parseCommand(input: string): Promise<ParsedCommand> {
        if (!this.isEnabled) {
            console.log('🔧 AI parser disabled - API key not found');
            throw new Error('AI parser not enabled - API key missing');
        }

        // Fast-track simple confirmations to avoid AI processing delays
        const trimmedInput = input.trim().toLowerCase();
        const simpleConfirmations = ['yes', 'no', 'confirm', 'cancel', 'ok', 'sure', 'nope', 'yeah', 'yep'];
        if (simpleConfirmations.includes(trimmedInput)) {
            console.log('🔧 Fast-tracking simple confirmation to avoid AI delays');
            return {
                intent: 'general_conversation',
                confidence: 0.05, // Very low to skip retries
                rawInput: input,
                fromToken: undefined,
                toToken: undefined,
                amount: undefined
            };
        }

        try {
            const systemPrompt = `You are an expert at parsing natural language commands for a DEX (Decentralized Exchange) trading interface.

Your job is to analyze user input and determine if it's:
1. A STRUCTURED COMMAND - specific trading/wallet actions that need parameters
2. TRANSACTION CONFIRMATION - simple yes/no responses to pending transactions
3. GENERAL CONVERSATION - greetings, questions, casual chat

IMPORTANT: Simple confirmations like "yes", "no", "confirm", "cancel" should be treated as GENERAL CONVERSATION so the fuzzy matcher can handle them properly.

Available Structured Command Intents:
- swap: Exchange one token for another (needs tokens/amounts)
- price: Get specific token price information  
- balance: Check wallet token balances
- wallet: Create/manage wallets
- address: Show wallet address
- addLiquidity: Add liquidity to pools (needs tokens/amounts)
- removeLiquidity: Remove liquidity from pools (needs position)
- poolQuery: Query specific pool information (needs tokens)
- portfolio: View portfolio overview

Available Tokens: ${AVAILABLE_TOKENS.join(', ')}

IMPORTANT RULES FOR TOKEN FIELD MAPPING:
- For "price" queries: The token being asked about goes in "fromToken" field
  Example: "price of PLS" → fromToken: "PLS", toToken: null
- For "swap" commands: Source token in "fromToken", destination in "toToken"
  Example: "swap PLS for HEX" → fromToken: "PLS", toToken: "HEX"
- For single token queries (balance, price): Use "fromToken" only
- If input is greeting/casual chat (hi, hello, how are you, etc.) → return "general_conversation"
- If input is vague questions without specific parameters → return "general_conversation"  
- Only parse as structured command if it has clear action + parameters

RESPONSE FORMAT - Return ONLY valid JSON:

For STRUCTURED COMMANDS:
{
  "intent": "swap|price|balance|wallet|addLiquidity|removeLiquidity|poolQuery|portfolio",
  "fromToken": "TOKEN_SYMBOL or null",
  "toToken": "TOKEN_SYMBOL or null", 
  "amount": "AMOUNT_STRING or null",
  "confidence": 0.95,
  "rawInput": "original input",
  "reasoning": "brief explanation"
}

For GENERAL CONVERSATION:
{
  "intent": "general_conversation",
  "fromToken": null,
  "toToken": null,
  "amount": null,
  "confidence": 0.95,
  "rawInput": "original input",
  "reasoning": "This is general conversation/greeting"
}

Examples:
Input: "hi" → {"intent": "general_conversation", "fromToken": null, "toToken": null, "amount": null, "confidence": 0.95, "rawInput": "hi", "reasoning": "This is a greeting"}
Input: "yes" → {"intent": "general_conversation", "fromToken": null, "toToken": null, "amount": null, "confidence": 0.95, "rawInput": "yes", "reasoning": "Simple confirmation - let fuzzy matcher handle it"}
Input: "no" → {"intent": "general_conversation", "fromToken": null, "toToken": null, "amount": null, "confidence": 0.95, "rawInput": "no", "reasoning": "Simple confirmation - let fuzzy matcher handle it"}
Input: "confirm" → {"intent": "general_conversation", "fromToken": null, "toToken": null, "amount": null, "confidence": 0.95, "rawInput": "confirm", "reasoning": "Simple confirmation - let fuzzy matcher handle it"}
Input: "price of PLS" → {"intent": "price", "fromToken": "PLS", "toToken": null, "amount": null, "confidence": 0.95, "rawInput": "price of PLS", "reasoning": "Price query for PLS token"}
Input: "swap 100 usdc for pls" → {"intent": "swap", "fromToken": "USDC", "toToken": "PLS", "amount": "100", "confidence": 0.95, "rawInput": "swap 100 usdc for pls", "reasoning": "Clear swap command with parameters"}
Input: "how are you?" → {"intent": "general_conversation", "fromToken": null, "toToken": null, "amount": null, "confidence": 0.95, "rawInput": "how are you?", "reasoning": "General question/conversation"}`;

            console.log('🤖 Calling Anthropic API...');
            const completion = await client.messages.create({
                model: "claude-3-haiku-20240307", // Fast and cost-effective model
                max_tokens: 200,
                temperature: 0.1, // Low temperature for consistent parsing
                system: systemPrompt,
                messages: [
                    { role: "user", content: input }
                ]
            });

            console.log('✅ Anthropic API response received');
            const response = completion.content[0]?.type === 'text' ? completion.content[0].text : null;
            if (!response) {
                throw new Error('No response from AI');
            }

            // Try to parse JSON response, but handle natural language gracefully
            let parsed;
            try {
                parsed = JSON.parse(response.trim());
            } catch (jsonError) {
                // If it's not JSON, it might be natural language - return low confidence for general chat
                console.log('🤖 AI returned natural language instead of JSON - this seems like general conversation');
                return {
                    intent: 'general_conversation',
                    confidence: 0.05, // Very low confidence to avoid repeated attempts
                    rawInput: input
                };
            }
            
            // Validate and normalize the response
            const result: ParsedCommand = {
                intent: this.validateIntent(parsed.intent),
                fromToken: this.normalizeToken(parsed.fromToken),
                toToken: this.normalizeToken(parsed.toToken),
                amount: parsed.amount || undefined,
                confidence: Math.min(Math.max(parsed.confidence || 0.5, 0), 1),
                rawInput: input,
                // Add any additional fields if needed
                slippage: parsed.slippage || undefined,
                feeTier: parsed.feeTier || undefined,
                positionId: parsed.positionId || undefined,
                percentage: parsed.percentage || undefined,
                rangeType: parsed.rangeType || undefined,
                outOfRange: parsed.outOfRange || undefined
            };

            console.log(`🤖 AI Parsed: "${input}" → ${result.intent} (${(result.confidence * 100).toFixed(0)}% confidence)`);
            if (parsed.reasoning) {
                console.log(`   Reasoning: ${parsed.reasoning}`);
            }

            return result;

        } catch (error: any) {
            // Provide detailed error information for debugging
            if (error.error?.type === 'authentication_error') {
                console.error('❌ Anthropic API Authentication Error - Invalid API key');
                console.error('💡 Check your ANTHROPIC_API_KEY in .env file');
            } else if (error.error?.type === 'rate_limit_error') {
                console.error('❌ Anthropic API Rate Limit - Please wait and try again');
            } else if (error.error?.type === 'api_error') {
                console.error('❌ Anthropic API Error:', error.error.message);
            } else if (error.message?.includes('JSON')) {
                console.error('❌ AI Response Parsing Error - Invalid JSON response');
                console.error('Response was:', error.message);
            } else {
                console.error('❌ AI Parser Error:', error.message);
                console.error('Full error:', error);
            }
            
            // Return low confidence for fallback to regex
            return {
                intent: 'general_conversation',
                confidence: 0.1,
                rawInput: input
            };
        }
    }

    /**
     * Validate and normalize intent
     */
    private validateIntent(intent: string): ParsedCommand['intent'] {
        const validIntents: ParsedCommand['intent'][] = [
            'swap', 'price', 'balance', 'wallet', 'address', 'addLiquidity', 
            'removeLiquidity', 'poolQuery', 'portfolio', 'general_conversation'
        ];
        
        return validIntents.includes(intent as any) ? intent as ParsedCommand['intent'] : 'general_conversation';
    }

    /**
     * Normalize token symbols
     */
    private normalizeToken(token: string | null): string | undefined {
        if (!token) return undefined;
        
        const upperToken = token.toUpperCase();
        
        // Direct match
        if (AVAILABLE_TOKENS.includes(upperToken)) {
            return upperToken;
        }
        
        // Common aliases
        const aliases: Record<string, string> = {
            'PULSE': 'PLS',
            'PULSECHAIN': 'PLS', 
            'ETHEREUM': 'WETH',
            'ETH': 'WETH',
            'WRAPPED_PLS': 'WPLS',
            'WRAPPEDPLS': 'WPLS',
            'USD_COIN': 'USDC',
            'USDCOIN': 'USDC',
            'TETHER': 'USDT',
            'DAI_STABLECOIN': 'DAI',
            'PULSEX': 'PLSX',
            'NINE_MM': '9MM',
            'NINEMM': '9MM'
        };
        
        return aliases[upperToken] || upperToken;
    }

    /**
     * Check if AI parsing is available
     */
    public isAvailable(): boolean {
        return this.isEnabled;
    }
}

/**
 * Convenience function to parse with AI
 */
export async function parseWithAI(input: string): Promise<ParsedCommand> {
    const parser = AIParser.getInstance();
    return await parser.parseCommand(input);
} 