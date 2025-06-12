#!/usr/bin/env node

import { generateCharacterResponse } from './src/utils/characterResponses.js';

console.log('🤖 Testing DEX Master Character Responses\n');

const testMessages = [
    'hi',
    'hello there!',
    'hey',
    'who are you',
    'what can you do',
    'how are you',
    'thanks!',
    'awesome',
    'is this safe?',
    'tell me about the market',
    'bye',
    'random message that doesnt match',
    'help me',
    'I want to trade'
];

console.log('Testing various user inputs:\n');

testMessages.forEach(message => {
    console.log(`USER: "${message}"`);
    const response = generateCharacterResponse('telegram', message);
    console.log(`DEX MASTER: ${response}\n`);
    console.log('---\n');
});

console.log('✅ Character response test complete!'); 