import { seiMcpClient, type WalletAnalysis, type MarketData } from './seiMcpClient';

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

    // Address-specific queries - Support both SEI native and EVM addresses
    if (lowerQuery.includes('sei1') || lowerQuery.includes('0x') || lowerQuery.includes('wallet') || lowerQuery.includes('address')) {
      // Match SEI native addresses (sei1...)
      const seiAddressMatch = query.match(/sei1[a-z0-9]{38,58}/);
      // Match EVM addresses (0x...)
      const evmAddressMatch = query.match(/0x[a-fA-F0-9]{40}/);
      
      const address = seiAddressMatch?.[0] || evmAddressMatch?.[0];
      
      if (address) {
        const isEVMAddress = address.startsWith('0x');
        const networkMode = isEVMAddress ? 'EVM' : 'Native';
        
        console.log(`🤖 AI analyzing ${networkMode} wallet:`, address);
        
        try {
          const walletData = await seiMcpClient.analyzeWallet(address);
          
          if (walletData) {
            const riskLevel = walletData.riskScore < 0.3 ? 'Low' : walletData.riskScore < 0.7 ? 'Medium' : 'High';
            
            // Check if this is live data or mock data based on connection status
            const isLiveData = seiMcpClient.getConnectionStatus().connected;
            const dataSource = isLiveData ? `Live SEI MCP Server (${networkMode})` : `Simulated Data (${networkMode})`;
            const confidence = isLiveData ? 0.9 : 0.6;
            
            // Check if wallet has zero balance
            const balanceValue = parseFloat(walletData.balance.replace(/ (SEI|ETH)/, ''));
            const hasBalance = balanceValue > 0;
            
            // Format explorer URL based on address type
            const explorerUrl = isEVMAddress 
              ? `https://seitrace.com/address/${address}?tab=evm`
              : `https://seitrace.com/address/${address}`;
            
            // Format token holdings with proper display
            const tokenHoldings = walletData.tokens.length > 0 
              ? walletData.tokens.map(token => `• ${token.amount} ${token.denom.toUpperCase()}`).join('\n')
              : '• No token holdings found';
            
            // Format recent transactions
            const recentActivity = walletData.recentTransactions.length > 0
              ? walletData.recentTransactions.slice(0, 3).map(tx => `• ${tx.type}: ${tx.amount} ${tx.token}`).join('\n')
              : '• No recent transactions found';
            
            return {
              content: `📊 **${networkMode} Wallet Analysis for ${address}**\n\n🌐 **Network Mode:** SEI ${networkMode}${isEVMAddress ? ' (EVM Compatible)' : ' (Cosmos SDK)'}\n💰 **Balance:** ${walletData.balance}\n📈 **Transactions:** ${walletData.transactionCount} total\n🛡️ **Risk Score:** ${(walletData.riskScore * 100).toFixed(1)}% (${riskLevel})\n⏰ **Last Activity:** ${walletData.lastActivity}\n\n🔍 **Recent Activity:**\n${recentActivity}\n\n📝 **Token Holdings:**\n${tokenHoldings}${!isLiveData ? '\n\n📝 **Note:** This analysis uses simulated data. Connect to live MCP server for real-time blockchain data.' : ''}\n\n🔗 **View on Explorer:** [SeiTrace](${explorerUrl})`,
              confidence,
              sources: [dataSource, explorerUrl]
            };
          } else {
            // Fallback if somehow no data is returned
            return {
              content: `⚠️ **Unable to analyze ${networkMode} wallet ${address}**\n\nThere was an issue retrieving wallet data. Please try again in a moment.`,
              confidence: 0.1,
              sources: []
            };
          }
        } catch (error) {
          console.error(`❌ AI ${networkMode} wallet analysis error:`, error);
          return {
            content: `❌ **Error analyzing ${networkMode} wallet ${address}**\n\nThere was a technical issue connecting to the SEI blockchain. Please:\n• Verify the address is correct\n• Check your internet connection\n• Try again in a few moments\n\n🔧 **Technical details:** ${error instanceof Error ? error.message : 'Unknown error'}`,
            confidence: 0.1
          };
        }
      } else {
        return {
          content: `To analyze a specific wallet, please provide a valid address:\n\n🔹 **SEI Native:** sei1abc123... (Cosmos SDK format)\n🔹 **SEI EVM:** 0xabc123... (Ethereum format)\n\n🔍 **I can provide real-time analysis of:**\n• Current balance and token holdings\n• Transaction history and patterns\n• Risk assessment and security score\n• Trading activity and volume\n• Recent blockchain activity\n• Cross-chain interactions (EVM ↔ Native)\n\n**Examples:**\n• "Analyze wallet sei1abc123..."\n• "Check EVM address 0xabc123..."\n\n✅ **Supports both SEI Native and EVM modes**`,
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