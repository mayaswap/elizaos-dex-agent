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
     * Parse command using AI-first approach with regex fallback
     */
    public async parseCommand(input: string): Promise<ParsedCommand> {
        // Try AI parsing first if available
        if (this.aiParser.isAvailable()) {
            try {
                const aiResult = await parseWithAI(input);
                
                // If AI is confident, use its result
                if (aiResult.confidence >= 0.7) {
                    console.log(`🤖 Using AI parsing: "${input}" → ${aiResult.intent} (${(aiResult.confidence * 100).toFixed(0)}%)`);
                    return aiResult;
                }
                
                // If AI is less confident, try regex fallback
                console.log(`🤖 AI uncertain (${(aiResult.confidence * 100).toFixed(0)}%), trying regex fallback...`);
                
            } catch (error) {
                console.log(`🤖 AI parsing failed, falling back to regex:`, error);
            }
        }

        // Fallback to regex parsing
        const regexResult = await parseWithRegex(input);
        console.log(`📝 Using regex parsing: "${input}" → ${regexResult.intent} (${(regexResult.confidence * 100).toFixed(0)}%)`);
        
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