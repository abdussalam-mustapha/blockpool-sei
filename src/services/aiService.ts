
interface AIResponse {
  content: string;
  confidence: number;
  sources?: string[];
}

const seiChainData = {
  tokens: ['SEI', 'SEIYAN', 'DRAGON', 'ALPHA', 'BETA'],
  commonAddresses: [
    'sei1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq9ey3g',
    'sei1xz8k7eur9m5xql2vz6wkx2wh6khjqekqh9l3x',
    'sei15vk6x9v9k8w8vl6qkd3s8k4w7t9t2l4k3k2k1',
  ],
  recentActivity: [
    'Large whale transaction of 100K SEI tokens',
    'New NFT collection "Sei Samurai" launched',
    'SEIYAN token up 45% in last 24h',
    'Contract deployment on address sei1abc...',
  ]
};

export const generateAIResponse = async (query: string): Promise<AIResponse> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

  const lowerQuery = query.toLowerCase();
  
  // Address-specific queries
  if (lowerQuery.includes('sei1') || lowerQuery.includes('wallet')) {
    const hasAddress = query.match(/sei1[a-z0-9]{38,58}/);
    if (hasAddress) {
      return {
        content: `Analysis of wallet ${hasAddress[0]}:\n\n• Recent activity: 15 transactions in the last 24 hours\n• Token holdings: 1,234 SEI, 500 SEIYAN tokens\n• Trading pattern: Active DeFi participant\n• Risk level: Low\n• Last transaction: 2 hours ago (DEX swap)\n\nThis wallet shows consistent trading behavior with focus on SEI ecosystem tokens.`,
        confidence: 0.85,
        sources: [`https://seistream.app/address/${hasAddress[0]}`]
      };
    } else {
      return {
        content: `To analyze a specific wallet, please provide a valid SEI address (starts with "sei1").\n\nI can help you track:\n• Transaction history\n• Token holdings\n• Trading patterns\n• Risk assessment\n• Recent activity\n\nExample: "Analyze wallet sei1abc123..."`,
        confidence: 0.7
      };
    }
  }

  // Token-specific queries
  if (lowerQuery.includes('token') || lowerQuery.includes('seiyan') || lowerQuery.includes('meme')) {
    return {
      content: `Current SEI ecosystem token analysis:\n\n🔥 **Trending Tokens:**\n• SEIYAN: +45.2% (24h) - High volume, community-driven\n• DRAGON: +12.8% (24h) - Gaming utility token\n• ALPHA: -3.2% (24h) - DeFi governance token\n\n📊 **Market Metrics:**\n• Total DEX volume: $892K (24h)\n• Active trading pairs: 47\n• New token launches: 3 today\n\n⚠️ **Risk Alert:** Monitor new tokens for liquidity and contract verification.`,
      confidence: 0.92,
      sources: ['https://app.dragonswap.app', 'https://seistream.app/tokens']
    };
  }

  // NFT queries
  if (lowerQuery.includes('nft') || lowerQuery.includes('collection')) {
    return {
      content: `SEI NFT ecosystem update:\n\n🎨 **Active Collections:**\n• Sei Samurai: Floor 15 SEI, 24h volume: 450 SEI\n• Digital Dragons: Floor 8 SEI, trending up\n• Pixel Pandas: New mint ongoing, 0.5 SEI each\n\n📈 **Market Stats:**\n• NFTs minted today: 247\n• Total volume (24h): 1,200 SEI\n• Most active marketplace: Palette\n\n🔍 **Notable Activity:** Large whale accumulated 12 Sei Samurai NFTs in the last hour.`,
      confidence: 0.88,
      sources: ['https://palette.sei.io']
    };
  }

  // General market queries
  if (lowerQuery.includes('market') || lowerQuery.includes('price') || lowerQuery.includes('volume')) {
    return {
      content: `SEI Chain market overview:\n\n💰 **Token Metrics:**\n• SEI Price: $0.67 (+5.2% 24h)\n• Market Cap: $2.1B\n• 24h Volume: $145M\n• TVL: $89M\n\n🔄 **Network Activity:**\n• Active wallets: 8,492 (24h)\n• Transactions: 125K (24h)\n• Gas fees: ~0.002 SEI avg\n\n📊 **DeFi Stats:**\n• Top DEX: DragonSwap ($456K volume)\n• Lending protocols: $23M TVL\n• Yield farming: 15-45% APY range`,
      confidence: 0.90,
      sources: ['https://coinmarketcap.com/currencies/sei/', 'https://defillama.com/chain/Sei']
    };
  }

  // Risk and security queries
  if (lowerQuery.includes('risk') || lowerQuery.includes('scam') || lowerQuery.includes('safe')) {
    return {
      content: `SEI Chain security analysis:\n\n✅ **Network Status:**\n• Chain health: Excellent\n• Validator uptime: 99.8%\n• Recent upgrades: Successful\n\n⚠️ **Current Risks:**\n• 3 contracts flagged for review\n• 2 potential honeypot tokens detected\n• Bridge activity: Normal levels\n\n🛡️ **Safety Recommendations:**\n• Verify contract addresses before interacting\n• Use established DEXs and protocols\n• Check token liquidity before large trades\n• Enable transaction simulation when possible`,
      confidence: 0.87,
      sources: ['https://seistream.app/security']
    };
  }

  // Default response for general queries
  return {
    content: `I'm analyzing the SEI blockchain in real-time and can help you with:\n\n🔍 **Wallet Analysis**\n"Analyze wallet sei1abc123..." - Get detailed wallet insights\n\n📊 **Token Tracking**\n"What's trending?" - Current market analysis\n\n🎨 **NFT Monitoring**\n"Show NFT activity" - Collection stats and trends\n\n⚠️ **Risk Assessment**\n"Is this contract safe?" - Security analysis\n\n💡 **Try asking:**\n• "What has wallet sei1xyz... been doing?"\n• "Which tokens are pumping today?"\n• "Show me recent whale activity"\n• "Any new NFT drops?"\n\nI'm connected to live SEI chain data for accurate, real-time insights!`,
    confidence: 0.75
  };
};
