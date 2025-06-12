#!/usr/bin/env node

import { parseWithAI } from './src/utils/ai-parser.js';
import { parseCommand as parseWithRegex } from './src/utils/parser.js';

const testCases = [
    "what about hex",           // User's exact issue
    "show my address",          // User's exact issue  
    "craete a walet for me",    // Typos that AI handles
    "how much is pls worth",    // Natural variations
    "tell me about hex price",  // Natural variations
];

async function compareParsingMethods() {
    console.log('🚀 AI vs Regex Parser Comparison\n');
    
    for (const input of testCases) {
        console.log(`Input: "${input}"`);
        
        try {
            const aiResult = await parseWithAI(input);
            console.log(`🤖 AI:    ${aiResult.intent} (${(aiResult.confidence * 100).toFixed(0)}%)`);
            
            const regexResult = await parseWithRegex(input);
            console.log(`📝 Regex: ${regexResult.intent} (${(regexResult.confidence * 100).toFixed(0)}%)`);
            
            if (aiResult.intent !== regexResult.intent) {
                console.log(`⚡ AI wins! "${aiResult.intent}" vs "${regexResult.intent}"`);
            }
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
        
        console.log('');
    }
}

if (process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY) {
    compareParsingMethods();
} else {
    console.log('Set ANTHROPIC_API_KEY to test AI parsing');
} 