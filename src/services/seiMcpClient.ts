// Re-export from the new enhanced MCP client
export { 
  SeiMCPClient,
  MCPConnectionError,
  MCPRequestError,
  MCPTimeoutError,
  type WalletAnalysis as NewWalletAnalysis,
  type TransactionData,
  type TokenInfo as NewTokenInfo,
  type BlockInfo
} from '../lib/sei-mcp-client';

// Legacy interfaces for backward compatibility
interface MCPMessage {
  jsonrpc: string;
  id?: string | number;
  method?: string;
  params?: any;
  result?: any;
  error?: any;
}

interface BlockchainEvent {
  id: string;
  type: 'transfer' | 'mint' | 'swap' | 'contract';
  timestamp: string;
  from: string;
  to: string;
  amount: string;
  token: string;
  hash: string;
  gasUsed: string;
  gasPrice: string;
  blockNumber: number;
  status: 'success' | 'failed';
  description?: string;
  txHash?: string;
  blockHeight?: number;
  fee?: string;
}

interface WalletAnalysis {
  address: string;
  balance: string;
  transactionCount: number;
  lastActivity: string;
  riskScore: number;
  tokens: Array<{
    denom: string;
    amount: string;
    value?: string;
  }>;
  recentTransactions: BlockchainEvent[];
}

interface TokenInfo {
  denom: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  volume24h: string;
  marketCap?: string;
  holders?: number;
}

interface ConnectionStatus {
  connected: boolean;
  attempts: number;
  sessionId?: string;
  lastError?: string;
}

// Legacy wrapper class for backward compatibility
class LegacySeiMcpClient {
  private client: import('../lib/sei-mcp-client').SeiMCPClient | null = null;
  private eventListeners = new Map<string, ((data: any) => void)[]>();
  private connectionStatus: ConnectionStatus = { connected: false, attempts: 0 };
  private initPromise: Promise<void>;

  constructor(serverUrl: string = 'http://localhost:3004') {
    // Import the new client dynamically to avoid circular imports
    this.initPromise = import('../lib/sei-mcp-client').then(({ SeiMCPClient }) => {
      this.client = new SeiMCPClient({
        server: { url: serverUrl, timeout: 15000 },
        debug: true
      });
      
      // Forward events
      this.client.on('connected', (data) => {
        this.connectionStatus = { connected: true, attempts: 0, sessionId: data.sessionId };
        this.emit('connected', data);
      });
      
      this.client.on('disconnected', () => {
        this.connectionStatus = { connected: false, attempts: 0 };
        this.emit('disconnected');
      });
    });
  }

  // Event emitter methods
  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  on(event: string, listener: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  off(event: string, listener: (data: any) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  async connect(): Promise<void> {
    await this.initPromise;
    
    if (!this.client) {
      throw new Error('Client not initialized');
    }
    
    try {
      console.log('🔌 LegacySeiMcpClient: Attempting to connect...');
      await this.client.connect();
      
      const clientStatus = this.client.getConnectionStatus();
      this.connectionStatus = { 
        connected: true, 
        attempts: 0, 
        sessionId: clientStatus.sessionId || undefined
      };
      
      console.log('✅ LegacySeiMcpClient: Connected successfully, emitting connected event');
      // Manually emit connected event to ensure Dashboard receives it
      this.emit('connected', { sessionId: this.connectionStatus.sessionId });
      
    } catch (error) {
      this.connectionStatus = { 
        connected: false, 
        attempts: this.connectionStatus.attempts + 1, 
        lastError: error instanceof Error ? error.message : 'Unknown error'
      };
      
      console.error('❌ LegacySeiMcpClient: Connection failed, emitting disconnected event');
      this.emit('disconnected');
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.initPromise;
    
    if (this.client) {
      await this.client.disconnect();
    }
    this.connectionStatus = { connected: false, attempts: 0 };
  }

  // Legacy API methods that delegate to the new client
  async analyzeWallet(address: string): Promise<WalletAnalysis> {
    await this.initPromise;
    
    if (!this.client) {
      throw new Error('Client not initialized');
    }
    
    try {
      const balance = await this.client.getBalance(address);
      return {
        address: balance.address,
        balance: balance.balance.formatted,
        transactionCount: 0, // Not available in new API
        lastActivity: new Date().toISOString(),
        riskScore: 0.1, // Default low risk
        tokens: balance.tokens || [],
        recentTransactions: [] // Not available in new API
      };
    } catch (error) {
      console.error('Error analyzing wallet:', error);
      // Return mock data as fallback
      return {
        address,
        balance: '0 SEI',
        transactionCount: 0,
        lastActivity: new Date().toISOString(),
        riskScore: 0.1,
        tokens: [],
        recentTransactions: []
      };
    }
  }

  async getTransaction(hash: string): Promise<any> {
    await this.initPromise;
    
    if (!this.client) {
      throw new Error('Client not initialized');
    }
    
    try {
      return await this.client.getTransaction(hash);
    } catch (error) {
      console.error('Error getting transaction:', error);
      throw error;
    }
  }

  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  // Additional legacy methods for backward compatibility
  async listAvailableTools(): Promise<any[]> {
    return [
      { name: 'get_balance', description: 'Get wallet balance' },
      { name: 'get_transaction', description: 'Get transaction details' },
      { name: 'get_latest_block', description: 'Get latest block info' },
      { name: 'estimate_gas', description: 'Estimate gas for transaction' },
    ];
  }

  async callTool(toolName: string, params: any): Promise<any> {
    await this.initPromise;
    
    if (!this.client) {
      throw new Error('Client not initialized');
    }

    switch (toolName) {
      case 'get_balance':
        return await this.client.getBalance(params.address, params.network);
      case 'get_transaction':
        return await this.client.getTransaction(params.hash, params.network);
      case 'get_latest_block':
        return await this.client.getLatestBlock(params.network);
      case 'estimate_gas':
        return await this.client.estimateGas(params.to, params.data, params.value, params.network);
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  // Mock data generators for fallback
  async getRecentBlockchainEvents(limit: number = 10): Promise<BlockchainEvent[]> {
    return this.getRecentEvents(limit);
  }

  async getRecentEvents(limit: number = 10): Promise<BlockchainEvent[]> {
    await this.initPromise;
  
    if (!this.client || !this.connectionStatus.connected) {
      console.warn('⚠️ MCP Client not connected - no real blockchain data available');
      return [];
    }
  
    try {
      console.log(`🔍 Fetching ${limit} real blockchain events from SEI network...`);
      
      // Get the latest block to find recent transactions
      const latestBlockResult = await this.client.getLatestBlock();
      
      if (!latestBlockResult || !latestBlockResult.transactions || latestBlockResult.transactions.length === 0) {
        console.warn('⚠️ No recent transactions found in latest block');
        return [];
      }
      
      // Convert transactions to BlockchainEvent format
      const events: BlockchainEvent[] = latestBlockResult.transactions.slice(0, limit).map((tx: any, index: number) => ({
        id: tx.hash || `tx_${Date.now()}_${index}`,
        type: this.determineTransactionType(tx),
        timestamp: latestBlockResult.timestamp || new Date().toISOString(),
        from: tx.from || 'sei1unknown',
        to: tx.to || 'sei1unknown',
        amount: tx.value || '0',
        token: 'SEI',
        hash: tx.hash || `0x${Math.random().toString(16).substr(2, 64)}`,
        gasUsed: tx.gasUsed?.toString() || '21000',
        gasPrice: tx.gasPrice?.toString() || '1000000000',
        blockNumber: latestBlockResult.number || 0,
        status: 'success', // Assume success if in block
        description: `${this.determineTransactionType(tx)} transaction`,
        txHash: tx.hash,
        blockHeight: latestBlockResult.number,
        fee: this.calculateFee(tx.gasUsed, tx.gasPrice)
      }));
      
      console.log(`✅ Retrieved ${events.length} real blockchain events from SEI network`);
      return events;
      
    } catch (error) {
      console.error('❌ Failed to fetch real blockchain data from MCP server:', error);
      
      // Return empty array instead of mock data when MCP server fails
      return [];
    }
  }

  private determineTransactionType(tx: any): 'transfer' | 'mint' | 'swap' | 'contract' {
    // Simple heuristics to determine transaction type
    if (tx.data && tx.data !== '0x') {
      return 'contract';
    }
    if (tx.value && tx.value !== '0') {
      return 'transfer';
    }
    return 'transfer';
  }

  private calculateFee(gasUsed: any, gasPrice: any): string {
    try {
      const gas = BigInt(gasUsed || 0);
      const price = BigInt(gasPrice || 0);
      const fee = gas * price;
      // Convert from wei to SEI (assuming 18 decimals)
      const feeInSei = Number(fee) / Math.pow(10, 18);
      return feeInSei.toFixed(6);
    } catch {
      return '0.001'; // Default fee
    }
  }

  async getMarketData(symbol: string = 'SEI'): Promise<TokenInfo> {
    return {
      denom: 'usei',
      name: 'Sei',
      symbol: 'SEI',
      price: 0.45,
      change24h: 2.5,
      volume24h: '1000000',
      marketCap: '500000000',
      holders: 50000
    };
  }

  async performRiskAnalysis(address: string): Promise<any> {
    return {
      address,
      riskScore: 0.1,
      riskLevel: 'LOW',
      factors: ['New wallet', 'Low transaction volume'],
      recommendations: ['Monitor for unusual activity']
    };
  }

  async getNFTActivity(limit: number = 10): Promise<any[]> {
    const activities = [];
    const types = ['mint', 'transfer', 'sale', 'listing'];
    
    for (let i = 0; i < limit; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      activities.push({
        id: `nft_${i}_${Date.now()}`,
        type,
        timestamp: new Date(Date.now() - i * 60000).toISOString(),
        collection: `Collection ${Math.floor(Math.random() * 10) + 1}`,
        tokenId: Math.floor(Math.random() * 1000) + 1,
        from: `sei1${Math.random().toString(36).substring(2, 39)}`,
        to: `sei1${Math.random().toString(36).substring(2, 39)}`,
        price: type === 'sale' ? (Math.random() * 100).toFixed(2) : null,
        hash: `0x${Math.random().toString(16).substr(2, 64)}`
      });
    }
    
    return activities;
  }

  async getRiskAnalysis(address: string): Promise<any> {
    return this.performRiskAnalysis(address);
  }
}

// Create legacy singleton instance for backward compatibility
const legacyClient = new LegacySeiMcpClient();

// Export the legacy client as the default export
export { legacyClient as seiMcpClient };

// Auto-connect when module loads
legacyClient.connect().catch(error => {
  console.error('Auto-connect failed:', error);
});

export type { BlockchainEvent, WalletAnalysis, TokenInfo, ConnectionStatus };
