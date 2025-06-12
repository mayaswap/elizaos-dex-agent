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
            throw new Error('AI parser not enabled - API key missing');
        }

        try {
            const systemPrompt = `You are an expert at parsing natural language commands for a DEX (Decentralized Exchange) trading interface.

Your job is to analyze user input and extract:
1. Intent (what they want to do)
2. Parameters (tokens, amounts, etc.)

Available Intents:
- swap: Exchange one token for another
- price: Get token price information  
- balance: Check wallet token balances
- wallet: Create/manage wallets
- addLiquidity: Add liquidity to pools
- removeLiquidity: Remove liquidity from pools
- poolQuery: Query pool information
- portfolio: View portfolio overview
- help: Get help information
- unknown: Unrecognized command

Available Tokens: ${AVAILABLE_TOKENS.join(', ')}

Handle typos gracefully - if someone types "craete wallet" they mean "create wallet".
If someone says "walet" they mean "wallet". 
Be flexible with token names - "pulse" = "PLS", "ethereum" = "WETH", etc.

Return ONLY a valid JSON object with this exact structure:
{
  "intent": "swap|price|balance|wallet|addLiquidity|removeLiquidity|poolQuery|portfolio|help|unknown",
  "fromToken": "TOKEN_SYMBOL or null",
  "toToken": "TOKEN_SYMBOL or null", 
  "amount": "AMOUNT_STRING or null",
  "confidence": 0.95,
  "rawInput": "original input",
  "reasoning": "brief explanation of parsing"
}

Examples:
Input: "craete a walet for me"
Output: {"intent": "wallet", "fromToken": null, "toToken": null, "amount": null, "confidence": 0.9, "rawInput": "craete a walet for me", "reasoning": "User wants to create wallet despite typos"}

Input: "swap 100 usdc for pls"  
Output: {"intent": "swap", "fromToken": "USDC", "toToken": "PLS", "amount": "100", "confidence": 0.95, "rawInput": "swap 100 usdc for pls", "reasoning": "Clear swap command"}`;

            const completion = await client.messages.create({
                model: "claude-3-haiku-20240307", // Fast and cost-effective model
                max_tokens: 200,
                temperature: 0.1, // Low temperature for consistent parsing
                system: systemPrompt,
                messages: [
                    { role: "user", content: input }
                ]
            });

            const response = completion.content[0]?.type === 'text' ? completion.content[0].text : null;
            if (!response) {
                throw new Error('No response from AI');
            }

            // Parse the JSON response
            const parsed = JSON.parse(response.trim());
            
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

        } catch (error) {
            // Silently fail and return low confidence for fallback
            return {
                intent: 'unknown',
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
            'swap', 'price', 'balance', 'wallet', 'addLiquidity', 
            'removeLiquidity', 'poolQuery', 'portfolio', 'help', 'unknown'
        ];
        
        return validIntents.includes(intent as any) ? intent as ParsedCommand['intent'] : 'unknown';
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