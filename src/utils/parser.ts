import type { NaturalLanguageSwapParams } from '../types/index.js';
import { POPULAR_TOKENS } from '../config/chains.js';

// Simple cache to avoid multiple AI calls for the same input
const parseCache = new Map<string, { result: ParsedCommand; timestamp: number }>();
const CACHE_DURATION = 5000; // 5 seconds

/**
 * Enhanced Natural Language Command Parser
 * Improved version with better pattern matching and contextual understanding
 */

export interface ParsedCommand {
  intent: 'swap' | 'price' | 'balance' | 'portfolio' | 'help' | 'addLiquidity' | 'removeLiquidity' | 'poolQuery' | 'wallet' | 'unknown';
  fromToken?: string;
  toToken?: string;
  amount?: string;
  slippage?: number;
  confidence: number; // 0-1 confidence score
  rawInput: string;
  // V3 Liquidity specific fields
  feeTier?: string; // "2500", "10000", "20000"
  positionId?: string; // For remove liquidity
  percentage?: number; // For partial removals
  rangeType?: 'full' | 'concentrated' | 'custom'; // For add liquidity
  outOfRange?: boolean; // For filtering out-of-range positions
}

/**
 * Enhanced token symbol variations and aliases with fuzzy matching
 */
const TOKEN_ALIASES: Record<string, string> = {
  // Native tokens with variations
  'pulse': 'PLS',
  'pls': 'PLS',
  'pulsechain': 'PLS',
  
  // Ethereum mappings
  'ethereum': 'WETH',
  'eth': 'WETH',
  'ether': 'WETH',
  
  // Wrapped tokens
  'wrapped pulse': 'WPLS',
  'wpls': 'WPLS',
  'wrapped ethereum': 'WETH',
  'weth': 'WETH',
  
  // Stablecoins with variations
  'usdc': 'USDC',
  'usd coin': 'USDC',
  'usd-c': 'USDC',
  'usdt': 'USDT',
  'tether': 'USDT',
  'tether usd': 'USDT',
  'dai': 'DAI',
  'makerdao': 'DAI',
  
  // Popular tokens with variations
  'hex': 'HEX',
  'hexicans': 'HEX',
  'plsx': 'PLSX',
  'pulsex': 'PLSX',
  'pulse x': 'PLSX',
  'pulsex token': 'PLSX',
  '9mm': '9MM',
  'nine mm': '9MM',
  'ninemm': '9MM',
  '9 mm': '9MM',
  'nine millimeter': '9MM',
};

/**
 * Enhanced intent patterns with more comprehensive matching
 */
const INTENT_PATTERNS = {
  swap: [
    /\b(swap|exchange|trade|convert|change|turn)\b/i,
    /\b(buy|sell|purchase)\b/i,
    /\bfor\b/i,
    /\bto\b/i,
    /\binto\b/i,
    /\bwith\b/i,
    /→|->|=>|→/,
    /\bi\s+(want|need|would like)\s+to\s+(swap|exchange|trade|convert|buy|sell)/i,
    /\bcan\s+you\s+(swap|exchange|trade|convert)/i,
    /\bget\s+me\s+(some|a)\b/i,
    /\blooking\s+to\s+(buy|sell|swap|trade)/i,
    /\d+.*?(for|to|into|→)/i,
  ],
  
  price: [
    /\b(price|cost|rate|value|worth)\b/i,
    /\btrading\s+at\b/i,
    /\bquote\s+(for|on)\b/i,
    /\bwhat'?s\s+(the\s+)?(price|cost|rate|value)\b/i,
    /\bhow\s+much\s+(is|does|for)\b/i,
    /\bcurrent\s+price\b/i,
    /\bprice\s+check\b/i,
    /\bcheck\s+price\b/i,
    /\b\w+\s+(price|value|rate|cost)\b/i,
    /\bprice\s+of\s+\w+/i,
    /\bwhat'?s\s+\w+\s+trading\s+at/i,
    /\b\w+\s+to\s+usd\s+price/i,
  ],
  
  balance: [
    /\b(balance|holdings?|amount)\b/i,
    /\bhow\s+much\s+(do\s+i\s+have|have\s+i\s+got|\w+\s+do\s+i\s+have)/i,
    /\bshow\s+(my|me)\s+\w+/i,
    /\bmy\s+\w+\s+(balance|holdings?|amount)/i,
    /\bcheck\s+my\s+\w+/i,
    /\bwhat'?s\s+my\s+\w+/i,
    /\bwhat\s+is\s+my\s+balance\b/i,
    /\bwhat'?s\s+my\s+balance\b/i,
    /\bshow\s+my\s+balance\b/i,
    /\bcheck\s+my\s+balance\b/i,
    /\bmy\s+balance\b/i,
  ],
  
  portfolio: [
    /\b(portfolio|assets)\b/i,
    /\ball\s+(my\s+)?(tokens|assets|balances|holdings)/i,
    /\btotal\s+(value|worth|assets)/i,
    /\bnet\s+worth\b/i,
    /\bmy\s+holdings\b/i,
    /\bshow\s+my\s+portfolio\b/i,
    /\bportfolio\s+overview\b/i,
  ],
  
  help: [
    /\b(help|commands?|instructions?)\b/i,
    /\bwhat\s+can\s+you\s+do\b/i,
    /\bhow\s+(to|do\s+i)\b/i,
    /\bguide\b/i,
  ],
};

function extractTokensEnhanced(input: string): { tokens: string[], positions: number[] } {
  const normalizedInput = input.toLowerCase();
  const tokens: string[] = [];
  const positions: number[] = [];
  
  // Enhanced token detection with context awareness
  const tokenRegex = /\b([a-z]{2,8}|\d+[a-z]{2,8}|[a-z]+\d+[a-z]*)\b/gi;
  let match;
  
  while ((match = tokenRegex.exec(input)) !== null) {
    const candidate = match[1]?.toLowerCase();
    if (candidate) {
      const normalizedToken = normalizeTokenEnhanced(candidate);
      
      if (normalizedToken && normalizedToken !== 'UNKNOWN') {
        tokens.push(normalizedToken);
        positions.push(match.index);
      }
    }
  }
  
  return { tokens, positions };
}

function detectIntentEnhanced(input: string): { intent: ParsedCommand['intent'], score: number } {
  const normalizedInput = input.toLowerCase();
  let bestIntent: ParsedCommand['intent'] = 'unknown';
  let bestScore = 0;
  
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    let score = 0;
    
    for (const pattern of patterns) {
      if (pattern.test(normalizedInput)) {
        score += 1;
      }
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent as ParsedCommand['intent'];
    }
  }
  
  return { intent: bestIntent, score: bestScore };
}

function extractAmountEnhanced(input: string): string | undefined {
  const amountPatterns = [
    /(\d+(?:\.\d+)?)\s*(?:million|m)\b/i,
    /(\d+(?:\.\d+)?)\s*(?:thousand|k)\b/i,
    /(\d+(?:\.\d+)?)\b/,
  ];
  
  for (const pattern of amountPatterns) {
    const match = input.match(pattern);
    if (match && match[1]) {
      let amount = parseFloat(match[1]);
      
      if (input.toLowerCase().includes('million') || input.toLowerCase().includes('m')) {
        amount *= 1000000;
      } else if (input.toLowerCase().includes('thousand') || input.toLowerCase().includes('k')) {
        amount *= 1000;
      }
      
      return amount.toString();
    }
  }
  
  return undefined;
}

function normalizeTokenEnhanced(token: string): string {
  const lowerToken = token.toLowerCase();
  
  // Direct mapping
  if (TOKEN_ALIASES[lowerToken]) {
    return TOKEN_ALIASES[lowerToken];
  }
  
  // Check if it's already a valid token
  const upperToken = token.toUpperCase();
  if (POPULAR_TOKENS.pulsechain[upperToken as keyof typeof POPULAR_TOKENS.pulsechain]) {
    return upperToken;
  }
  
  return 'UNKNOWN';
}

function parseSwapEnhanced(input: string): ParsedCommand {
  const { tokens } = extractTokensEnhanced(input);
  const amount = extractAmountEnhanced(input);
  
  // Enhanced directional analysis
  const directionIndicators = ['for', 'to', 'into', '→', '->', '=>'];
  let fromToken: string | undefined;
  let toToken: string | undefined;
  
  if (tokens.length >= 2) {
    const inputLower = input.toLowerCase();
    
    // Find directional indicators
    for (const indicator of directionIndicators) {
      const index = inputLower.indexOf(indicator);
      if (index !== -1) {
        // Token before indicator is fromToken, after is toToken
        const beforeText = input.substring(0, index);
        const afterText = input.substring(index + indicator.length);
        
                 const beforeTokens = extractTokensEnhanced(beforeText).tokens;
         const afterTokens = extractTokensEnhanced(afterText).tokens;
         
         if (beforeTokens.length > 0 && beforeTokens[beforeTokens.length - 1]) {
           fromToken = beforeTokens[beforeTokens.length - 1];
         }
         if (afterTokens.length > 0 && afterTokens[0]) {
           toToken = afterTokens[0];
         }
        
        break;
      }
    }
    
         // Fallback: first token is from, last is to
     if (!fromToken || !toToken) {
       if (tokens[0]) fromToken = tokens[0];
       if (tokens[tokens.length - 1]) toToken = tokens[tokens.length - 1];
     }
  }
  
  const confidence = (fromToken && toToken && amount) ? 0.9 : 0.6;
  
  return {
    intent: 'swap',
    fromToken,
    toToken,
    amount,
    confidence,
    rawInput: input,
  };
}

function parsePriceEnhanced(input: string): ParsedCommand {
  const { tokens } = extractTokensEnhanced(input);
  
  // For price queries, we typically want the first valid token mentioned
  const fromToken = tokens[0];
  
  const confidence = fromToken ? 0.8 : 0.4;
  
  return {
    intent: 'price',
    fromToken,
    confidence,
    rawInput: input,
  };
}

function parseBalanceEnhanced(input: string): ParsedCommand {
  const { tokens } = extractTokensEnhanced(input);
  
  // For balance queries, look for the token after "my" or before "balance"
  const fromToken = tokens[0];
  
  const confidence = fromToken ? 0.8 : 0.6;
  
  return {
    intent: 'balance',
    fromToken,
    confidence,
    rawInput: input,
  };
}

export async function parseCommand(input: string): Promise<ParsedCommand> {
  // Check cache first
  const cached = parseCache.get(input);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.result;
  }
  
  const result = parseWithRegex(input);
  
  // Cache the result
  parseCache.set(input, { result, timestamp: Date.now() });
  
  return result;
}

function parseWithRegex(input: string): ParsedCommand {
  const { intent, score } = detectIntentEnhanced(input);
  
  if (score === 0) {
    return {
      intent: 'unknown',
      confidence: 0.1,
      rawInput: input,
    };
  }
  
  switch (intent) {
    case 'swap':
      return parseSwapEnhanced(input);
    case 'price':
      return parsePriceEnhanced(input);
    case 'balance':
      return parseBalanceEnhanced(input);
    case 'portfolio':
      return {
        intent: 'portfolio',
        confidence: 0.8,
        rawInput: input,
      };
    case 'help':
      return {
        intent: 'help',
        confidence: 0.9,
        rawInput: input,
      };
    default:
      return {
        intent: 'unknown',
        confidence: 0.2,
        rawInput: input,
      };
  }
}

export function getTokenAddress(symbol: string): string | null {
  return POPULAR_TOKENS.pulsechain[symbol as keyof typeof POPULAR_TOKENS.pulsechain] || null;
}

export function validateCommand(command: ParsedCommand): {
  isValid: boolean;
  errors: string[];
  suggestions?: string[];
} {
  const errors: string[] = [];
  
  if (command.intent === 'swap') {
    if (!command.fromToken) errors.push('Source token is required');
    if (!command.toToken) errors.push('Destination token is required');
    if (!command.amount) errors.push('Amount is required');
  }
  
  if (command.intent === 'price') {
    if (!command.fromToken) errors.push('Token symbol is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function formatCommand(command: ParsedCommand): string {
  switch (command.intent) {
    case 'swap':
      return `Swap ${command.amount} ${command.fromToken} for ${command.toToken}`;
    case 'price':
      return `Get price of ${command.fromToken}`;
    case 'balance':
      return `Check balance of ${command.fromToken || 'all tokens'}`;
    case 'portfolio':
      return 'Show portfolio overview';
    default:
      return command.rawInput;
  }
}

export function getExampleCommands(): Record<string, string[]> {
  return {
    swap: [
      'Swap 100 USDC for HEX',
      'Trade 50 PLS to USDT',
      'Exchange 0.5 WETH for PLSX',
    ],
    price: [
      'What\'s the price of HEX?',
      'PLS price',
      'How much is PLSX worth?',
    ],
    balance: [
      'What\'s my HEX balance?',
      'Check my USDC',
      'My PLS balance',
    ],
    portfolio: [
      'Show my portfolio',
      'Total assets',
      'Net worth',
    ],
  };
} 