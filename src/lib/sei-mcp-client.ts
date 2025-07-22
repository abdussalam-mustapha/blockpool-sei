import { MCPClientConfig, createMCPConfig } from './config';

// Types
export interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: any;
}

export interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface WalletAnalysis {
  address: string;
  balance: {
    amount: string;
    denom: string;
    formatted: string;
  };
  transactionCount?: number;
  lastActivity?: string;
  riskScore?: number;
  tokens?: Array<{
    denom: string;
    amount: string;
    value?: string;
  }>;
  network: string;
}

export interface TransactionData {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasUsed: string;
  gasPrice: string;
  blockNumber: number;
  timestamp: string;
  status: 'success' | 'failed';
  network: string;
}

export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply?: string;
  network: string;
}

export interface BlockInfo {
  number: number;
  hash: string;
  timestamp: string;
  transactions: string[];
  gasUsed: string;
  gasLimit: string;
  network: string;
}

// Cache Manager
class CacheManager {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  set(key: string, data: any, ttl: number = 30000): void {
    // Clean up expired entries if cache is getting full
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  getStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }
}

// Rate Limiter
class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequestsPerMinute: number = 120) {
    this.maxRequests = maxRequestsPerMinute;
    this.windowMs = 60000; // 1 minute
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    return this.requests.length < this.maxRequests;
  }

  recordRequest(): void {
    this.requests.push(Date.now());
  }

  getStatus(): { current: number; max: number; resetTime: number } {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    const oldestRequest = this.requests[0];
    const resetTime = oldestRequest ? oldestRequest + this.windowMs : now;
    
    return {
      current: this.requests.length,
      max: this.maxRequests,
      resetTime,
    };
  }
}

// Custom Errors
export class MCPConnectionError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'MCPConnectionError';
  }
}

export class MCPRequestError extends Error {
  constructor(message: string, public code?: number, public data?: any) {
    super(message);
    this.name = 'MCPRequestError';
  }
}

export class MCPTimeoutError extends Error {
  constructor(message: string = 'Request timeout') {
    super(message);
    this.name = 'MCPTimeoutError';
  }
}

// Event Emitter
class EventEmitter {
  private events = new Map<string, Function[]>();

  on(event: string, callback: Function): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event: string, ...args: any[]): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in event callback for ${event}:`, error);
        }
      });
    }
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }
}

// Main MCP Client
export class SeiMCPClient extends EventEmitter {
  private config: MCPClientConfig;
  private cache: CacheManager;
  private rateLimiter: RateLimiter;
  private sessionId: string | null = null;
  private requestId = 0;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private eventSource: EventSource | null = null;

  constructor(config?: Partial<MCPClientConfig>) {
    super();
    this.config = createMCPConfig(config);
    this.cache = new CacheManager(this.config.cache.maxSize);
    this.rateLimiter = new RateLimiter(this.config.rateLimit.maxRequestsPerMinute);
    
    if (this.config.debug) {
      console.log('[MCP] Client initialized with config:', this.config);
    }
  }

  private generateSessionId(): string {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[MCP]', ...args);
    }
  }

  private error(...args: any[]): void {
    console.error('[MCP]', ...args);
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      this.log('Already connected');
      return;
    }

    this.log(`Connecting to MCP server at ${this.config.server.url}...`);
    
    try {
      // First, check server health 
      this.log('Checking server health...');
      const healthResponse = await fetch(`${this.config.server.url}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(this.config.server.timeout)
      });

      if (!healthResponse.ok) {
        throw new Error(`Health check failed: ${healthResponse.status} ${healthResponse.statusText}`);
      }

      const healthData = await healthResponse.json();
      this.log('Server health check passed:', healthData);

      // Generate session ID
      this.sessionId = this.generateSessionId();
      
      // Test connection with a simple MCP request
      this.log('Testing MCP connection...');
      await this.makeRequest('get_supported_networks', {});
      
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connected', { sessionId: this.sessionId, health: healthData });
      this.log('Connected successfully with session:', this.sessionId);
      
    } catch (error) {
      this.error('Connection failed:', error);
      this.isConnected = false;
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new MCPConnectionError(
        `Failed to connect to MCP server at ${this.config.server.url}: ${errorMessage}`
      );
    }
  }

  async disconnect(): Promise<void> {
    this.log('Disconnecting...');
    
    this.isConnected = false;
    this.sessionId = null;
    
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    this.cache.clear();
    this.emit('disconnected');
    this.log('Disconnected');
  }

  private async makeRequest(method: string, params: any = {}): Promise<any> {
    if (!this.rateLimiter.canMakeRequest()) {
      throw new MCPRequestError('Rate limit exceeded');
    }

    const cacheKey = `${method}:${JSON.stringify(params)}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.log(`Cache hit for ${method}`);
      return cached;
    }

    this.rateLimiter.recordRequest();
    const requestId = ++this.requestId;
    
    this.log(`Making request ${requestId}: ${method}`, params);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.server.timeout
      );

      const response = await fetch(`${this.config.server.url}/api/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': this.sessionId || `temp-session-${Date.now()}`
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: requestId,
          method,
          params
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new MCPRequestError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status
        );
      }

      const result = await response.json();
      
      if (result.error) {
        throw new MCPRequestError(
          result.error.message || 'MCP request error',
          result.error.code,
          result.error.data
        );
      }

      // Cache successful results
      this.cache.set(cacheKey, result.result, this.config.cache.ttl);
      
      this.log(`Request ${requestId} completed successfully`);
      return result.result;
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new MCPTimeoutError(`Request timeout after ${this.config.server.timeout}ms`);
      }
      
      this.error(`Request ${requestId} failed:`, error);
      throw error;
    }
  }

  // Public API Methods
  async getBalance(address: string, network?: string): Promise<WalletAnalysis> {
    const result = await this.makeRequest('get_balance', { 
      address, 
      network: network || this.config.network.network 
    });
    
    return {
      address,
      balance: {
        amount: result.balances?.[0]?.amount || '0',
        denom: result.balances?.[0]?.denom || 'usei',
        formatted: this.formatBalance(result.balances?.[0]?.amount || '0', result.balances?.[0]?.denom || 'usei'),
      },
      network: network || this.config.network.network,
      tokens: result.balances || [],
    };
  }

  async getTransaction(hash: string, network?: string): Promise<TransactionData> {
    const result = await this.makeRequest('get_transaction', { 
      hash, 
      network: network || this.config.network.network 
    });
    
    return {
      hash: result.hash || hash,
      from: result.from || '',
      to: result.to || '',
      value: result.value || '0',
      gasUsed: result.gasUsed || '0',
      gasPrice: result.gasPrice || '0',
      blockNumber: result.blockNumber || 0,
      timestamp: result.timestamp || new Date().toISOString(),
      status: result.status || 'success',
      network: network || this.config.network.network,
    };
  }

  async getLatestBlock(network?: string): Promise<BlockInfo> {
    const result = await this.makeRequest('get_latest_block', { 
      network: network || this.config.network.network 
    });
    
    return {
      number: result.number || 0,
      hash: result.hash || '',
      timestamp: result.timestamp || new Date().toISOString(),
      transactions: result.transactions || [],
      gasUsed: result.gasUsed || '0',
      gasLimit: result.gasLimit || '0',
      network: network || this.config.network.network,
    };
  }

  async getERC20Balance(tokenAddress: string, address: string, network?: string): Promise<string> {
    const result = await this.makeRequest('get_erc20_balance', { 
      tokenAddress, 
      address, 
      network: network || this.config.network.network 
    });
    
    return result.balance || '0';
  }

  async getERC20TokenInfo(tokenAddress: string, network?: string): Promise<TokenInfo> {
    const result = await this.makeRequest('get_erc20_token_info', { 
      tokenAddress, 
      network: network || this.config.network.network 
    });
    
    return {
      address: tokenAddress,
      name: result.name || '',
      symbol: result.symbol || '',
      decimals: result.decimals || 18,
      totalSupply: result.totalSupply,
      network: network || this.config.network.network,
    };
  }

  async estimateGas(to: string, data?: string, value?: string, network?: string): Promise<string> {
    const result = await this.makeRequest('estimate_gas', { 
      to, 
      data: data || '0x',
      value: value || '0',
      network: network || this.config.network.network 
    });
    
    return result.gasEstimate || '21000';
  }

  async isContract(address: string, network?: string): Promise<boolean> {
    const result = await this.makeRequest('is_contract', { 
      address, 
      network: network || this.config.network.network 
    });
    
    return result.isContract || false;
  }

  async analyzeWallet(address: string, network?: string): Promise<any> {
    const result = await this.makeRequest('analyze_wallet', { 
      address, 
      network: network || this.config.network.network 
    });
    
    return result;
  }

  // Utility Methods
  private formatBalance(amount: string, denom: string): string {
    const num = parseFloat(amount);
    if (denom === 'usei') {
      return (num / 1000000).toFixed(6) + ' SEI';
    }
    return amount + ' ' + denom;
  }

  getConnectionStatus(): { connected: boolean; sessionId: string | null } {
    return {
      connected: this.isConnected,
      sessionId: this.sessionId,
    };
  }

  getCacheStats(): { size: number; maxSize: number } {
    return this.cache.getStats();
  }

  getRateLimitStatus(): { current: number; max: number; resetTime: number } {
    return this.rateLimiter.getStatus();
  }

  clearCache(): void {
    this.cache.clear();
    this.log('Cache cleared');
  }

  setDebugMode(enabled: boolean): void {
    this.config.debug = enabled;
    this.log('Debug mode', enabled ? 'enabled' : 'disabled');
  }

  getDebugInfo(): any {
    return {
      config: this.config,
      connectionStatus: this.getConnectionStatus(),
      cacheStats: this.getCacheStats(),
      rateLimitStatus: this.getRateLimitStatus(),
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}

// Singleton instance
export const seiMcpClient = new SeiMCPClient({
  debug: process.env.NODE_ENV === 'development',
});

// Auto-connect when module loads
seiMcpClient.connect().catch(error => {
  console.error('[MCP] Auto-connect failed:', error);
});
