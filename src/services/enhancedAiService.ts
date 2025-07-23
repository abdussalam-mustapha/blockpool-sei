/**
 * Enhanced AI Service for SEI Chain Pulse
 * Integrates advanced query parsing, tool-based architecture, and professional error handling
 */

import { enhancedSeiMcpClient } from './enhancedSeiMcpClient';
import { seiMcpClient } from '../lib/sei-mcp-client';

// Simple query parsing interface
interface ParsedQuery {
  walletAddress?: string;
  tokenSymbol?: string;
  transactionHash?: string;
  timeframe: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
  intent: {
    type: 'wallet_analysis' | 'balance_inquiry' | 'risk_analysis' | 'trading_analysis' | 'transaction_lookup' | 'market_data' | 'chain_info' | 'help' | 'general';
    confidence: number;
  };
  suggestions: string[];
}

export interface AIResponse {
  message: string;
  confidence: number;
  sources: string[];
  toolsUsed: string[];
  suggestions: string[];
  metadata: {
    queryType: string;
    processingTime: number;
    mcpStatus: 'connected' | 'disconnected' | 'error';
    timestamp: string;
  };
}

export interface AIServiceConfig {
  enableAdvancedParsing: boolean;
  enableToolExecution: boolean;
  maxResponseLength: number;
  includeDebugInfo: boolean;
}

/**
 * Enhanced AI Service with intelligent query processing
 */
export class EnhancedAIService {
  private config: AIServiceConfig;

  constructor(config: Partial<AIServiceConfig> = {}) {
    this.config = {
      enableAdvancedParsing: true,
      enableToolExecution: true,
      maxResponseLength: 4000,
      includeDebugInfo: import.meta.env.DEV || false,
      ...config
    };
  }

  /**
   * Process user query with intelligent routing and tool execution
   */
  async processQuery(query: string): Promise<AIResponse> {
    const startTime = Date.now();
    const mcpStatus = enhancedSeiMcpClient.getConnectionStatus();
    
    try {
      // Parse the query to understand intent and extract parameters
      const parsedQuery = this.config.enableAdvancedParsing 
        ? this.parseQuery(query)
        : { intent: { type: 'general', confidence: 0.5 }, suggestions: [], timeframe: 'day' as const };

      // Route to appropriate handler based on intent
      const response = await this.routeQuery(query, parsedQuery);

      // Calculate processing time
      const processingTime = Date.now() - startTime;

      return {
        ...response,
        metadata: {
          ...response.metadata,
          processingTime,
          mcpStatus: mcpStatus.connected ? 'connected' : 'disconnected',
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = `Error processing query: ${error instanceof Error ? error.message : 'Unknown error'}`;

      return {
        message: errorMessage,
        confidence: 0.1,
        sources: ['Error Handler'],
        toolsUsed: [],
        suggestions: [
          'Try rephrasing your question',
          'Check if the wallet address is correct',
          'Wait a moment and try again'
        ],
        metadata: {
          queryType: 'error',
          processingTime,
          mcpStatus: 'error',
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Route query to appropriate handler based on parsed intent
   */
  private async routeQuery(query: string, parsedQuery: ParsedQuery): Promise<AIResponse> {
    const { intent } = parsedQuery;

    switch (intent.type) {
      case 'wallet_analysis':
      case 'balance_inquiry':
      case 'risk_analysis':
      case 'trading_analysis':
        return await this.handleWalletAnalysis(query, parsedQuery);

      case 'transaction_lookup':
        return await this.handleTransactionLookup(query, parsedQuery);

      case 'market_data':
        return await this.handleMarketData(query, parsedQuery);

      case 'chain_info':
        return await this.handleChainInfo(query, parsedQuery);

      case 'help':
        return this.handleHelp(query, parsedQuery);

      default:
        return this.handleGeneral(query, parsedQuery);
    }
  }

  /**
   * Handle wallet analysis queries
   */
  private async handleWalletAnalysis(query: string, parsedQuery: ParsedQuery): Promise<AIResponse> {
    if (!this.config.enableToolExecution) {
      return this.createResponse(
        "🔧 **Tool execution is disabled**\n\nWallet analysis requires tool execution to be enabled.",
        0.3,
        [],
        [],
        ['Enable tool execution in settings', 'Contact administrator'],
        'wallet_analysis'
      );
    }

    try {
      const params: WalletAnalysisParams = {
        query,
        address: parsedQuery.walletAddress,
        timeframe: parsedQuery.timeframe,
        network: 'sei'
      };

      const analysisResult = await analyzeWallet(params);

      return this.createResponse(
        analysisResult,
        intent.confidence,
        ['SEI MCP Server', 'Wallet Analysis Tool'],
        ['wallet_analysis'],
        parsedQuery.suggestions,
        'wallet_analysis'
      );

    } catch (error) {
      const errorMessage = ErrorHandler.logAndFormat(error, 'wallet analysis');
      return this.createResponse(
        errorMessage,
        0.2,
        ['Error Handler'],
        ['wallet_analysis'],
        ['Try a different wallet address', 'Check MCP server connection'],
        'error'
      );
    }
  }

  /**
   * Handle transaction lookup queries
   */
  private async handleTransactionLookup(query: string, parsedQuery: ParsedQuery): Promise<AIResponse> {
    try {
      if (!parsedQuery.transactionHash) {
        return this.createResponse(
          "❌ **No Transaction Hash Found**\n\nI couldn't find a transaction hash in your query. Please provide a valid transaction hash.\n\n**Example:** `0x1234567890abcdef...`",
          0.3,
          [],
          [],
          ['Provide a valid transaction hash', 'Check the hash format'],
          'transaction_lookup'
        );
      }

      const txData = await enhancedSeiMcpClient.getTransaction(parsedQuery.transactionHash);
      
      let response = `🔍 **Transaction Details**\n\n`;
      response += `**Hash:** \`${enhancedSeiMcpClient.formatAddress(parsedQuery.transactionHash)}\`\n`;
      response += `**Status:** ${txData.status || 'Unknown'}\n`;
      response += `**Block:** ${txData.blockNumber || 'Pending'}\n`;
      
      if (txData.from) {
        response += `**From:** \`${enhancedSeiMcpClient.formatAddress(txData.from)}\`\n`;
      }
      if (txData.to) {
        response += `**To:** \`${enhancedSeiMcpClient.formatAddress(txData.to)}\`\n`;
      }
      if (txData.value) {
        response += `**Value:** ${enhancedSeiMcpClient.formatSEI(txData.value)}\n`;
      }

      response += `\n---\n*📡 Data from SEI MCP Server*`;

      return this.createResponse(
        response,
        0.9,
        ['SEI MCP Server'],
        ['get_transaction'],
        ['Analyze the sender wallet', 'Check transaction receipt', 'View on block explorer'],
        'transaction_lookup'
      );

    } catch (error) {
      const errorMessage = ErrorHandler.logAndFormat(error, 'transaction lookup');
      return this.createResponse(
        errorMessage,
        0.2,
        ['Error Handler'],
        ['get_transaction'],
        ['Check transaction hash format', 'Try again in a moment'],
        'error'
      );
    }
  }

  /**
   * Handle market data queries
   */
  private async handleMarketData(query: string, parsedQuery: ParsedQuery): Promise<AIResponse> {
    try {
      const chainInfo = await enhancedSeiMcpClient.getChainInfo();
      
      let response = `📊 **SEI Network Information**\n\n`;
      response += `**Chain ID:** ${chainInfo.chainId || 'Unknown'}\n`;
      response += `**Latest Block:** ${chainInfo.latestBlock || 'Unknown'}\n`;
      response += `**Network Status:** ${chainInfo.status || 'Unknown'}\n\n`;
      
      if (parsedQuery.tokenSymbol) {
        response += `**Token Requested:** ${parsedQuery.tokenSymbol}\n`;
        response += `*Note: Detailed token data requires additional market data integration.*\n\n`;
      }

      response += `---\n*📡 Data from SEI MCP Server*`;

      return this.createResponse(
        response,
        0.7,
        ['SEI MCP Server'],
        ['get_chain_info'],
        ['Check specific wallet balances', 'Analyze recent transactions', 'View network statistics'],
        'market_data'
      );

    } catch (error) {
      const errorMessage = ErrorHandler.logAndFormat(error, 'market data lookup');
      return this.createResponse(
        errorMessage,
        0.2,
        ['Error Handler'],
        ['get_chain_info'],
        ['Try again in a moment', 'Check network connection'],
        'error'
      );
    }
  }

  /**
   * Handle chain information queries
   */
  private async handleChainInfo(query: string, parsedQuery: ParsedQuery): Promise<AIResponse> {
    try {
      const [chainInfo, latestBlock] = await Promise.all([
        enhancedSeiMcpClient.getChainInfo(),
        enhancedSeiMcpClient.getLatestBlock()
      ]);

      let response = `⛓️ **SEI Blockchain Status**\n\n`;
      response += `**Chain ID:** ${chainInfo.chainId || 'Unknown'}\n`;
      response += `**Network:** ${chainInfo.network || 'SEI Mainnet'}\n`;
      response += `**Latest Block:** #${latestBlock.number || 'Unknown'}\n`;
      response += `**Block Time:** ${latestBlock.timestamp ? new Date(latestBlock.timestamp * 1000).toLocaleString() : 'Unknown'}\n`;
      response += `**Transactions in Block:** ${latestBlock.transactions?.length || 0}\n\n`;

      response += `**🔗 Network Health:** ${chainInfo.status === 'active' ? '✅ Healthy' : '⚠️ Issues Detected'}\n\n`;

      response += `---\n*📡 Live data from SEI MCP Server*`;

      return this.createResponse(
        response,
        0.9,
        ['SEI MCP Server'],
        ['get_chain_info', 'get_latest_block'],
        ['Analyze recent transactions', 'Check wallet balances', 'View block details'],
        'chain_info'
      );

    } catch (error) {
      const errorMessage = ErrorHandler.logAndFormat(error, 'chain info lookup');
      return this.createResponse(
        errorMessage,
        0.2,
        ['Error Handler'],
        ['get_chain_info'],
        ['Try again in a moment', 'Check MCP server status'],
        'error'
      );
    }
  }

  /**
   * Handle help queries
   */
  private handleHelp(query: string, parsedQuery: ParsedQuery): AIResponse {
    const response = `🤖 **SEI Chain Pulse AI Assistant**\n\n` +
      `I can help you analyze the SEI blockchain! Here's what I can do:\n\n` +
      `## 🔍 **Wallet Analysis**\n` +
      `• \`Analyze wallet sei1abc123...\`\n` +
      `• \`What's the balance of 0x742d35...\`\n` +
      `• \`Show me wallet activity for the last week\`\n\n` +
      `## 📊 **Transaction Lookup**\n` +
      `• \`Look up transaction 0x1234567...\`\n` +
      `• \`Show me transaction details\`\n` +
      `• \`What happened in tx abc123...\`\n\n` +
      `## ⛓️ **Network Information**\n` +
      `• \`What's the latest block?\`\n` +
      `• \`Show me SEI network status\`\n` +
      `• \`How many transactions in the last block?\`\n\n` +
      `## 💡 **Tips**\n` +
      `• I understand natural language - just ask!\n` +
      `• I can analyze both SEI native and EVM addresses\n` +
      `• All data comes live from the SEI blockchain\n` +
      `• I'll show you exactly what tools I used\n\n` +
      `**Try asking me something!** 🚀`;

    return this.createResponse(
      response,
      1.0,
      ['Built-in Help System'],
      [],
      ['Try analyzing a wallet', 'Look up a transaction', 'Check network status'],
      'help'
    );
  }

  /**
   * Handle general queries
   */
  private handleGeneral(query: string, parsedQuery: ParsedQuery): AIResponse {
    const response = `🤔 **I'm not sure how to help with that**\n\n` +
      `I specialize in SEI blockchain analysis. I can help you with:\n\n` +
      `• **Wallet Analysis** - Balance, transactions, behavior patterns\n` +
      `• **Transaction Lookup** - Details, status, participants\n` +
      `• **Network Information** - Latest blocks, chain status\n\n` +
      `**Try asking something like:**\n` +
      `• "Analyze wallet sei1abc123..."\n` +
      `• "Look up transaction 0x1234..."\n` +
      `• "What's the latest block?"\n\n` +
      `Or just say **"help"** for more examples! 💡`;

    return this.createResponse(
      response,
      0.4,
      ['Built-in Response System'],
      [],
      parsedQuery.suggestions.length > 0 ? parsedQuery.suggestions : [
        'Try wallet analysis',
        'Look up a transaction',
        'Ask for help'
      ],
      'general'
    );
  }

  /**
   * Create standardized AI response
   */
  private createResponse(
    message: string,
    confidence: number,
    sources: string[],
    toolsUsed: string[],
    suggestions: string[],
    queryType: string
  ): AIResponse {
    return {
      message: message.length > this.config.maxResponseLength 
        ? message.substring(0, this.config.maxResponseLength) + '...\n\n*Response truncated*'
        : message,
      confidence: Math.max(0, Math.min(1, confidence)),
      sources,
      toolsUsed,
      suggestions: suggestions.slice(0, 4), // Limit suggestions
      metadata: {
        queryType,
        processingTime: 0, // Will be set by processQuery
        mcpStatus: 'connected', // Will be updated by processQuery
        timestamp: '' // Will be set by processQuery
      }
    };
  }

  /**
   * Get service status and configuration
   */
  getStatus(): {
    config: AIServiceConfig;
    mcpStatus: ReturnType<typeof enhancedSeiMcpClient.getConnectionStatus>;
  } {
    return {
      config: this.config,
      mcpStatus: enhancedSeiMcpClient.getConnectionStatus()
    };
  }

  /**
   * Update service configuration
   */
  updateConfig(newConfig: Partial<AIServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Export singleton instance
export const enhancedAIService = new EnhancedAIService();
