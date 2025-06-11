import {
    Action,
    ActionExample,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    State,
} from "@elizaos/core";
import { parseCommand } from "../utils/parser.js";
import { ethers } from "ethers";

const tokenAllowanceAction: Action = {
    name: "TOKEN_ALLOWANCE",
    similes: [
        "ALLOWANCE_MANAGEMENT",
        "TOKEN_APPROVAL", 
        "SPENDING_LIMIT",
        "REVOKE_APPROVAL",
        "CHECK_ALLOWANCE"
    ],
    description: "Manage ERC20 token allowances - check, set, or revoke spending permissions for DEX contracts",
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const text = message.content.text.toLowerCase();
        
        const allowanceKeywords = [
            'allowance', 'approval', 'approve', 'revoke', 'spending limit',
            'permission', 'authorize', 'unlimited approval', 'check allowance',
            'set allowance', 'token permission', 'spending cap', 'approve tokens'
        ];
        
        return allowanceKeywords.some(keyword => text.includes(keyword));
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
        options?: any,
        callback?: HandlerCallback
    ) => {
        try {
            const text = message.content.text.toLowerCase();
            
            // Parse command type
            let action = 'check';
            if (text.includes('revoke') || text.includes('remove')) action = 'revoke';
            else if (text.includes('set') || text.includes('approve') || text.includes('authorize')) action = 'set';
            
            // Mock allowance data (in production, query blockchain)
            const mockAllowanceData = {
                currentAllowances: [
                    {
                        token: 'USDC',
                        tokenAddress: '0x15D38573d2feeb82e7ad5187aB8c1D52',
                        spender: '9mm Router',
                        spenderAddress: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
                        allowance: '115792089237316195423570985008687907853269984665640564039457584007913129639935',
                        isUnlimited: true,
                        lastApproved: '2024-12-20',
                        riskLevel: 'High'
                    },
                    {
                        token: 'HEX',
                        tokenAddress: '0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39',
                        spender: '9mm Router',
                        spenderAddress: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
                        allowance: '1000000000000000000000',
                        isUnlimited: false,
                        lastApproved: '2024-12-19',
                        riskLevel: 'Medium'
                    },
                    {
                        token: 'WPLS',
                        tokenAddress: '0x70499adEBB11Efd915E3b69E700c331778628707',
                        spender: 'Old Contract',
                        spenderAddress: '0x123...OLD',
                        allowance: '500000000000000000000',
                        isUnlimited: false,
                        lastApproved: '2024-10-15',
                        riskLevel: 'Critical'
                    }
                ],
                recommendations: [
                    {
                        type: 'revoke',
                        token: 'WPLS',
                        reason: 'Old contract - potential security risk',
                        priority: 'High'
                    },
                    {
                        type: 'limit',
                        token: 'USDC',
                        reason: 'Unlimited approval - consider setting spending limit',
                        priority: 'Medium'
                    }
                ]
            };

            let responseText = '';

            switch (action) {
                case 'check':
                    responseText = `🔐 **Token Allowance Overview**

**Current Approvals:**
${mockAllowanceData.currentAllowances.map((allowance, i) => {
    const riskIcon = allowance.riskLevel === 'Critical' ? '🔴' : 
                     allowance.riskLevel === 'High' ? '🟠' : 
                     allowance.riskLevel === 'Medium' ? '🟡' : '🟢';
    const amount = allowance.isUnlimited ? 'UNLIMITED' : 
                   `${(parseFloat(allowance.allowance) / 1e18).toLocaleString()} ${allowance.token}`;
    
    return `${i + 1}. **${allowance.token}** → ${allowance.spender}
   Amount: ${amount} ${riskIcon} ${allowance.riskLevel} Risk
   Approved: ${allowance.lastApproved}
   Address: ${allowance.spenderAddress.slice(0,8)}...`;
}).join('\n')}

**🚨 Security Recommendations:**
${mockAllowanceData.recommendations.map(rec => {
    const priorityIcon = rec.priority === 'High' ? '🔴' : rec.priority === 'Medium' ? '🟡' : '🟢';
    return `${priorityIcon} **${rec.type.toUpperCase()}** ${rec.token}: ${rec.reason}`;
}).join('\n')}

**🛡️ Best Practices:**
• Revoke unused approvals regularly
• Set spending limits instead of unlimited approvals
• Review approvals before major transactions
• Never approve unknown contracts

**Quick Actions:**
• "Revoke WPLS approval" - Remove old contract access
• "Set USDC allowance to $1000" - Limit spending amount
• "Approve HEX for trading" - Grant new permission`;
                    break;

                case 'revoke':
                    // Parse token from command
                    const revokeToken = text.includes('usdc') ? 'USDC' : 
                                       text.includes('hex') ? 'HEX' : 
                                       text.includes('wpls') ? 'WPLS' : 'UNKNOWN';
                    
                    responseText = `🔴 **Revoking Token Approval**

**Action:** Remove spending permission for ${revokeToken}
**Contract:** 9mm Router (0x7a25...2488D)
**Current Allowance:** ${revokeToken === 'USDC' ? 'UNLIMITED' : '1,000 tokens'}

**Transaction Details:**
• Gas Estimate: ~45,000 gas (~$0.15)
• Method: approve(spender, 0)
• Security: ✅ Safe operation

**⚠️ Impact:**
• Future trades will require new approval
• Existing trades/swaps will complete normally
• Protects against potential contract exploits

**Confirm to proceed:**
• "Yes, revoke ${revokeToken} approval"
• "Cancel revoke"

*Note: This is a demo - actual transaction would be sent to blockchain*`;
                    break;

                case 'set':
                    // Parse token and amount
                    const setToken = text.includes('usdc') ? 'USDC' : 
                                    text.includes('hex') ? 'HEX' : 
                                    text.includes('wpls') ? 'WPLS' : 'UNKNOWN';
                    
                    const amountMatch = text.match(/(\d+(?:\.\d+)?)/);
                    const amount = amountMatch ? amountMatch[1] : '1000';
                    
                    responseText = `🟢 **Setting Token Allowance**

**Token:** ${setToken}
**Spender:** 9mm Router (0x7a25...2488D)
**New Allowance:** ${amount} ${setToken}
**Current:** ${setToken === 'USDC' ? 'UNLIMITED' : 'No approval'}

**Transaction Details:**
• Gas Estimate: ~46,000 gas (~$0.16)
• Method: approve(spender, amount)
• Security: ✅ Limited spending amount

**💡 Smart Limits:**
• Recommended: Set 2-3x your typical trade size
• Current setting: ${amount} ${setToken}
• You can increase later if needed

**⚠️ Security Notes:**
• Only approve what you plan to spend
• This contract has been audited
• Revoke when done trading

**Confirm to proceed:**
• "Yes, approve ${amount} ${setToken}"
• "Set different amount"
• "Cancel approval"

*Note: This is a demo - actual transaction would be sent to blockchain*`;
                    break;
            }

            if (callback) {
                callback({
                    text: responseText
                });
            }

            return true;

        } catch (error) {
            console.error('Token allowance action error:', error);
            if (callback) {
                callback({
                    text: `❌ Failed to manage token allowances: ${error instanceof Error ? error.message : 'Unknown error'}`
                });
            }
            return false;
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "Check my token allowances" }
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll show you all your current token approvals and any security recommendations.",
                    action: "TOKEN_ALLOWANCE"
                }
            }
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Revoke USDC approval" }
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll help you revoke the USDC spending permission from the DEX contract for security.",
                    action: "TOKEN_ALLOWANCE"
                }
            }
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Set HEX allowance to 1000" }
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll set a limited spending allowance of 1000 HEX for the DEX router instead of unlimited approval.",
                    action: "TOKEN_ALLOWANCE"
                }
            }
        ]
    ] as ActionExample[][],
};

export default tokenAllowanceAction; 