/**
 * Enhanced SEI MCP Client with Professional Error Handling and Session Management
 * Based on SEI Sorcerer's implementation with improvements
 */

import { 
  MCPConnectionError, 
  MCPTimeoutError, 
  MCPUnavailableError, 
  RateLimitError,
  ErrorHandler,
  type ErrorContext 
} from '../utils/errors';

export interface MCPClientConfig {
  serverUrl: string;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
  rateLimit: {
    maxRequestsPerMinute: number;
    windowMs: number;
  };
  cache: {
    defaultTTL: number;
    maxSize: number;
  };
  debug: boolean;
}

export interface SessionInfo {
  id: string;
  createdAt: Date;
  lastActivity: Date;
  requestCount: number;
  isActive: boolean;
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

export interface RequestMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastRequestTime?: Date;
}

/**
 * Rate limiter with sliding window
 */
class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
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

  getStatus(): { remaining: number; resetTime: Date } {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    const remaining = Math.max(0, this.maxRequests - this.requests.length);
    const oldestRequest = this.requests[0];
    const resetTime = oldestRequest ? new Date(oldestRequest + this.windowMs) : new Date();
    
    return { remaining, resetTime };
  }
}

/**
 * Intelligent cache with TTL and LRU eviction
 */
class CacheManager {
  private cache = new Map<string, CacheEntry>();
  private accessOrder: string[] = [];
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.delete(key);
      return null;
    }

    // Update access order for LRU
    this.updateAccessOrder(key);
    entry.hits++;
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttl: number): void {
    // Evict if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      hits: 0
    });

    this.updateAccessOrder(key);
  }

  delete(key: string): void {
    this.cache.delete(key);
    this.accessOrder = this.accessOrder.filter(k => k !== key);
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  private updateAccessOrder(key: string): void {
    this.accessOrder = this.accessOrder.filter(k => k !== key);
    this.accessOrder.push(key);
  }

  private evictLRU(): void {
    const lruKey = this.accessOrder.shift();
    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  getStats(): { size: number; hitRate: number; entries: Array<{ key: string; hits: number; age: number }> } {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      hits: entry.hits,
      age: Date.now() - entry.timestamp
    }));

    const totalHits = entries.reduce((sum, entry) => sum + entry.hits, 0);
    const hitRate = totalHits > 0 ? totalHits / (totalHits + entries.length) : 0;

    return { size: this.cache.size, hitRate, entries };
  }
}

/**
 * Enhanced SEI MCP Client
 */
export class EnhancedSeiMcpClient {
  private config: MCPClientConfig;
  private session: SessionInfo | null = null;
  private cache: CacheManager;
  private rateLimiter: RateLimiter;
  private metrics: RequestMetrics;
  private connecting: Promise<void> | null = null;

  constructor(config: Partial<MCPClientConfig> = {}) {
    this.config = {
      serverUrl: import.meta.env.VITE_MCP_SERVER_URL || 'https://sei-mcp-server-1.onrender.com',
      timeout: 15000,
      maxRetries: 3,
      retryDelay: 1000,
      rateLimit: {
        maxRequestsPerMinute: 120,
        windowMs: 60000
      },
      cache: {
        defaultTTL: 30000, // 30 seconds
        maxSize: 1000
      },
      debug: import.meta.env.DEV || false,
      ...config
    };

    this.cache = new CacheManager(this.config.cache.maxSize);
    this.rateLimiter = new RateLimiter(
      this.config.rateLimit.maxRequestsPerMinute,
      this.config.rateLimit.windowMs
    );
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0
    };

    if (this.config.debug) {
      console.log('🚀 [MCP] Enhanced SEI MCP Client initialized:', {
        serverUrl: this.config.serverUrl,
        rateLimit: this.config.rateLimit.maxRequestsPerMinute + '/min',
        cacheSize: this.config.cache.maxSize,
        timeout: this.config.timeout + 'ms'
      });
    }
  }

  /**
   * Ensure connection with session management
   */
  private async ensureConnected(): Promise<void> {
    if (this.connecting) {
      return this.connecting;
    }

    if (this.session?.isActive) {
      return;
    }

    this.connecting = this.connect();
    try {
      await this.connecting;
    } finally {
      this.connecting = null;
    }
  }

  /**
   * Establish connection and create session
   */
  private async connect(): Promise<void> {
    try {
      const sessionId = this.generateSessionId();
      const response = await this.makeHttpRequest('/session/create', {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        this.session = {
          id: sessionId,
          createdAt: new Date(),
          lastActivity: new Date(),
          requestCount: 0,
          isActive: true
        };

        if (this.config.debug) {
          console.log('✅ [MCP] Session created:', sessionId);
        }
      } else {
        throw new MCPConnectionError('Failed to create MCP session');
      }
    } catch (error) {
      if (this.config.debug) {
        console.error('❌ [MCP] Connection failed:', error);
      }
      throw new MCPConnectionError(
        error instanceof Error ? error.message : 'Unknown connection error'
      );
    }
  }

  /**
   * Make HTTP request with retry logic and error handling
   */
  private async makeHttpRequest(
    endpoint: string, 
    options: RequestInit,
    retryCount = 0
  ): Promise<Response> {
    const url = `${this.config.serverUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new MCPTimeoutError(`Request timeout after ${this.config.timeout}ms`);
      }

      // Retry logic
      if (retryCount < this.config.maxRetries) {
        const delay = this.config.retryDelay * Math.pow(2, retryCount);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeHttpRequest(endpoint, options, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Make MCP request with caching, rate limiting, and error handling
   */
  private async makeRequest<T>(
    tool: string,
    params: any,
    cacheKey?: string,
    cacheTTL?: number
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      // Check cache first
      if (cacheKey) {
        const cached = this.cache.get<T>(cacheKey);
        if (cached) {
          if (this.config.debug) {
            console.log('📦 [MCP] Cache hit:', cacheKey);
          }
          return cached;
        }
      }

      // Check rate limit
      if (!this.rateLimiter.canMakeRequest()) {
        const status = this.rateLimiter.getStatus();
        throw new RateLimitError({
          operation: tool,
          suggestions: [`Wait until ${status.resetTime.toLocaleTimeString()}`]
        });
      }

      // Ensure connection
      await this.ensureConnected();

      // Record request
      this.rateLimiter.recordRequest();
      this.metrics.totalRequests++;
      this.metrics.lastRequestTime = new Date();

      if (this.session) {
        this.session.requestCount++;
        this.session.lastActivity = new Date();
      }

      // Make request
      const response = await this.makeHttpRequest('/tools/call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': this.session?.id || ''
        },
        body: JSON.stringify({
          name: tool,
          arguments: params
        })
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new RateLimitError({ operation: tool });
        }
        if (response.status >= 500) {
          throw new MCPUnavailableError(`Server error: ${response.status}`);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Update metrics
      const responseTime = Date.now() - startTime;
      this.metrics.successfulRequests++;
      this.metrics.averageResponseTime = 
        (this.metrics.averageResponseTime * (this.metrics.successfulRequests - 1) + responseTime) / 
        this.metrics.successfulRequests;

      // Cache result
      if (cacheKey && data) {
        this.cache.set(cacheKey, data, cacheTTL || this.config.cache.defaultTTL);
      }

      if (this.config.debug) {
        console.log(`✅ [MCP] ${tool} completed in ${responseTime}ms`);
      }

      return data;
    } catch (error) {
      this.metrics.failedRequests++;
      
      if (this.config.debug) {
        console.error(`❌ [MCP] ${tool} failed:`, error);
      }

      throw error;
    }
  }

  /**
   * Public API methods with enhanced error handling
   */
  async getWalletBalance(address: string, network = 'sei'): Promise<any> {
    try {
      return await this.makeRequest(
        'get_balance',
        { address, network },
        `balance:${address}:${network}`,
        10000 // 10 second cache
      );
    } catch (error) {
      throw ErrorHandler.handleUnknownError(error, 'wallet balance lookup', { 
        address, 
        network 
      });
    }
  }

  async getTransaction(txHash: string, network = 'sei'): Promise<any> {
    try {
      return await this.makeRequest(
        'get_transaction',
        { txHash, network },
        `tx:${txHash}:${network}`,
        60000 // 1 minute cache
      );
    } catch (error) {
      throw ErrorHandler.handleUnknownError(error, 'transaction lookup', { 
        address: txHash, 
        network 
      });
    }
  }

  async getLatestBlock(network = 'sei'): Promise<any> {
    try {
      return await this.makeRequest(
        'get_latest_block',
        { network },
        `latest_block:${network}`,
        5000 // 5 second cache
      );
    } catch (error) {
      throw ErrorHandler.handleUnknownError(error, 'latest block lookup', { network });
    }
  }

  async getChainInfo(network = 'sei'): Promise<any> {
    try {
      return await this.makeRequest(
        'get_chain_info',
        { network },
        `chain_info:${network}`,
        30000 // 30 second cache
      );
    } catch (error) {
      throw ErrorHandler.handleUnknownError(error, 'chain info lookup', { network });
    }
  }

  /**
   * Utility methods
   */
  generateSessionId(): string {
    return `sei_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  formatAddress(address: string): string {
    if (!address || address.length <= 12) return address || 'Unknown';
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  }

  formatAmount(amount: string, decimals = 6): string {
    const num = parseFloat(amount);
    if (isNaN(num)) return '0';
    
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    if (num < 0.01) return num.toFixed(6);
    if (num < 1) return num.toFixed(4);
    return num.toFixed(2);
  }

  formatSEI(amount: string): string {
    const formatted = this.formatAmount(amount);
    return `${formatted} SEI`;
  }

  /**
   * Management and monitoring methods
   */
  getConnectionStatus(): { 
    connected: boolean; 
    session: SessionInfo | null; 
    metrics: RequestMetrics;
    rateLimit: { remaining: number; resetTime: Date };
    cache: { size: number; hitRate: number };
  } {
    return {
      connected: this.session?.isActive || false,
      session: this.session,
      metrics: this.metrics,
      rateLimit: this.rateLimiter.getStatus(),
      cache: {
        size: this.cache.getStats().size,
        hitRate: this.cache.getStats().hitRate
      }
    };
  }

  clearCache(pattern?: string): void {
    if (pattern) {
      // Clear specific pattern (not implemented in this simple version)
      console.warn('Pattern-based cache clearing not implemented');
    } else {
      this.cache.clear();
    }
  }

  async disconnect(): Promise<void> {
    if (this.session) {
      try {
        await this.makeHttpRequest('/session/close', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-ID': this.session.id
          }
        });
      } catch (error) {
        console.warn('Failed to close session gracefully:', error);
      }

      this.session.isActive = false;
      this.session = null;
    }

    this.cache.clear();
  }

  setDebugMode(enabled: boolean): void {
    this.config.debug = enabled;
  }
}

// Export singleton instance
export const enhancedSeiMcpClient = new EnhancedSeiMcpClient();
