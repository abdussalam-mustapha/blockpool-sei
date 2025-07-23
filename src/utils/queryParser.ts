/**
 * Advanced Query Parser for SEI Chain Pulse
 * Extracts structured data from natural language queries
 */

export interface QueryIntent {
  type: 'wallet_analysis' | 'balance_inquiry' | 'risk_analysis' | 'trading_analysis' | 'transaction_lookup' | 'market_data' | 'chain_info' | 'help' | 'general';
  confidence: number;
}

export interface ParsedQuery {
  walletAddress?: string;
  tokenSymbol?: string;
  transactionHash?: string;
  timeframe: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
  dex?: string;
  nftCollection?: { collection: string; tokenId: string };
  intent: QueryIntent;
  confidence: number;
  suggestions: string[];
}

/**
 * Parse natural language query and extract structured data
 */
export function parseQuery(query: string): ParsedQuery {
  const lowerQuery = query.toLowerCase();
  
  // Extract wallet address
  const walletAddress = extractWalletAddress(query);
  
  // Extract transaction hash
  const transactionHash = extractTransactionHash(query);
  
  // Extract token symbol
  const tokenSymbol = extractTokenSymbol(query);
  
  // Extract timeframe
  const timeframe = extractTimeframe(query);
  
  // Determine intent
  const intent = determineIntent(lowerQuery, { walletAddress, transactionHash, tokenSymbol });
  
  // Generate suggestions
  const suggestions = generateSuggestions(intent.type, { walletAddress, transactionHash, tokenSymbol });
  
  return {
    walletAddress,
    tokenSymbol,
    transactionHash,
    timeframe,
    intent,
    confidence: intent.confidence,
    suggestions
  };
}

/**
 * Extract wallet address from query
 */
function extractWalletAddress(query: string): string | undefined {
  // SEI bech32 format: sei1...
  const seiMatch = query.match(/sei1[a-z0-9]{38,58}/i);
  if (seiMatch) return seiMatch[0];
  
  // EVM format: 0x...
  const evmMatch = query.match(/0x[a-fA-F0-9]{40}/);
  if (evmMatch) return evmMatch[0];
  
  return undefined;
}

/**
 * Extract transaction hash from query
 */
function extractTransactionHash(query: string): string | undefined {
  // Transaction hash patterns
  const txMatch = query.match(/(?:tx|transaction|hash)\s*:?\s*([a-fA-F0-9]{64}|0x[a-fA-F0-9]{64})/i);
  if (txMatch) return txMatch[1];
  
  // Direct hash pattern
  const hashMatch = query.match(/\b(?:0x)?[a-fA-F0-9]{64}\b/);
  if (hashMatch) return hashMatch[0];
  
  return undefined;
}

/**
 * Extract token symbol from query
 */
function extractTokenSymbol(query: string): string | undefined {
  const tokenPatterns = [
    /\b(SEI|USDC|USDT|ETH|BTC|ATOM|OSMO)\b/i,
    /\btoken\s+([A-Z]{2,10})\b/i,
    /\$([A-Z]{2,10})\b/i
  ];
  
  for (const pattern of tokenPatterns) {
    const match = query.match(pattern);
    if (match) return match[1] || match[0];
  }
  
  return undefined;
}

/**
 * Extract timeframe from query
 */
function extractTimeframe(query: string): 'hour' | 'day' | 'week' | 'month' | 'year' | 'all' {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('hour') || lowerQuery.includes('1h')) return 'hour';
  if (lowerQuery.includes('day') || lowerQuery.includes('24h') || lowerQuery.includes('today')) return 'day';
  if (lowerQuery.includes('week') || lowerQuery.includes('7d')) return 'week';
  if (lowerQuery.includes('month') || lowerQuery.includes('30d')) return 'month';
  if (lowerQuery.includes('year') || lowerQuery.includes('365d')) return 'year';
  if (lowerQuery.includes('all') || lowerQuery.includes('ever')) return 'all';
  
  return 'day'; // Default
}

/**
 * Determine query intent based on keywords and context
 */
function determineIntent(query: string, context: { walletAddress?: string; transactionHash?: string; tokenSymbol?: string }): QueryIntent {
  let type: QueryIntent['type'] = 'general';
  let confidence = 0.5;
  
  // Wallet analysis patterns
  if (query.includes('analyze') || query.includes('wallet') || context.walletAddress) {
    if (query.includes('risk') || query.includes('safe')) {
      type = 'risk_analysis';
      confidence = 0.8;
    } else if (query.includes('trading') || query.includes('activity')) {
      type = 'trading_analysis';
      confidence = 0.8;
    } else if (query.includes('balance') || query.includes('holdings')) {
      type = 'balance_inquiry';
      confidence = 0.9;
    } else {
      type = 'wallet_analysis';
      confidence = 0.7;
    }
  }
  
  // Transaction lookup patterns
  else if (query.includes('transaction') || query.includes('tx') || context.transactionHash) {
    type = 'transaction_lookup';
    confidence = 0.9;
  }
  
  // Market data patterns
  else if (query.includes('price') || query.includes('market') || query.includes('token') || context.tokenSymbol) {
    type = 'market_data';
    confidence = 0.8;
  }
  
  // Chain info patterns
  else if (query.includes('block') || query.includes('network') || query.includes('chain')) {
    type = 'chain_info';
    confidence = 0.8;
  }
  
  // Help patterns
  else if (query.includes('help') || query.includes('how') || query.includes('what can')) {
    type = 'help';
    confidence = 0.9;
  }
  
  return { type, confidence };
}

/**
 * Generate helpful suggestions based on intent
 */
function generateSuggestions(intentType: QueryIntent['type'], context: { walletAddress?: string; transactionHash?: string; tokenSymbol?: string }): string[] {
  const suggestions: string[] = [];
  
  switch (intentType) {
    case 'wallet_analysis':
      suggestions.push('Show recent transactions', 'Check token holdings', 'Analyze trading patterns');
      break;
    case 'balance_inquiry':
      suggestions.push('Show token breakdown', 'Check transaction history', 'View wallet activity');
      break;
    case 'transaction_lookup':
      suggestions.push('Show transaction details', 'Analyze sender wallet', 'View on explorer');
      break;
    case 'market_data':
      suggestions.push('Check token price', 'View market trends', 'Compare with other tokens');
      break;
    case 'chain_info':
      suggestions.push('Show latest blocks', 'Check network status', 'View validator info');
      break;
    case 'help':
      suggestions.push('Try wallet analysis', 'Look up a transaction', 'Check network status');
      break;
    default:
      suggestions.push('Try "help" for examples', 'Analyze a wallet address', 'Look up transaction');
  }
  
  return suggestions;
}
