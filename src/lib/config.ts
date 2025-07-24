// Supported blockchain networks - SEI with both native and EVM support
export type SupportedNetwork = 
  // SEI Networks (with both native and EVM capabilities)
  | 'sei' | 'sei-testnet' | 'sei-devnet'
  // SEI EVM Mode (same networks but accessing EVM functionality)
  | 'sei-evm' | 'sei-testnet-evm' | 'sei-devnet-evm';

// SEI RPC endpoint pools for load balancing and failover
export const SEI_RPC_ENDPOINTS = {
  mainnet: {
    native: ['https://sei.drpc.org', 'https://rpc.sei-apis.com'],
    evm: [
      'https://evm-rpc.sei-apis.com',
      'https://sei-evm-rpc.stakeme.pro',
      'https://node.histori.xyz/sei-mainnet/8ry9f6t9dct1se2hlagxnd9n2a',
      'https://sei.drpc.org'
    ]
  },
  testnet: {
    native: ['https://rpc-testnet.sei-apis.com'],
    evm: ['https://evm-rpc-testnet.sei-apis.com']
  },
  devnet: {
    native: ['https://rpc-arctic-1.sei-apis.com'],
    evm: ['https://evm-rpc-arctic-1.sei-apis.com']
  }
};

// WebSocket endpoints for real-time data
export const SEI_WS_ENDPOINTS = {
  mainnet: {
    evm: ['wss://evm-ws.sei-apis.com', 'wss://sei.drpc.org']
  },
  testnet: {
    evm: ['wss://evm-ws-testnet.sei-apis.com']
  },
  devnet: {
    evm: ['wss://evm-ws-arctic-1.sei-apis.com']
  }
};

// Network configuration
export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  type: 'sei' | 'sei-evm';
  mode: 'native' | 'evm'; // Whether to use native SEI or EVM mode
}

// MCP Client Configuration
export interface MCPClientConfig {
  server: {
    url: string;
    timeout: number;
  };
  network: {
    network: SupportedNetwork;
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

// Network configurations for SEI with native and EVM support
export const NETWORK_CONFIGS: Record<SupportedNetwork, NetworkConfig> = {
  // SEI Networks (Native Mode)
  'sei': {
    name: 'SEI Network',
    chainId: 1329,
    rpcUrl: 'https://sei.drpc.org',
    explorerUrl: 'https://seitrace.com',
    nativeCurrency: { name: 'SEI', symbol: 'SEI', decimals: 6 },
    type: 'sei',
    mode: 'native'
  },
  'sei-testnet': {
    name: 'SEI Testnet',
    chainId: 1328,
    rpcUrl: 'https://rpc-testnet.sei-apis.com',
    explorerUrl: 'https://seitrace.com',
    nativeCurrency: { name: 'SEI', symbol: 'SEI', decimals: 6 },
    type: 'sei',
    mode: 'native'
  },
  'sei-devnet': {
    name: 'SEI Devnet',
    chainId: 713715,
    rpcUrl: 'https://rpc-arctic-1.sei-apis.com',
    explorerUrl: 'https://seitrace.com',
    nativeCurrency: { name: 'SEI', symbol: 'SEI', decimals: 6 },
    type: 'sei',
    mode: 'native'
  },
  // SEI Networks (EVM Mode)
  'sei-evm': {
    name: 'SEI Network (EVM)',
    chainId: 1329,
    rpcUrl: 'https://evm-rpc.sei-apis.com',
    explorerUrl: 'https://seitrace.com',
    nativeCurrency: { name: 'SEI', symbol: 'SEI', decimals: 18 },
    type: 'sei-evm',
    mode: 'evm'
  },
  'sei-testnet-evm': {
    name: 'SEI Testnet (EVM)',
    chainId: 1328,
    rpcUrl: 'https://evm-rpc-testnet.sei-apis.com',
    explorerUrl: 'https://seitrace.com',
    nativeCurrency: { name: 'SEI', symbol: 'SEI', decimals: 18 },
    type: 'sei-evm',
    mode: 'evm'
  },
  'sei-devnet-evm': {
    name: 'SEI Devnet (EVM)',
    chainId: 713715,
    rpcUrl: 'https://evm-rpc-arctic-1.sei-apis.com',
    explorerUrl: 'https://seitrace.com',
    nativeCurrency: { name: 'SEI', symbol: 'SEI', decimals: 18 },
    type: 'sei-evm',
    mode: 'evm'
  }
};

export const DEFAULT_CONFIG: MCPClientConfig = {
  server: {
    url: 'https://sei-mcp-server-1.onrender.com',
    timeout: 15000,
  },
  network: {
    network: 'sei',
  },
  cache: {
    ttl: 30000, // 30 seconds
    maxSize: 1000,
  },
  rateLimit: {
    maxRequestsPerMinute: 30,
  },
  debug: false,
};

// Helper functions for network configuration management
export const getNetworkConfig = (network: SupportedNetwork): NetworkConfig => {
  return NETWORK_CONFIGS[network];
};

export const getChainId = (network: SupportedNetwork): number => {
  return NETWORK_CONFIGS[network].chainId;
};

export const getRpcUrl = (network: SupportedNetwork): string => {
  return NETWORK_CONFIGS[network].rpcUrl;
};

export const getExplorerUrl = (network: SupportedNetwork): string => {
  return NETWORK_CONFIGS[network].explorerUrl;
};

export const getNativeCurrency = (network: SupportedNetwork) => {
  return NETWORK_CONFIGS[network].nativeCurrency;
};

export const isEVMMode = (network: SupportedNetwork): boolean => {
  return NETWORK_CONFIGS[network].mode === 'evm';
};

export const isNativeMode = (network: SupportedNetwork): boolean => {
  return NETWORK_CONFIGS[network].mode === 'native';
};

export const isSEINetwork = (network: SupportedNetwork): boolean => {
  return network.startsWith('sei');
};

export const getSupportedNetworks = (): SupportedNetwork[] => {
  return Object.keys(NETWORK_CONFIGS) as SupportedNetwork[];
};

export const getEVMNetworks = (): SupportedNetwork[] => {
  return getSupportedNetworks().filter(network => isEVMMode(network));
};

export const getNativeNetworks = (): SupportedNetwork[] => {
  return getSupportedNetworks().filter(network => isNativeMode(network));
};

export const getSEINetworks = (): SupportedNetwork[] => {
  return getSupportedNetworks().filter(network => isSEINetwork(network));
};

export const getNetworkByChainId = (chainId: number): SupportedNetwork | undefined => {
  return getSupportedNetworks().find(network => getChainId(network) === chainId);
};

export const formatExplorerUrl = (network: SupportedNetwork, type: 'tx' | 'address' | 'block', value: string): string => {
  const baseUrl = getExplorerUrl(network);
  const isEVM = isEVMMode(network);
  
  switch (type) {
    case 'tx':
      // SEI native uses different URL format than EVM
      return isEVM ? `${baseUrl}/tx/${value}` : `${baseUrl}/tx/${value}`;
    case 'address':
      return isEVM ? `${baseUrl}/address/${value}` : `${baseUrl}/account/${value}`;
    case 'block':
      return isEVM ? `${baseUrl}/block/${value}` : `${baseUrl}/block/${value}`;
    default:
      return baseUrl;
  }
};

export const getNetworkMode = (network: SupportedNetwork): 'native' | 'evm' => {
  return NETWORK_CONFIGS[network].mode;
};

export const getNetworkType = (network: SupportedNetwork): 'sei' | 'sei-evm' => {
  return NETWORK_CONFIGS[network].type;
};

export const getNetworkDisplayName = (network: SupportedNetwork): string => {
  return NETWORK_CONFIGS[network].name;
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

/**
 * Get all available RPC URLs for a network (for failover)
 * @param network The network to get RPC URLs for
 * @returns Array of RPC URLs for the specified network
 */
export function getRpcUrlPool(network: SupportedNetwork): string[] {
  const isEVM = isEVMMode(network);
  const networkType = network.includes('testnet') ? 'testnet' : 
                     network.includes('devnet') ? 'devnet' : 'mainnet';
  
  if (isEVM) {
    return SEI_RPC_ENDPOINTS[networkType as keyof typeof SEI_RPC_ENDPOINTS].evm;
  } else {
    return SEI_RPC_ENDPOINTS[networkType as keyof typeof SEI_RPC_ENDPOINTS].native;
  }
}

/**
 * Get WebSocket endpoint for a network
 * @param network The network to get WebSocket URL for
 * @returns WebSocket URL for the specified network (EVM only)
 */
export function getWebSocketUrl(network: SupportedNetwork): string | null {
  if (!isEVMMode(network)) {
    return null; // WebSocket only available for EVM mode
  }
  
  const networkType = network.includes('testnet') ? 'testnet' : 
                     network.includes('devnet') ? 'devnet' : 'mainnet';
  
  const endpoints = SEI_WS_ENDPOINTS[networkType as keyof typeof SEI_WS_ENDPOINTS].evm;
  return endpoints[0]; // Return primary WebSocket endpoint
}

/**
 * Get all available WebSocket URLs for a network (for failover)
 * @param network The network to get WebSocket URLs for
 * @returns Array of WebSocket URLs for the specified network (EVM only)
 */
export function getWebSocketUrlPool(network: SupportedNetwork): string[] {
  if (!isEVMMode(network)) {
    return []; // WebSocket only available for EVM mode
  }
  
  const networkType = network.includes('testnet') ? 'testnet' : 
                     network.includes('devnet') ? 'devnet' : 'mainnet';
  
  return SEI_WS_ENDPOINTS[networkType as keyof typeof SEI_WS_ENDPOINTS].evm;
}

// Legacy compatibility - will be deprecated
export const isEVMChain = isEVMMode;
export const isSEIChain = isSEINetwork;
export const getChainIdFromNetwork = getChainId;
export const getExplorerUrlFromNetwork = getExplorerUrl;
export const getNativeCurrencyFromNetwork = getNativeCurrency;
export const getRpcUrlFromNetwork = getRpcUrl;
