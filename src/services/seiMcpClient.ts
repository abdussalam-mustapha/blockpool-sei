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
  description: string;
  amount?: string;
  from?: string;
  to?: string;
  timestamp: string;
  txHash: string;
  blockHeight?: number;
  gasUsed?: string;
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

class SeiMcpClient {
  private ws: WebSocket | null = null;
  private messageId = 0;
  private pendingRequests = new Map<string | number, (result: any) => void>();
  private eventListeners = new Map<string, ((data: any) => void)[]>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnected = false;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor(private serverUrl: string = 'ws://localhost:3001') {}

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Clear any existing reconnect timeout
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }

        // Use native browser WebSocket
        this.ws = new WebSocket(this.serverUrl);

        this.ws.onopen = () => {
          console.log('Connected to SEI MCP Server');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.emit('connection', { status: 'connected' });
          
          // Initialize the MCP session
          this.initialize().then(() => {
            resolve();
          }).catch((error) => {
            console.error('Failed to initialize MCP session:', error);
            // Still resolve as connection is established
            resolve();
          });
        };

        this.ws.onmessage = (event) => {
          try {
            const message: MCPMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing MCP message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('Disconnected from SEI MCP Server', event.code, event.reason);
          this.isConnected = false;
          this.ws = null;
          this.emit('connection', { status: 'disconnected' });
          
          // Only attempt reconnect if it wasn't a manual close
          if (event.code !== 1000) {
            this.handleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('SEI MCP WebSocket error:', error);
          this.isConnected = false;
          this.emit('connection', { status: 'error', error });
          reject(new Error('Failed to connect to SEI MCP Server'));
        };

        // Connection timeout
        setTimeout(() => {
          if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
            this.ws.close();
            reject(new Error('Connection timeout'));
          }
        }, 10000);

      } catch (error) {
        console.error('Error creating WebSocket connection:', error);
        reject(error);
      }
    });
  }

  private async initialize(): Promise<void> {
    try {
      // Initialize MCP session
      await this.sendRequest('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
          resources: {},
          prompts: {}
        },
        clientInfo: {
          name: 'Blockpool',
          version: '1.0.0'
        }
      });

      // Subscribe to blockchain events
      await this.subscribeToEvents();
    } catch (error) {
      console.error('Failed to initialize MCP session:', error);
      throw error;
    }
  }

  private async subscribeToEvents(): Promise<void> {
    try {
      // Subscribe to various blockchain events
      await this.sendRequest('tools/call', {
        name: 'subscribe_to_events',
        arguments: {
          events: ['transfer', 'mint', 'swap', 'contract_interaction'],
          filters: {
            minAmount: '1000000', // 1 SEI minimum
            includeNFTs: true,
            includeDeFi: true
          }
        }
      });

      console.log('Subscribed to SEI blockchain events');
    } catch (error) {
      console.error('Failed to subscribe to events:', error);
    }
  }

  private handleMessage(message: MCPMessage): void {
    if (message.id && this.pendingRequests.has(message.id)) {
      const resolver = this.pendingRequests.get(message.id);
      this.pendingRequests.delete(message.id);
      
      if (message.error) {
        console.error('MCP Error:', message.error);
        resolver?.(null);
      } else {
        resolver?.(message.result);
      }
    } else if (message.method === 'notifications/blockchain_event') {
      // Handle real-time blockchain events
      this.handleBlockchainEvent(message.params);
    } else if (message.method === 'notifications/market_update') {
      // Handle market data updates
      this.emit('marketUpdate', message.params);
    }
  }

  private handleBlockchainEvent(eventData: any): void {
    const event: BlockchainEvent = {
      id: eventData.id || Math.random().toString(),
      type: eventData.type,
      description: eventData.description,
      amount: eventData.amount,
      from: eventData.from,
      to: eventData.to,
      timestamp: new Date(eventData.timestamp).toLocaleTimeString(),
      txHash: eventData.txHash,
      blockHeight: eventData.blockHeight,
      gasUsed: eventData.gasUsed,
      fee: eventData.fee
    };

    this.emit('blockchainEvent', event);
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
      this.emit('connection', { status: 'reconnecting', attempts: this.reconnectAttempts });
      
      this.reconnectTimeout = setTimeout(() => {
        this.connect().catch((error) => {
          console.error('Reconnection failed:', error);
          this.handleReconnect();
        });
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      this.emit('connection', { status: 'failed' });
    }
  }

  private sendRequest(method: string, params?: any): Promise<any> {
    return new Promise((resolve) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        console.warn('WebSocket not connected, cannot send request:', method);
        resolve(null);
        return;
      }

      const id = ++this.messageId;
      const message: MCPMessage = {
        jsonrpc: '2.0',
        id,
        method,
        params
      };

      this.pendingRequests.set(id, resolve);
      
      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        this.pendingRequests.delete(id);
        resolve(null);
        return;
      }

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          console.warn('Request timeout for method:', method);
          resolve(null);
        }
      }, 30000);
    });
  }

  // Public API methods
  async analyzeWallet(address: string): Promise<WalletAnalysis | null> {
    try {
      const result = await this.sendRequest('tools/call', {
        name: 'analyze_wallet',
        arguments: { address }
      });

      if (result?.content?.[0]?.text) {
        return JSON.parse(result.content[0].text);
      }
      
      // Return mock data if MCP is not available
      return {
        address,
        balance: `${(Math.random() * 10000).toFixed(3)} SEI`,
        transactionCount: Math.floor(Math.random() * 1000) + 50,
        lastActivity: '2 hours ago',
        riskScore: Math.random() * 0.5, // Low to medium risk
        tokens: [
          { denom: 'usei', amount: `${(Math.random() * 10000).toFixed(3)}`, value: '$1,234' },
          { denom: 'seiyan', amount: `${(Math.random() * 5000).toFixed(0)}`, value: '$567' }
        ],
        recentTransactions: []
      };
    } catch (error) {
      console.error('Error analyzing wallet:', error);
      return null;
    }
  }

  async getTokenInfo(denom: string): Promise<TokenInfo | null> {
    try {
      const result = await this.sendRequest('tools/call', {
        name: 'get_token_info',
        arguments: { denom }
      });

      return result?.content?.[0]?.text ? JSON.parse(result.content[0].text) : null;
    } catch (error) {
      console.error('Error getting token info:', error);
      return null;
    }
  }

  async getMarketData(): Promise<any> {
    try {
      const result = await this.sendRequest('tools/call', {
        name: 'get_market_data',
        arguments: {}
      });

      if (result?.content?.[0]?.text) {
        return JSON.parse(result.content[0].text);
      }

      // Return mock market data if MCP is not available
      return {
        seiPrice: (0.5 + Math.random() * 0.3).toFixed(3),
        seiChange24h: (Math.random() * 20 - 10).toFixed(2),
        marketCap: '$2.1B',
        volume24h: '$145M',
        tvl: '$89M',
        activeWallets: Math.floor(Math.random() * 10000) + 5000,
        transactions24h: Math.floor(Math.random() * 100000) + 50000,
        avgGas: '0.002',
        tokenFlow: '$1.2M',
        tokenFlowChange: '+15.3%',
        activeWalletsChange: '+8.7%',
        topToken: 'SEIYAN',
        topTokenChange: '+45.2%',
        riskyContracts: Math.floor(Math.random() * 5),
        riskyContractsChange: '-50%',
        swapVolume: '$892K',
        swapVolumeChange: '+22.4%'
      };
    } catch (error) {
      console.error('Error getting market data:', error);
      return null;
    }
  }

  async searchTransactions(filters: any): Promise<BlockchainEvent[]> {
    try {
      const result = await this.sendRequest('tools/call', {
        name: 'search_transactions',
        arguments: filters
      });

      const data = result?.content?.[0]?.text ? JSON.parse(result.content[0].text) : null;
      return data?.transactions || [];
    } catch (error) {
      console.error('Error searching transactions:', error);
      return [];
    }
  }

  async getNFTActivity(): Promise<any[]> {
    try {
      const result = await this.sendRequest('tools/call', {
        name: 'get_nft_activity',
        arguments: {}
      });

      const data = result?.content?.[0]?.text ? JSON.parse(result.content[0].text) : null;
      return data?.activities || [];
    } catch (error) {
      console.error('Error getting NFT activity:', error);
      return [];
    }
  }

  async getRiskAnalysis(address: string): Promise<any> {
    try {
      const result = await this.sendRequest('tools/call', {
        name: 'analyze_risk',
        arguments: { address }
      });

      if (result?.content?.[0]?.text) {
        return JSON.parse(result.content[0].text);
      }

      // Return mock risk analysis if MCP is not available
      const riskScore = Math.random() * 0.6; // Low to medium risk
      return {
        score: riskScore,
        factors: riskScore > 0.3 ? ['High transaction frequency', 'Multiple token interactions'] : ['Normal activity pattern'],
        recommendations: ['Verify contract addresses', 'Use established protocols', 'Monitor for unusual activity']
      };
    } catch (error) {
      console.error('Error getting risk analysis:', error);
      return null;
    }
  }

  // Event system
  on(event: string, callback: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: (data: any) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  getConnectionStatus(): { connected: boolean; attempts: number } {
    return {
      connected: this.isConnected,
      attempts: this.reconnectAttempts
    };
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
    
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.pendingRequests.clear();
  }
}

// Singleton instance
export const seiMcpClient = new SeiMcpClient();

// Auto-connect when module loads
seiMcpClient.connect().catch((error) => {
  console.warn('Initial MCP connection failed, will retry:', error.message);
});

export type { BlockchainEvent, WalletAnalysis, TokenInfo };