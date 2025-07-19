// MCP Client Configuration
export interface MCPClientConfig {
  server: {
    url: string;
    timeout: number;
  };
  network: {
    network: 'mainnet' | 'testnet';
    rpcUrl?: string;
  };
  cache: {
    ttl: number;
    maxSize: number;
  };
  rateLimit: {
    maxRequestsPerMinute: number;
  };
  debug: boolean;
}

export const DEFAULT_CONFIG: MCPClientConfig = {
  server: {
    url: 'http://localhost:3004',
    timeout: 15000,
  },
  network: {
    network: 'mainnet',
  },
  cache: {
    ttl: 30000, // 30 seconds
    maxSize: 1000,
  },
  rateLimit: {
    maxRequestsPerMinute: 120,
  },
  debug: false,
};

export function createMCPConfig(overrides?: Partial<MCPClientConfig>): MCPClientConfig {
  return {
    ...DEFAULT_CONFIG,
    ...overrides,
    server: {
      ...DEFAULT_CONFIG.server,
      ...overrides?.server,
    },
    network: {
      ...DEFAULT_CONFIG.network,
      ...overrides?.network,
    },
    cache: {
      ...DEFAULT_CONFIG.cache,
      ...overrides?.cache,
    },
    rateLimit: {
      ...DEFAULT_CONFIG.rateLimit,
      ...overrides?.rateLimit,
    },
  };
}
