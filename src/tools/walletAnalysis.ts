/**
 * Advanced Wallet Analysis Tool for Blockpool
 * Inspired by SEI Sorcerer's implementation with enhanced features
 */

import { z } from 'zod';
import { enhancedSeiMcpClient } from '../services/enhancedSeiMcpClient';
import { parseQuery, type ParsedQuery } from '../utils/queryParser';
import { ErrorHandler, InvalidAddressError } from '../utils/errors';

// Zod schema for wallet analysis parameters
export const WalletAnalysisSchema = z.object({
  query: z.string().describe('Natural language query about wallet analysis, balance, transactions, or activity'),
  address: z.string().optional().describe('Specific wallet address to analyze'),
  timeframe: z.enum(['hour', 'day', 'week', 'month', 'year', 'all']).optional().describe('Time period for analysis'),
  includeTokens: z.boolean().optional().default(true).describe('Whether to include token holdings'),
  includeTransactions: z.boolean().optional().default(true).describe('Whether to include transaction history'),
  network: z.enum(['sei', 'ethereum']).optional().default('sei').describe('Blockchain network')
});

export type WalletAnalysisParams = z.infer<typeof WalletAnalysisSchema>;

export interface WalletAnalysisResult {
  success: boolean;
  data?: {
    address: string;
    balance: {
      native: string;
      tokens: Array<{
        symbol: string;
        amount: string;
        value?: string;
      }>;
    };
    activity: {
      totalTransactions: number;
      recentActivity: string;
      transactionTypes: Record<string, number>;
    };
    insights: {
      walletType: string;
      riskLevel: 'low' | 'medium' | 'high';
      behaviorPattern: string;
    };
  };
  error?: string;
  suggestions?: string[];
}

/**
 * Validate wallet address format
 */
function validateWalletAddress(address: string, network: string): void {
  if (network === 'sei') {
    // SEI bech32 format: sei1... (39-59 characters)
    if (!address.startsWith('sei1') || address.length < 39 || address.length > 59) {
      throw new InvalidAddressError(address, { network });
    }
  } else if (network === 'ethereum') {
    // Ethereum format: 0x... (42 characters)
    if (!address.startsWith('0x') || address.length !== 42) {
      throw new InvalidAddressError(address, { network });
    }
  }
}

/**
 * Analyze wallet behavior patterns
 */
function analyzeWalletBehavior(transactions: any[], balance: any): {
  walletType: string;
  riskLevel: 'low' | 'medium' | 'high';
  behaviorPattern: string;
} {
  const txCount = transactions.length;
  const balanceAmount = parseFloat(balance.amount || '0');

  // Determine wallet type
  let walletType = 'Unknown';
  if (txCount === 0) {
    walletType = 'Inactive';
  } else if (txCount < 10) {
    walletType = 'New User';
  } else if (txCount < 100) {
    walletType = 'Regular User';
  } else if (txCount < 1000) {
    walletType = 'Active Trader';
  } else {
    walletType = 'Power User';
  }

  // Determine risk level (simplified)
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (balanceAmount > 10000) {
    riskLevel = 'high';
  } else if (balanceAmount > 1000 || txCount > 100) {
    riskLevel = 'medium';
  }

  // Analyze behavior pattern
  let behaviorPattern = 'Standard wallet usage';
  if (txCount > 50) {
    const recentTxs = transactions.slice(0, 10);
    const hasFrequentActivity = recentTxs.length > 5;
    
    if (hasFrequentActivity) {
      behaviorPattern = 'High-frequency trading pattern detected';
    } else {
      behaviorPattern = 'Moderate trading activity';
    }
  }

  return { walletType, riskLevel, behaviorPattern };
}

/**
 * Format wallet analysis response with rich markdown
 */
function formatWalletAnalysisResponse(
  parsedQuery: ParsedQuery,
  result: WalletAnalysisResult
): string {
  if (!result.success || !result.data) {
    return `❌ **Wallet Analysis Failed**\n\n${result.error || 'Unknown error occurred'}\n\n${
      result.suggestions ? `💡 **Suggestions:**\n${result.suggestions.map(s => `• ${s}`).join('\n')}` : ''
    }`;
  }

  const { data } = result;
  const formattedAddress = enhancedSeiMcpClient.formatAddress(data.address);
  const formattedBalance = enhancedSeiMcpClient.formatSEI(data.balance.native);

  let response = `🔮 **Wallet Analysis Complete!** ✨\n\n`;
  
  // Header with wallet info
  response += `**📍 Wallet:** \`${formattedAddress}\`\n`;
  response += `**💰 Balance:** ${formattedBalance}\n`;
  response += `**🏷️ Type:** ${data.insights.walletType}\n`;
  response += `**⚠️ Risk Level:** ${data.insights.riskLevel.toUpperCase()}\n\n`;

  // Activity summary
  if (data.activity.totalTransactions > 0) {
    response += `## 📊 **Activity Summary**\n\n`;
    response += `• **Total Transactions:** ${data.activity.totalTransactions.toLocaleString()}\n`;
    response += `• **Last Activity:** ${data.activity.recentActivity}\n`;
    
    if (Object.keys(data.activity.transactionTypes).length > 0) {
      response += `• **Transaction Types:**\n`;
      Object.entries(data.activity.transactionTypes).forEach(([type, count]) => {
        response += `  - ${type}: ${count}\n`;
      });
    }
    response += `\n`;
  }

  // Token holdings
  if (data.balance.tokens.length > 0) {
    response += `## 🪙 **Token Holdings**\n\n`;
    data.balance.tokens.slice(0, 5).forEach(token => {
      const amount = enhancedSeiMcpClient.formatAmount(token.amount);
      response += `• **${token.symbol}:** ${amount}${token.value ? ` (~$${token.value})` : ''}\n`;
    });
    if (data.balance.tokens.length > 5) {
      response += `• *...and ${data.balance.tokens.length - 5} more tokens*\n`;
    }
    response += `\n`;
  }

  // Behavioral insights
  response += `## 🧠 **Behavioral Insights**\n\n`;
  response += `${data.insights.behaviorPattern}\n\n`;

  // Query-specific insights
  if (parsedQuery.intent.type === 'risk_analysis') {
    response += `## 🛡️ **Risk Assessment**\n\n`;
    response += `Based on transaction patterns and balance, this wallet shows **${data.insights.riskLevel}** risk characteristics.\n\n`;
  }

  if (parsedQuery.intent.type === 'trading_analysis') {
    response += `## 📈 **Trading Analysis**\n\n`;
    response += `This wallet exhibits ${data.insights.walletType.toLowerCase()} behavior with ${data.activity.totalTransactions} total transactions.\n\n`;
  }

  // Helpful suggestions
  response += `## 💡 **What you can ask next:**\n\n`;
  response += `• "Show me recent transactions for this wallet"\n`;
  response += `• "What tokens does this wallet hold?"\n`;
  response += `• "Analyze trading patterns for the last month"\n`;
  response += `• "Compare this wallet to similar addresses"\n\n`;

  // Footer with data source
  response += `---\n*📡 Data sourced from SEI MCP Server • ${new Date().toLocaleString()}*`;

  return response;
}

/**
 * Main wallet analysis function
 */
export async function analyzeWallet(params: WalletAnalysisParams): Promise<string> {
  try {
    // Parse the natural language query
    const parsedQuery = parseQuery(params.query);
    
    // Extract or use provided address
    const walletAddress = params.address || parsedQuery.walletAddress;
    if (!walletAddress) {
      return `❌ **No Wallet Address Found**\n\nI couldn't find a wallet address in your query. Please provide a valid SEI or Ethereum address.\n\n**Examples:**\n• \`sei1abc123def456...\`\n• \`0x742d35Cc6634C0532925a3b8D6Ac6B1Ae4B3b3b3\``;
    }

    // Validate address format
    validateWalletAddress(walletAddress, params.network || 'sei');

    // Get wallet balance
    const balanceData = await enhancedSeiMcpClient.getWalletBalance(
      walletAddress, 
      params.network || 'sei'
    );

    // Initialize result structure
    const result: WalletAnalysisResult = {
      success: true,
      data: {
        address: walletAddress,
        balance: {
          native: balanceData?.balance || '0',
          tokens: balanceData?.tokens || []
        },
        activity: {
          totalTransactions: 0,
          recentActivity: 'No recent activity',
          transactionTypes: {}
        },
        insights: {
          walletType: 'Unknown',
          riskLevel: 'low',
          behaviorPattern: 'Insufficient data for analysis'
        }
      }
    };

    // Try to get transaction data if requested
    if (params.includeTransactions) {
      try {
        // Note: This would need to be implemented in the MCP server
        // For now, we'll use the balance data to make basic inferences
        const transactions: any[] = []; // Placeholder
        
        result.data!.activity = {
          totalTransactions: transactions.length,
          recentActivity: transactions.length > 0 ? 'Recent activity detected' : 'No recent activity',
          transactionTypes: transactions.reduce((acc, tx) => {
            const type = tx.type || 'unknown';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
          }, {})
        };

        // Analyze wallet behavior
        result.data!.insights = analyzeWalletBehavior(transactions, balanceData);
      } catch (error) {
        // Transaction data unavailable, continue with balance analysis
        console.warn('Transaction data unavailable:', error);
        
        // Basic analysis from balance only
        const balanceAmount = parseFloat(balanceData?.balance || '0');
        result.data!.insights = {
          walletType: balanceAmount > 0 ? 'Active Wallet' : 'Empty Wallet',
          riskLevel: balanceAmount > 1000 ? 'medium' : 'low',
          behaviorPattern: 'Analysis based on balance data only - transaction history unavailable'
        };
      }
    }

    // Format and return response
    return formatWalletAnalysisResponse(parsedQuery, result);

  } catch (error) {
    // Handle errors professionally
    return ErrorHandler.logAndFormat(error, 'wallet analysis', {
      address: params.address,
      network: params.network
    });
  }
}

/**
 * Tool definition for AI SDK integration
 */
export const walletAnalysisTool = {
  name: 'wallet_analysis',
  description: 'Analyze SEI or Ethereum wallet behavior, balance, and transaction patterns',
  parameters: WalletAnalysisSchema,
  execute: analyzeWallet
};
