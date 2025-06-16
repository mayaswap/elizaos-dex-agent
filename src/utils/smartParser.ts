import { parseWithAI, AIParser } from './ai-parser.js';
import { parseCommand as parseWithRegex } from './parser.js';
import type { ParsedCommand } from './parser.js';

/**
 * Smart Parser - AI-first with regex fallback
 * Uses AI for natural language understanding, falls back to regex if needed
 */
export class SmartParser {
    private static instance: SmartParser;
    private aiParser: AIParser;

    private constructor() {
        this.aiParser = AIParser.getInstance();
    }

    public static getInstance(): SmartParser {
        if (!SmartParser.instance) {
            SmartParser.instance = new SmartParser();
        }
        return SmartParser.instance;
    }

    /**
     * Simple cache to prevent multiple API calls for the same input
     */
    private static parseCache = new Map<string, { result: ParsedCommand; timestamp: number }>();
    private static CACHE_DURATION = 10000; // 10 seconds

    /**
     * Parse command using AI-first approach with regex fallback
     */
    public async parseCommand(input: string): Promise<ParsedCommand> {
        // Check cache first to avoid redundant API calls
        const cached = SmartParser.parseCache.get(input);
        if (cached && Date.now() - cached.timestamp < SmartParser.CACHE_DURATION) {
            console.log(`📋 Using cached result for "${input}"`);
            return cached.result;
        }
        // Try AI parsing first if available
        if (this.aiParser.isAvailable()) {
            try {
                const aiResult = await parseWithAI(input);
                
                // If AI is confident, use its result
                if (aiResult.confidence >= 0.7) {
                    console.log(`🤖 Using AI parsing: "${input}" → ${aiResult.intent} (${(aiResult.confidence * 100).toFixed(0)}%)`);
                    
                    // Cache the AI result
                    SmartParser.parseCache.set(input, { result: aiResult, timestamp: Date.now() });
                    
                    return aiResult;
                }
                
                // If AI confidence is very low (0.05), it's likely general conversation - skip retries
                if (aiResult.confidence <= 0.1) {
                    console.log(`🤖 AI detected general conversation - skipping retries`);
                    return aiResult;
                }
                
                // If AI is moderately uncertain, try regex fallback
                console.log(`🤖 AI uncertain (${(aiResult.confidence * 100).toFixed(0)}%), trying regex fallback...`);
                
            } catch (error) {
                console.log(`🤖 AI parsing failed, falling back to regex:`, error);
            }
        }

        // Fallback to regex parsing
        const regexResult = await parseWithRegex(input);
        console.log(`📝 Using regex parsing: "${input}" → ${regexResult.intent} (${(regexResult.confidence * 100).toFixed(0)}%)`);
        
        // Cache the result
        SmartParser.parseCache.set(input, { result: regexResult, timestamp: Date.now() });
        
        // Keep cache size manageable
        if (SmartParser.parseCache.size > 50) {
            const oldestKey = SmartParser.parseCache.keys().next().value;
            SmartParser.parseCache.delete(oldestKey);
        }
        
        return regexResult;
    }

    /**
     * Check if AI parsing is available
     */
    public isAIAvailable(): boolean {
        return this.aiParser.isAvailable();
    }
}

/**
 * Convenience function for smart parsing
 */
export async function parseCommand(input: string): Promise<ParsedCommand> {
    const parser = SmartParser.getInstance();
    return await parser.parseCommand(input);
}

// Export the instance for direct access if needed
export const smartParser = SmartParser.getInstance(); 