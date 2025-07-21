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

  constructor(serverUrl: string = 'https://sei-mcp-server-1.onrender.com') {
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
      console.log(`🔍 Fetching ${limit} real blockchain transactions from SEI network...`);
      
      // Get the latest block with transaction data
      const latestBlockResult = await this.client.getLatestBlock('sei');
      
      console.log('📦 Latest block data:', latestBlockResult);
      
      if (!latestBlockResult) {
        console.warn('⚠️ No block data received from MCP server');
        return [];
      }
      
      const events: BlockchainEvent[] = [];
      const blockNumber = latestBlockResult.number || 0;
      const blockTimestamp = latestBlockResult.timestamp ? 
        new Date(Number(latestBlockResult.timestamp) * 1000).toISOString() : 
        new Date().toISOString();
      
      // Get transaction hashes from the latest block
      const transactionHashes = latestBlockResult.transactions || [];
      console.log(`📋 Found ${transactionHashes.length} transactions in latest block`);
      
      if (transactionHashes.length === 0) {
        console.warn('⚠️ No transactions found in latest block');
        return [];
      }
      
      // Fetch detailed transaction data for each hash (up to limit)
      const hashesToFetch = transactionHashes.slice(0, Math.min(limit, transactionHashes.length));
      
      for (let i = 0; i < hashesToFetch.length; i++) {
        try {
          const txHash = hashesToFetch[i];
          console.log(`🔍 Fetching transaction details for hash: ${txHash}`);
          
          // Get detailed transaction data from MCP server
          const txData = await this.client.getTransaction(txHash, 'sei');
          
          if (txData) {
            // Convert real transaction data to BlockchainEvent format
            const event: BlockchainEvent = {
              id: `sei_real_${blockNumber}_${i}`,
              type: this.determineTransactionType(txData),
              timestamp: blockTimestamp,
              from: txData.from || '',
              to: txData.to || '',
              amount: this.formatAmount(txData.value || '0'),
              token: 'SEI',
              hash: txData.hash || txHash,
              gasUsed: txData.gasUsed || '0',
              gasPrice: txData.gasPrice || '0',
              blockNumber: Number(txData.blockNumber || blockNumber),
              status: txData.status || 'success',
              description: `Real ${this.determineTransactionType(txData)} transaction on SEI network`,
              txHash: txData.hash || txHash,
              blockHeight: Number(txData.blockNumber || blockNumber),
              fee: this.calculateFee(txData.gasUsed || '0', txData.gasPrice || '0')
            };
            
            events.push(event);
            console.log(`✅ Added real transaction: ${event.hash}`);
          }
        } catch (txError) {
          console.warn(`⚠️ Failed to fetch transaction ${hashesToFetch[i]}:`, txError);
          // Continue with next transaction instead of failing completely
        }
      }
      
      console.log(`✅ Fetched ${events.length} real blockchain transactions from SEI network`);
      return events;
      
    } catch (error: any) {
      // Handle specific error types
      if (error?.message?.includes('Rate limit exceeded')) {
        console.warn('⚠️ Rate limit exceeded - waiting before retry...');
        return [];
      }
      
      if (error?.message?.includes('Unsupported network')) {
        console.error('❌ Network configuration error:', error.message);
        return [];
      }
      
      console.error('❌ Failed to fetch real blockchain data from MCP server:', error);
      
      // Return empty array when MCP server fails - no fallback to mock data
      return [];
    }
  }



  private generateSeiAddress(): string {
    // Generate realistic SEI addresses (bech32 format)
    const prefixes = ['sei1', 'sei1'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let address = prefix;
    
    // SEI addresses are typically 39-43 characters long
    const targetLength = 39 + Math.floor(Math.random() * 5);
    
    for (let i = prefix.length; i < targetLength; i++) {
      address += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return address;
  }

  // Helper methods for processing real transaction data
  private determineTransactionType(txData: any): 'transfer' | 'mint' | 'swap' | 'contract' {
    // Analyze transaction data to determine type
    if (txData.to === null || txData.to === '') {
      return 'contract'; // Contract creation
    }
    if (txData.input && txData.input !== '0x') {
      // Has input data - likely a contract interaction
      const inputData = txData.input.toLowerCase();
      if (inputData.includes('a9059cbb')) return 'transfer'; // ERC20 transfer
      if (inputData.includes('40c10f19')) return 'mint'; // Mint function
      if (inputData.includes('7ff36ab5')) return 'swap'; // Swap function
      return 'contract';
    }
    return 'transfer'; // Simple transfer
  }

  private formatAmount(value: string): string {
    try {
      // Convert wei to SEI (divide by 10^18)
      const wei = BigInt(value || '0');
      const sei = Number(wei) / Math.pow(10, 18);
      return sei.toFixed(6);
    } catch {
      return '0.000000';
    }
  }

  private calculateFee(gasUsed: string, gasPrice: string): string {
    try {
      const gas = BigInt(gasUsed || '0');
      const price = BigInt(gasPrice || '0');
      const feeWei = gas * price;
      const feeSei = Number(feeWei) / Math.pow(10, 18);
      return feeSei.toFixed(6);
    } catch {
      return '0.000000';
    }
  }

  private generateRealisticAmount(type: string): string {
    switch (type) {
      case 'transfer':
        return (Math.random() * 1000 + 1).toFixed(6);
      case 'mint':
        return (Math.random() * 10000 + 100).toFixed(6);
      case 'swap':
        return (Math.random() * 5000 + 10).toFixed(6);
      case 'contract':
        return (Math.random() * 100 + 0.1).toFixed(6);
      default:
        return (Math.random() * 100 + 1).toFixed(6);
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

  // Multi-chain support methods
  async getBlockchainEventsForNetwork(network: string, limit: number = 10): Promise<BlockchainEvent[]> {
    await this.initPromise;
    
    if (!this.client || !this.connectionStatus.connected) {
      console.warn('[MCP] Not connected, returning mock data for network:', network);
      return this.generateMockEventsForNetwork(network, limit);
    }

    try {
      // For now, delegate to the existing method
      // In the future, this would call network-specific endpoints
      return await this.getRecentBlockchainEvents(limit);
    } catch (error) {
      console.error('[MCP] Error fetching events for network:', network, error);
      return this.generateMockEventsForNetwork(network, limit);
    }
  }

  async getWalletBalanceForNetwork(address: string, network: string): Promise<any> {
    await this.initPromise;
    
    if (!this.client || !this.connectionStatus.connected) {
      console.warn('[MCP] Not connected, returning mock balance for network:', network);
      return this.generateMockBalanceForNetwork(address, network);
    }

    try {
      // For now, delegate to the existing method
      // In the future, this would call network-specific endpoints
      const analysis = await this.analyzeWallet(address);
      return {
        address,
        network,
        balance: analysis.balance,
        tokens: analysis.tokens
      };
    } catch (error) {
      console.error('[MCP] Error fetching balance for network:', network, error);
      return this.generateMockBalanceForNetwork(address, network);
    }
  }

  async getNetworkInfo(network: string): Promise<any> {
    await this.initPromise;
    
    if (!this.client || !this.connectionStatus.connected) {
      console.warn('[MCP] Not connected, returning mock network info for:', network);
      return this.generateMockNetworkInfo(network);
    }

    try {
      // For now, return mock data
      // In the future, this would call network-specific endpoints
      return this.generateMockNetworkInfo(network);
    } catch (error) {
      console.error('[MCP] Error fetching network info for:', network, error);
      return this.generateMockNetworkInfo(network);
    }
  }

  // Mock data generators for multi-chain support
  private generateMockEventsForNetwork(network: string, limit: number): BlockchainEvent[] {
    const events: BlockchainEvent[] = [];
    const networkPrefix = this.getNetworkAddressPrefix(network);
    
    for (let i = 0; i < limit; i++) {
      const types: Array<'transfer' | 'mint' | 'swap' | 'contract'> = ['transfer', 'mint', 'swap', 'contract'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      events.push({
        id: `${network}-${Date.now()}-${i}`,
        type,
        timestamp: new Date(Date.now() - i * 60000).toISOString(),
        from: `${networkPrefix}${Math.random().toString(36).substring(2, 42)}`,
        to: `${networkPrefix}${Math.random().toString(36).substring(2, 42)}`,
        amount: this.generateRealisticAmount(type),
        token: this.getNetworkNativeToken(network),
        hash: this.generateHashForNetwork(network),
        gasUsed: (Math.floor(Math.random() * 100000) + 21000).toString(),
        gasPrice: (Math.floor(Math.random() * 50) + 10).toString(),
        blockNumber: Math.floor(Math.random() * 1000000) + 1000000,
        status: Math.random() > 0.1 ? 'success' : 'failed',
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} on ${network}`,
        fee: this.calculateFee(
          (Math.floor(Math.random() * 100000) + 21000).toString(),
          (Math.floor(Math.random() * 50) + 10).toString()
        )
      });
    }
    
    return events;
  }

  private generateMockBalanceForNetwork(address: string, network: string): any {
    const nativeToken = this.getNetworkNativeToken(network);
    const balance = (Math.random() * 1000).toFixed(6);
    
    return {
      address,
      network,
      balance: `${balance} ${nativeToken}`,
      nativeBalance: balance,
      tokens: [
        {
          denom: nativeToken.toLowerCase(),
          amount: balance,
          symbol: nativeToken,
          name: this.getNetworkNativeTokenName(network)
        }
      ],
      lastUpdated: new Date().toISOString()
    };
  }

  private generateMockNetworkInfo(network: string): any {
    return {
      network,
      name: this.getNetworkDisplayName(network),
      chainId: this.getNetworkChainId(network),
      blockHeight: Math.floor(Math.random() * 1000000) + 1000000,
      blockTime: Math.floor(Math.random() * 10) + 2,
      gasPrice: (Math.floor(Math.random() * 50) + 10).toString(),
      nativeToken: this.getNetworkNativeToken(network),
      isEVM: this.isEVMNetwork(network),
      lastUpdated: new Date().toISOString()
    };
  }

  // Network utility methods
  private getNetworkAddressPrefix(network: string): string {
    if (network.startsWith('sei')) return 'sei';
    return '0x';
  }

  private getNetworkNativeToken(network: string): string {
    if (network.startsWith('sei')) return 'SEI';
    if (network.startsWith('ethereum')) return 'ETH';
    if (network.startsWith('polygon')) return 'MATIC';
    if (network.startsWith('bsc')) return 'BNB';
    if (network.startsWith('avalanche')) return 'AVAX';
    if (network.startsWith('arbitrum')) return 'ETH';
    if (network.startsWith('optimism')) return 'ETH';
    if (network.startsWith('base')) return 'ETH';
    return 'ETH';
  }

  private getNetworkNativeTokenName(network: string): string {
    if (network.startsWith('sei')) return 'SEI';
    if (network.startsWith('ethereum')) return 'Ether';
    if (network.startsWith('polygon')) return 'Polygon';
    if (network.startsWith('bsc')) return 'BNB';
    if (network.startsWith('avalanche')) return 'Avalanche';
    if (network.startsWith('arbitrum')) return 'Ether';
    if (network.startsWith('optimism')) return 'Ether';
    if (network.startsWith('base')) return 'Ether';
    return 'Ether';
  }

  private getNetworkDisplayName(network: string): string {
    const names: Record<string, string> = {
      'sei': 'SEI Network',
      'sei-testnet': 'SEI Testnet',
      'sei-devnet': 'SEI Devnet',
      'ethereum': 'Ethereum Mainnet',
      'ethereum-sepolia': 'Ethereum Sepolia',
      'polygon': 'Polygon Mainnet',
      'polygon-mumbai': 'Polygon Mumbai',
      'bsc': 'BNB Smart Chain',
      'bsc-testnet': 'BSC Testnet',
      'avalanche': 'Avalanche C-Chain',
      'avalanche-fuji': 'Avalanche Fuji',
      'arbitrum': 'Arbitrum One',
      'arbitrum-sepolia': 'Arbitrum Sepolia',
      'optimism': 'Optimism',
      'optimism-sepolia': 'Optimism Sepolia',
      'base': 'Base',
      'base-sepolia': 'Base Sepolia'
    };
    return names[network] || network;
  }

  private getNetworkChainId(network: string): number {
    const chainIds: Record<string, number> = {
      'sei': 1329,
      'sei-testnet': 1328,
      'sei-devnet': 713715,
      'ethereum': 1,
      'ethereum-sepolia': 11155111,
      'polygon': 137,
      'polygon-mumbai': 80001,
      'bsc': 56,
      'bsc-testnet': 97,
      'avalanche': 43114,
      'avalanche-fuji': 43113,
      'arbitrum': 42161,
      'arbitrum-sepolia': 421614,
      'optimism': 10,
      'optimism-sepolia': 11155420,
      'base': 8453,
      'base-sepolia': 84532
    };
    return chainIds[network] || 1;
  }

  private isEVMNetwork(network: string): boolean {
    return !network.startsWith('sei');
  }

  private generateHashForNetwork(network: string): string {
    if (network.startsWith('sei')) {
      // SEI format: 64 chars, uppercase hex, no 0x prefix
      const chars = '0123456789ABCDEF';
      let hash = '';
      for (let i = 0; i < 64; i++) {
        hash += chars[Math.floor(Math.random() * 16)];
      }
      return hash;
    } else {
      // EVM format: 0x + 64 chars lowercase hex
      const chars = '0123456789abcdef';
      let hash = '0x';
      for (let i = 0; i < 64; i++) {
        hash += chars[Math.floor(Math.random() * 16)];
      }
      return hash;
    }
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
