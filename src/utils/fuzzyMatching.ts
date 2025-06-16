import { elizaLogger } from '@elizaos/core';

/**
 * Fuzzy matching utilities for handling user input variations
 */

export interface FuzzyMatch {
    input: string;
    match: string;
    confidence: number;
    type: 'exact' | 'fuzzy' | 'partial';
}

export class FuzzyMatcher {
    private static instance: FuzzyMatcher;

    // Common typos and variations
    private readonly FUZZY_MAPPINGS = {
        actions: {
            'swpa': 'swap',
            'swapp': 'swap',
            'swapt': 'swap',
            'swep': 'swap',
            'swap': 'swap',
            'exchnage': 'exchange',
            'exchange': 'exchange',
            'trdae': 'trade',
            'trade': 'trade',
            'buy': 'swap',
            'sell': 'swap',
            'convert': 'swap'
        },
        
        tokens: {
            'hx': 'HEX',
            'hex': 'HEX',
            'psl': 'PLS',
            'pls': 'PLS',
            'pulse': 'PLS',
            'usdt': 'USDT',
            'usdc': 'USDC',
            'usd': 'USDC',
            'plsx': 'PLSX',
            'pulsex': 'PLSX',
            'wpls': 'WPLS',
            'weth': 'WETH',
            'eth': 'WETH',
            '9mm': '9MM'
        },
        
        confirmations: {
            // Positive confirmations
            'yes': 'yes',
            'y': 'yes',
            'yep': 'yes',
            'yeah': 'yes',
            'yup': 'yes',
            'sure': 'yes',
            'ok': 'yes',
            'okay': 'yes',
            'confirm': 'yes',
            'confirmed': 'yes',
            'approve': 'yes',
            'approved': 'yes',
            'execute': 'yes',
            'proceed': 'yes',
            'go': 'yes',
            'go ahead': 'yes',
            'do it': 'yes',
            'lets go': 'yes',
            'lets do it': 'yes',
            'send it': 'yes',
            'good': 'yes',
            'correct': 'yes',
            'right': 'yes',
            'absolutely': 'yes',
            'definitely': 'yes',
            'affirmative': 'yes',
            
            // Negative confirmations
            'no': 'no',
            'n': 'no',
            'nah': 'no',
            'nope': 'no',
            'cancel': 'no',
            'cancelled': 'no',
            'abort': 'no',
            'stop': 'no',
            'deny': 'no',
            'reject': 'no',
            'declined': 'no',
            'decline': 'no',
            'wrong': 'no',
            'incorrect': 'no',
            'bad': 'no',
            'nevermind': 'no',
            'never mind': 'no',
            'wait': 'no',
            'hold on': 'no',
            'not now': 'no'
        },
        
        queries: {
            'price': 'price',
            'cost': 'price',
            'value': 'price',
            'worth': 'price',
            'quote': 'price',
            'rate': 'price',
            'balance': 'balance',
            'amount': 'balance',
            'holdings': 'balance',
            'wallet': 'wallet',
            'address': 'wallet',
            'help': 'help',
            'commands': 'help'
        }
    };

    // Ambiguous terms that need clarification
    private readonly AMBIGUOUS_TERMS = [
        'maybe', 'perhaps', 'i think so', 'i guess', 'probably', 
        'sort of', 'kind of', 'i suppose', 'possibly', 'might be',
        'not sure', 'unsure', 'hmm', 'um', 'uh', 'well'
    ];

    public static getInstance(): FuzzyMatcher {
        if (!FuzzyMatcher.instance) {
            FuzzyMatcher.instance = new FuzzyMatcher();
        }
        return FuzzyMatcher.instance;
    }

    /**
     * Match confirmation responses with fuzzy logic
     */
    public matchConfirmation(input: string): {
        isConfirmation: boolean;
        isPositive?: boolean;
        isNegative?: boolean;
        isAmbiguous: boolean;
        confidence: number;
        suggestion?: string;
    } {
        const cleanInput = this.cleanInput(input);
        
        // Check for ambiguous terms first
        if (this.isAmbiguous(cleanInput)) {
            return {
                isConfirmation: false,
                isAmbiguous: true,
                confidence: 0.8,
                suggestion: 'Please respond with "yes" to confirm or "no" to cancel'
            };
        }

        // Check exact matches first
        const exactMatch = this.FUZZY_MAPPINGS.confirmations[cleanInput];
        if (exactMatch) {
            return {
                isConfirmation: true,
                isPositive: exactMatch === 'yes',
                isNegative: exactMatch === 'no',
                isAmbiguous: false,
                confidence: 1.0
            };
        }

        // Check partial matches
        const partialMatch = this.findPartialMatch(cleanInput, this.FUZZY_MAPPINGS.confirmations);
        if (partialMatch) {
            return {
                isConfirmation: true,
                isPositive: partialMatch === 'yes',
                isNegative: partialMatch === 'no',
                isAmbiguous: false,
                confidence: 0.7
            };
        }

        // Check for confirmation context in longer messages
        const contextMatch = this.findConfirmationInContext(cleanInput);
        if (contextMatch) {
            return {
                isConfirmation: true,
                isPositive: contextMatch === 'yes',
                isNegative: contextMatch === 'no',
                isAmbiguous: false,
                confidence: 0.6
            };
        }

        return {
            isConfirmation: false,
            isAmbiguous: false,
            confidence: 0.0,
            suggestion: 'I\'m not sure what you mean. Please reply "yes" to confirm or "no" to cancel.'
        };
    }

    /**
     * Match action words (swap, trade, etc.)
     */
    public matchAction(input: string): FuzzyMatch | null {
        const cleanInput = this.cleanInput(input);
        return this.findFuzzyMatch(cleanInput, this.FUZZY_MAPPINGS.actions);
    }

    /**
     * Match token symbols
     */
    public matchToken(input: string): FuzzyMatch | null {
        const cleanInput = this.cleanInput(input).toUpperCase();
        return this.findFuzzyMatch(cleanInput, this.FUZZY_MAPPINGS.tokens);
    }

    /**
     * Clean and normalize input
     */
    private cleanInput(input: string): string {
        return input
            .toLowerCase()
            .trim()
            .replace(/[^\w\s]/g, '') // Remove punctuation
            .replace(/\s+/g, ' '); // Normalize spaces
    }

    /**
     * Check if input contains ambiguous terms
     */
    private isAmbiguous(input: string): boolean {
        return this.AMBIGUOUS_TERMS.some(term => input.includes(term));
    }

    /**
     * Find fuzzy match with confidence scoring
     */
    private findFuzzyMatch(input: string, mappings: Record<string, string>): FuzzyMatch | null {
        // Exact match
        if (mappings[input]) {
            return {
                input,
                match: mappings[input],
                confidence: 1.0,
                type: 'exact'
            };
        }

        // Partial match
        const partialMatch = this.findPartialMatch(input, mappings);
        if (partialMatch) {
            return {
                input,
                match: partialMatch,
                confidence: 0.7,
                type: 'partial'
            };
        }

        // Fuzzy match using edit distance
        const fuzzyMatch = this.findEditDistanceMatch(input, mappings);
        if (fuzzyMatch) {
            return {
                input,
                match: fuzzyMatch.value,
                confidence: fuzzyMatch.confidence,
                type: 'fuzzy'
            };
        }

        return null;
    }

    /**
     * Find partial matches (contains)
     */
    private findPartialMatch(input: string, mappings: Record<string, string>): string | null {
        for (const [key, value] of Object.entries(mappings)) {
            if (input.includes(key) || key.includes(input)) {
                return value;
            }
        }
        return null;
    }

    /**
     * Find confirmation context in longer messages
     */
    private findConfirmationInContext(input: string): string | null {
        const positivePatterns = [
            /\b(yes|confirm|execute|proceed|go ahead|do it)\b/,
            /\b(approve|accept|agree)\b/,
            /\b(correct|right|good)\b/
        ];

        const negativePatterns = [
            /\b(no|cancel|abort|stop|decline)\b/,
            /\b(wrong|incorrect|bad)\b/,
            /\b(wait|hold|not now)\b/
        ];

        if (positivePatterns.some(pattern => pattern.test(input))) {
            return 'yes';
        }

        if (negativePatterns.some(pattern => pattern.test(input))) {
            return 'no';
        }

        return null;
    }

    /**
     * Calculate edit distance and find closest match
     */
    private findEditDistanceMatch(
        input: string, 
        mappings: Record<string, string>
    ): { value: string; confidence: number } | null {
        let bestMatch: string | null = null;
        let bestScore = 0;

        for (const key of Object.keys(mappings)) {
            const distance = this.editDistance(input, key);
            const maxLength = Math.max(input.length, key.length);
            const similarity = 1 - (distance / maxLength);
            
            // Only consider matches with reasonable similarity
            if (similarity > 0.6 && similarity > bestScore) {
                bestScore = similarity;
                bestMatch = mappings[key];
            }
        }

        return bestMatch ? { value: bestMatch, confidence: bestScore } : null;
    }

    /**
     * Calculate Levenshtein distance
     */
    private editDistance(str1: string, str2: string): number {
        const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

        for (let i = 0; i <= str1.length; i += 1) {
            matrix[0][i] = i;
        }

        for (let j = 0; j <= str2.length; j += 1) {
            matrix[j][0] = j;
        }

        for (let j = 1; j <= str2.length; j += 1) {
            for (let i = 1; i <= str1.length; i += 1) {
                const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(
                    matrix[j][i - 1] + 1, // deletion
                    matrix[j - 1][i] + 1, // insertion
                    matrix[j - 1][i - 1] + indicator // substitution
                );
            }
        }

        return matrix[str2.length][str1.length];
    }

    /**
     * Provide helpful suggestions for unclear input
     */
    public getSuggestion(input: string, context: 'confirmation' | 'action' | 'token'): string {
        switch (context) {
            case 'confirmation':
                return `I'm not sure if you mean yes or no. Please reply:
• "yes" or "confirm" to proceed
• "no" or "cancel" to cancel`;

            case 'action':
                return `I couldn't understand the action. Try:
• "swap X for Y" - to trade tokens
• "price of X" - to check token price
• "my balance" - to check your balance`;

            case 'token':
                return `I couldn't find that token. Common tokens:
• HEX, PLS, USDC, USDT, PLSX, WPLS, 9MM
• Make sure to use the correct symbol`;

            default:
                return `I didn't understand that. Type "help" for available commands.`;
        }
    }
}

// Export singleton instance
export const fuzzyMatcher = FuzzyMatcher.getInstance(); 