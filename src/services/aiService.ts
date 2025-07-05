import { seiMcpClient, type WalletAnalysis } from './seiMcpClient';

interface AIResponse {
  content: string;
  confidence: number;
  sources?: string[];
}

export const generateAIResponse = async (query: string): Promise<AIResponse> => {
  const lowerQuery = query.toLowerCase();
  
  try {
    // Check if MCP client is connected
    const connectionStatus = seiMcpClient.getConnectionStatus();
    if (!connectionStatus.connected) {
      return {
        content: "⚠️ Currently disconnected from SEI MCP Server. Attempting to reconnect...\n\nPlease try your query again in a moment. I need live blockchain data to provide accurate insights.",
        confidence: 0.1,
        sources: []
      };
    }

    // Address-specific queries
    if (lowerQuery.includes('sei1') || lowerQuery.includes('wallet')) {
      const addressMatch = query.match(/sei1[a-z0-9]{38,58}/);
      if (addressMatch) {
        const address = addressMatch[0];
        const walletData = await seiMcpClient.analyzeWallet(address);
        
        if (walletData) {
          const riskLevel = walletData.riskScore < 0.3 ? 'Low' : walletData.riskScore < 0.7 ? 'Medium' : 'High';
          const tokenList = walletData.tokens.slice(0, 5).map(t => `${t.amount} ${t.denom}`).join(', ');
          
          return {
            content: `🔍 **Wallet Analysis: ${address}**\n\n💰 **Holdings:**\n• Balance: ${walletData.balance}\n• Tokens: ${tokenList}\n\n📊 **Activity:**\n• Total transactions: ${walletData.transactionCount}\n• Last activity: ${walletData.lastActivity}\n• Risk score: ${walletData.riskScore.toFixed(2)} (${riskLevel})\n\n🔄 **Recent Activity:**\n${walletData.recentTransactions.slice(0, 3).map(tx => `• ${tx.description} (${tx.timestamp})`).join('\n')}\n\n✅ **Live data from SEI MCP Server**`,
            confidence: 0.95,
            sources: [`https://seistream.app/address/${address}`]
          };
        } else {
          return {
            content: `❌ Unable to fetch data for wallet ${address}. The address might be invalid or the MCP server is experiencing issues.\n\nPlease verify the address and try again.`,
            confidence: 0.3
          };
        }
      } else {
        return {
          content: `To analyze a specific wallet, please provide a valid SEI address (starts with "sei1").\n\n🔍 **I can analyze:**\n• Transaction history\n• Token holdings\n• Risk assessment\n• Trading patterns\n• Recent activity\n\n**Example:** "Analyze wallet sei1abc123..."`,
          confidence: 0.7
        };
      }
    }

    // Token-specific queries
    if (lowerQuery.includes('token') || lowerQuery.includes('price') || lowerQuery.includes('trending')) {
      const marketData = await seiMcpClient.getMarketData();
      
      if (marketData) {
        const topTokens = marketData.tokens?.slice(0, 5) || [];
        const tokenList = topTokens.map((token: any) => 
          `• ${token.symbol}: $${token.price} (${token.change24h > 0 ? '+' : ''}${token.change24h.toFixed(2)}%)`
        ).join('\n');

        return {
          content: `📊 **Live SEI Token Market Data**\n\n🔥 **Top Performing Tokens:**\n${tokenList}\n\n📈 **Market Overview:**\n• Total market cap: ${marketData.totalMarketCap || 'N/A'}\n• 24h volume: ${marketData.totalVolume24h || 'N/A'}\n• Active pairs: ${marketData.activePairs || 'N/A'}\n\n⚡ **Real-time data from SEI MCP Server**`,
          confidence: 0.92,
          sources: ['https://app.dragonswap.app', 'https://seistream.app/tokens']
        };
      }
    }

    // NFT queries
    if (lowerQuery.includes('nft') || lowerQuery.includes('collection')) {
      const nftActivity = await seiMcpClient.getNFTActivity();
      
      if (nftActivity && nftActivity.length > 0) {
        const recentActivity = nftActivity.slice(0, 5).map((activity: any) => 
          `• ${activity.collection}: ${activity.type} - ${activity.price || 'N/A'} SEI`
        ).join('\n');

        return {
          content: `🎨 **Live SEI NFT Activity**\n\n🔄 **Recent Activity:**\n${recentActivity}\n\n📊 **Market Stats:**\n• Total volume (24h): ${nftActivity.reduce((sum: number, a: any) => sum + (parseFloat(a.price) || 0), 0).toFixed(2)} SEI\n• Active collections: ${new Set(nftActivity.map((a: any) => a.collection)).size}\n\n⚡ **Real-time data from SEI MCP Server**`,
          confidence: 0.88,
          sources: ['https://palette.sei.io']
        };
      }
    }

    // Risk analysis queries
    if (lowerQuery.includes('risk') || lowerQuery.includes('safe') || lowerQuery.includes('scam')) {
      const addressMatch = query.match(/sei1[a-z0-9]{38,58}/);
      if (addressMatch) {
        const riskData = await seiMcpClient.getRiskAnalysis(addressMatch[0]);
        
        if (riskData) {
          const riskLevel = riskData.score < 0.3 ? '🟢 Low Risk' : riskData.score < 0.7 ? '🟡 Medium Risk' : '🔴 High Risk';
          
          return {
            content: `🛡️ **Risk Analysis: ${addressMatch[0]}**\n\n⚠️ **Risk Level:** ${riskLevel} (${riskData.score.toFixed(2)})\n\n🔍 **Analysis:**\n${riskData.factors?.map((f: string) => `• ${f}`).join('\n') || 'No specific risk factors identified'}\n\n📋 **Recommendations:**\n${riskData.recommendations?.map((r: string) => `• ${r}`).join('\n') || 'Standard security practices apply'}\n\n⚡ **Live analysis from SEI MCP Server**`,
            confidence: 0.90,
            sources: ['https://seistream.app/security']
          };
        }
      }
    }

    // General market queries
    if (lowerQuery.includes('market') || lowerQuery.includes('overview') || lowerQuery.includes('stats')) {
      const marketData = await seiMcpClient.getMarketData();
      
      if (marketData) {
        return {
          content: `📊 **Live SEI Chain Overview**\n\n💰 **Network Stats:**\n• SEI Price: $${marketData.seiPrice || '0.00'} (${marketData.seiChange24h > 0 ? '+' : ''}${marketData.seiChange24h?.toFixed(2) || '0.00'}%)\n• Market Cap: ${marketData.marketCap || 'N/A'}\n• 24h Volume: ${marketData.volume24h || 'N/A'}\n• TVL: ${marketData.tvl || 'N/A'}\n\n🔄 **Network Activity:**\n• Active wallets: ${marketData.activeWallets || 'N/A'}\n• Transactions (24h): ${marketData.transactions24h || 'N/A'}\n• Average gas: ${marketData.avgGas || 'N/A'} SEI\n\n⚡ **Real-time data from SEI MCP Server**`,
          confidence: 0.95,
          sources: ['https://seistream.app', 'https://defillama.com/chain/Sei']
        };
      }
    }

    // Default response with live connection status
    return {
      content: `🤖 **Blockpool AI Assistant** - Connected to SEI MCP Server ✅\n\nI can help you with real-time SEI blockchain analysis:\n\n🔍 **Wallet Analysis**\n"Analyze wallet sei1abc123..." - Live wallet insights\n\n📊 **Market Data**\n"Show market overview" - Real-time prices & stats\n\n🎨 **NFT Activity**\n"What's happening with NFTs?" - Live collection data\n\n⚠️ **Risk Assessment**\n"Is sei1xyz... safe?" - Security analysis\n\n💡 **Try asking:**\n• "What's the current SEI price?"\n• "Show me recent whale activity"\n• "Which tokens are trending?"\n• "Analyze wallet sei1..."\n\n⚡ All data is live from the SEI blockchain via MCP Server!`,
      confidence: 0.85
    };

  } catch (error) {
    console.error('Error in AI service:', error);
    
    return {
      content: `❌ **Error connecting to SEI MCP Server**\n\nI'm having trouble accessing live blockchain data right now. This could be due to:\n\n• MCP Server connection issues\n• Network connectivity problems\n• Temporary service outage\n\nPlease try again in a moment. In the meantime, you can:\n• Check your internet connection\n• Refresh the page\n• Contact support if the issue persists`,
      confidence: 0.1,
      sources: []
    };
  }
};