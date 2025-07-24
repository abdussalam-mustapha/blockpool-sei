/**
 * Professional Error Handling Classes for Blockpool
 * Provides transparent error reporting and user-friendly messages
 */

export enum ErrorCode {
  // Connection Errors
  MCP_CONNECTION_FAILED = 'MCP_CONNECTION_FAILED',
  MCP_TIMEOUT = 'MCP_TIMEOUT',
  MCP_UNAVAILABLE = 'MCP_UNAVAILABLE',
  
  // Request Errors
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  INVALID_TRANSACTION_HASH = 'INVALID_TRANSACTION_HASH',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Data Errors
  WALLET_NOT_FOUND = 'WALLET_NOT_FOUND',
  TRANSACTION_NOT_FOUND = 'TRANSACTION_NOT_FOUND',
  INSUFFICIENT_DATA = 'INSUFFICIENT_DATA',
  
  // Server Errors
  MCP_SERVER_ERROR = 'MCP_SERVER_ERROR',
  BLOCKCHAIN_RPC_ERROR = 'BLOCKCHAIN_RPC_ERROR',
  
  // Validation Errors
  INVALID_QUERY = 'INVALID_QUERY',
  MISSING_PARAMETERS = 'MISSING_PARAMETERS'
}

export interface ErrorContext {
  operation?: string;
  address?: string;
  network?: string;
  timestamp?: string;
  requestId?: string;
  suggestions?: string[];
}

/**
 * Base class for all Blockpool errors
 */
export abstract class SEIChainError extends Error {
  public readonly code: ErrorCode;
  public readonly context: ErrorContext;
  public readonly isRetryable: boolean;
  public readonly userMessage: string;

  constructor(
    message: string,
    code: ErrorCode,
    context: ErrorContext = {},
    isRetryable = false,
    userMessage?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.context = {
      ...context,
      timestamp: new Date().toISOString()
    };
    this.isRetryable = isRetryable;
    this.userMessage = userMessage || this.generateUserMessage();
  }

  abstract generateUserMessage(): string;

  /**
   * Get formatted error for display to users
   */
  getDisplayMessage(): string {
    const suggestions = this.context.suggestions?.length 
      ? `\n\n💡 **Suggestions:**\n${this.context.suggestions.map(s => `• ${s}`).join('\n')}`
      : '';

    return `${this.userMessage}${suggestions}`;
  }

  /**
   * Get technical details for debugging
   */
  getTechnicalDetails(): object {
    return {
      error: this.message,
      code: this.code,
      context: this.context,
      stack: this.stack,
      isRetryable: this.isRetryable
    };
  }
}

/**
 * MCP Connection and Communication Errors
 */
export class MCPConnectionError extends SEIChainError {
  constructor(message: string, context: ErrorContext = {}) {
    super(message, ErrorCode.MCP_CONNECTION_FAILED, context, true);
  }

  generateUserMessage(): string {
    return `🔌 **Connection Issue**\n\nUnable to connect to SEI MCP Server. This means I can't fetch live blockchain data right now.\n\n**What this means:**\n• Real-time wallet analysis is temporarily unavailable\n• Market data may be outdated\n• Transaction lookups won't work\n\n**This is usually temporary** - the server may be restarting or experiencing high load.`;
  }
}

export class MCPTimeoutError extends SEIChainError {
  constructor(message: string = 'MCP request timed out', context: ErrorContext = {}) {
    super(message, ErrorCode.MCP_TIMEOUT, context, true);
  }

  generateUserMessage(): string {
    return `⏱️ **Request Timeout**\n\nThe SEI MCP Server took too long to respond. This can happen during high network activity or when analyzing complex wallet data.\n\n**What to try:**\n• Wait a moment and try again\n• Try a simpler query first\n• Check if the wallet address is correct`;
  }
}

export class MCPUnavailableError extends SEIChainError {
  constructor(message: string, context: ErrorContext = {}) {
    super(message, ErrorCode.MCP_UNAVAILABLE, context, false);
  }

  generateUserMessage(): string {
    return `🚫 **Service Unavailable**\n\nThe SEI MCP Server is currently unavailable. This could be due to:\n\n• Server maintenance\n• Network connectivity issues\n• High server load\n\n**Current Status:** No live blockchain data available\n**Estimated Resolution:** Usually resolves within 5-10 minutes`;
  }
}

/**
 * Request and Validation Errors
 */
export class InvalidAddressError extends SEIChainError {
  constructor(address: string, context: ErrorContext = {}) {
    super(`Invalid wallet address: ${address}`, ErrorCode.INVALID_ADDRESS, {
      ...context,
      address,
      suggestions: [
        'SEI addresses start with "sei1" and are 39-59 characters long',
        'EVM addresses start with "0x" and are exactly 42 characters long',
        'Double-check for typos or missing characters'
      ]
    });
  }

  generateUserMessage(): string {
    return `❌ **Invalid Wallet Address**\n\nThe address "${this.context.address}" is not a valid wallet address.\n\n**Supported formats:**\n• **SEI Native:** sei1abc123def456... (39-59 chars)\n• **EVM Format:** 0x1234567890abcdef... (42 chars)\n\n**Example valid addresses:**\n• sei1qy352eufqy352eufqy352eufqy352eufqy352euf\n• 0x742d35Cc6634C0532925a3b8D6Ac6B1Ae4B3b3b3`;
  }
}

export class TransactionNotFoundError extends SEIChainError {
  constructor(txHash: string, context: ErrorContext = {}) {
    super(`Transaction not found: ${txHash}`, ErrorCode.TRANSACTION_NOT_FOUND, {
      ...context,
      suggestions: [
        'Verify the transaction hash is correct',
        'Check if the transaction is on the correct network',
        'Recent transactions may take a few moments to appear'
      ]
    });
  }

  generateUserMessage(): string {
    return `🔍 **Transaction Not Found**\n\nCouldn't find transaction with hash: \`${this.context.address}\`\n\n**Possible reasons:**\n• Transaction hash is incorrect or incomplete\n• Transaction is on a different network\n• Transaction is very recent and not yet indexed\n\n**What to try:**\n• Double-check the transaction hash\n• Wait a few minutes for recent transactions\n• Verify you're on the correct network (SEI mainnet)`;
  }
}

export class RateLimitError extends SEIChainError {
  constructor(context: ErrorContext = {}) {
    super('Rate limit exceeded', ErrorCode.RATE_LIMIT_EXCEEDED, {
      ...context,
      suggestions: [
        'Wait a moment before making another request',
        'Try asking about fewer items at once',
        'Consider using more specific queries'
      ]
    }, true);
  }

  generateUserMessage(): string {
    return `🚦 **Rate Limit Reached**\n\nYou're making requests too quickly. To ensure fair access for all users, there's a limit on how many requests you can make per minute.\n\n**What to do:**\n• Wait about 30 seconds before trying again\n• Try asking about one thing at a time\n• Use more specific queries to get better results\n\n**Current limit:** 120 requests per minute`;
  }
}

/**
 * Data and Analysis Errors
 */
export class InsufficientDataError extends SEIChainError {
  constructor(operation: string, context: ErrorContext = {}) {
    super(`Insufficient data for ${operation}`, ErrorCode.INSUFFICIENT_DATA, {
      ...context,
      operation
    });
  }

  generateUserMessage(): string {
    return `📊 **Limited Data Available**\n\nThere isn't enough data to perform a complete ${this.context.operation}.\n\n**This could mean:**\n• The wallet has very few transactions\n• The requested data isn't available from the MCP server yet\n• The wallet is new or inactive\n\n**What I can still show you:**\n• Current balance information\n• Basic wallet details\n• Available transaction data`;
  }
}

export class WalletNotFoundError extends SEIChainError {
  constructor(address: string, context: ErrorContext = {}) {
    super(`Wallet not found: ${address}`, ErrorCode.WALLET_NOT_FOUND, {
      ...context,
      address,
      suggestions: [
        'Verify the wallet address is correct',
        'Check if the wallet exists on the SEI network',
        'Try a different wallet address'
      ]
    });
  }

  generateUserMessage(): string {
    return `👻 **Wallet Not Found**\n\nCouldn't find wallet: \`${this.context.address}\`\n\n**This might mean:**\n• The address doesn't exist on the SEI network\n• The address has never been used (zero balance, no transactions)\n• There might be a typo in the address\n\n**Double-check:**\n• Address format and length\n• Network (this tool works with SEI mainnet)\n• Copy-paste the full address to avoid typos`;
  }
}

/**
 * Utility functions for error handling
 */
export class ErrorHandler {
  /**
   * Convert unknown errors to SEI Chain errors
   */
  static handleUnknownError(error: unknown, operation: string, context: ErrorContext = {}): SEIChainError {
    if (error instanceof SEIChainError) {
      return error;
    }

    if (error instanceof Error) {
      // Check for specific error patterns
      if (error.message.includes('timeout')) {
        return new MCPTimeoutError(error.message, { ...context, operation });
      }
      if (error.message.includes('connection') || error.message.includes('network')) {
        return new MCPConnectionError(error.message, { ...context, operation });
      }
      if (error.message.includes('rate limit')) {
        return new RateLimitError({ ...context, operation });
      }

      // Generic server error
      return new class extends SEIChainError {
        constructor() {
          super(error.message, ErrorCode.MCP_SERVER_ERROR, { ...context, operation });
        }
        generateUserMessage(): string {
          return `⚠️ **Unexpected Error**\n\nSomething went wrong while ${operation}:\n\n\`${this.message}\`\n\n**This is usually temporary.** Please try again in a moment.`;
        }
      }();
    }

    // Unknown error type
    return new class extends SEIChainError {
      constructor() {
        super(String(error), ErrorCode.MCP_SERVER_ERROR, { ...context, operation });
      }
      generateUserMessage(): string {
        return `❓ **Unknown Error**\n\nAn unexpected error occurred while ${operation}.\n\n**Please try again** - this is usually a temporary issue.`;
      }
    }();
  }

  /**
   * Log error for debugging while showing user-friendly message
   */
  static logAndFormat(error: unknown, operation: string, context: ErrorContext = {}): string {
    const seiError = this.handleUnknownError(error, operation, context);
    
    // Log technical details for debugging
    console.error(`[SEI-ERROR] ${operation}:`, seiError.getTechnicalDetails());
    
    // Return user-friendly message
    return seiError.getDisplayMessage();
  }
}
