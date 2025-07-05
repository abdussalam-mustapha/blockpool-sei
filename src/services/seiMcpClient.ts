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

  constructor(private serverUrl: string = 'ws://localhost:3001') {}

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.serverUrl);

        this.ws.onopen = () => {
          console.log('Connected to SEI MCP Server');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.emit('connection', { status: 'connected' });
          
          // Initialize the MCP session
          this.initialize().then(() => {
            resolve();
          }).catch(reject);
        };

        this.ws.onmessage = (event) => {
          try {
            const message: MCPMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing MCP message:', error);
          }
        };

        this.ws.onclose = () => {
          console.log('Disconnected from SEI MCP Server');
          this.isConnected = false;
          this.emit('connection', { status: 'disconnected' });
          this.handleReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('SEI MCP WebSocket error:', error);
          this.emit('connection', { status: 'error', error });
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  private async initialize(): Promise<void> {
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
      
      setTimeout(() => {
        this.connect().catch(console.error);
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      this.emit('connection', { status: 'failed' });
    }
  }

  private sendRequest(method: string, params?: any): Promise<any> {
    return new Promise((resolve) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        console.error('WebSocket not connected');
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
      this.ws.send(JSON.stringify(message));

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
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

      return result?.content?.[0]?.text ? JSON.parse(result.content[0].text) : null;
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

      return result?.content?.[0]?.text ? JSON.parse(result.content[0].text) : null;
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

      return result?.content?.[0]?.text ? JSON.parse(result.content[0].text) : null;
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
      listeners.forEach(callback => callback(data));
    }
  }

  getConnectionStatus(): { connected: boolean; attempts: number } {
    return {
      connected: this.isConnected,
      attempts: this.reconnectAttempts
    };
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.pendingRequests.clear();
  }
}

// Singleton instance
export const seiMcpClient = new SeiMcpClient();
export type { BlockchainEvent, WalletAnalysis, TokenInfo };