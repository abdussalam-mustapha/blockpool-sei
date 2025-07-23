import { useState, useRef, useCallback } from 'react';
import { seiMcpClient } from '@/services/seiMcpClient';
import { useGemini } from './useGemini';
import type { GeminiResponse } from '@/services/geminiService';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  confidence?: number;
  source?: string;
  toolCalls?: ToolCall[];
  metadata?: {
    responseTime?: number;
    tokenCount?: number;
    model?: string;
    sources?: string[];
  };
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
  result?: any;
  status: 'pending' | 'completed' | 'error';
  timestamp: Date;
}

export interface UseCustomChatOptions {
  onResponse?: (response: string) => void;
  onFinish?: (message: Message) => void;
  onError?: (error: Error) => void;
  onToolCall?: (toolCall: ToolCall) => void;
  apiEndpoint?: string;
  useGeminiAI?: boolean;
}

export interface UseCustomChatReturn {
  messages: Message[];
  input: string;
  isLoading: boolean;
  error: Error | null;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  stop: () => void;
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  setInput: (input: string) => void;
  reload: () => Promise<void>;
  addToolResult: (toolCallId: string, result: any) => void;
  append: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  clear: () => void;
}

export function useCustomChat({
  onResponse,
  onFinish,
  onError,
  onToolCall,
  useGeminiAI = false
}: UseCustomChatOptions = {}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentMessageRef = useRef<Message | null>(null);
  
  // Initialize Gemini AI if enabled
  const gemini = useGemini({
    enabled: useGeminiAI,
    autoInitialize: useGeminiAI,
    onResponse: (geminiResponse: GeminiResponse) => {
      console.log('🤖 Gemini response received:', geminiResponse.confidence);
    },
    onError: (geminiError: Error) => {
      console.error('❌ Gemini error:', geminiError);
    }
  });

  const generateId = () => Math.random().toString(36).substring(2, 15);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }, []);

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  }, []);

  const addToolResult = useCallback((toolCallId: string, result: any) => {
    setMessages(prev => prev.map(message => {
      if (message.role === 'assistant' && message.toolCalls) {
        const updatedToolCalls = message.toolCalls.map(toolCall => 
          toolCall.id === toolCallId 
            ? { ...toolCall, result, status: 'completed' as const }
            : toolCall
        );
        return { ...message, toolCalls: updatedToolCalls };
      }
      return message;
    }));
  }, []);

  const append = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: generateId(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  const clear = useCallback(() => {
    setMessages([]);
    setInput('');
    setError(null);
  }, []);

  const parseStreamChunk = (chunk: string): { type: string; content?: string; toolCall?: ToolCall } | null => {
    try {
      // Parse AI SDK format: "0:{"type":"text-delta","textDelta":"word"}"
      const colonIndex = chunk.indexOf(':');
      if (colonIndex === -1) return null;
      
      const jsonPart = chunk.substring(colonIndex + 1);
      const parsed = JSON.parse(jsonPart);
      
      if (parsed.type === 'text-delta' && parsed.textDelta) {
        return { type: 'text', content: parsed.textDelta };
      } else if (parsed.type === 'tool-call') {
        return { 
          type: 'tool-call', 
          toolCall: {
            id: parsed.toolCallId || generateId(),
            name: parsed.toolName,
            arguments: parsed.args || {},
            status: 'pending' as const,
            timestamp: new Date()
          }
        };
      } else if (parsed.type === 'tool-result') {
        return {
          type: 'tool-result',
          toolCall: {
            id: parsed.toolCallId,
            name: parsed.toolName,
            arguments: {},
            result: parsed.result,
            status: 'completed' as const,
            timestamp: new Date()
          }
        };
      } else if (parsed.type === 'finish') {
        return { type: 'finish' };
      }
    } catch (e) {
      // If not AI SDK format, treat as plain text
      return { type: 'text', content: chunk };
    }
    
    return null;
  };

  const analyzeQueryIntent = (message: string): { tool: string; confidence: number; extractedData: any } => {
    const lowerMessage = message.toLowerCase();
    
    // Advanced pattern matching with confidence scoring
    const patterns = [
      {
        pattern: /(?:analyze|check|show|get).*wallet.*(?:sei1[a-z0-9]{38,58})/i,
        tool: 'walletAnalysis',
        confidence: 0.95,
        extractor: (msg: string) => ({ address: msg.match(/sei1[a-z0-9]{38,58}/i)?.[0] })
      },
      {
        pattern: /(?:transfer|send).*(?:\d+(?:\.\d+)?).*(?:sei|token)/i,
        tool: 'seiTransferTool',
        confidence: 0.9,
        extractor: (msg: string) => ({ 
          amount: msg.match(/\d+(?:\.\d+)?/)?.[0],
          token: msg.match(/\b(?:sei|usei)\b/i)?.[0] || 'SEI'
        })
      },
      {
        pattern: /(?:nft|collection|mint|token).*(?:activity|history|trending)/i,
        tool: 'nftHistoryTracker',
        confidence: 0.85,
        extractor: () => ({})
      },
      {
        pattern: /(?:transaction|tx).*(?:[0-9a-fA-F]{64}|0x[0-9a-fA-F]+)/i,
        tool: 'transactionExplainer',
        confidence: 0.9,
        extractor: (msg: string) => ({ 
          hash: msg.match(/(?:[0-9a-fA-F]{64}|0x[0-9a-fA-F]+)/)?.[0] 
        })
      },
      {
        pattern: /(?:price|market|volume|cap|trending|stats)/i,
        tool: 'marketAnalysis',
        confidence: 0.8,
        extractor: () => ({})
      },
      {
        pattern: /(?:risk|safe|security|audit).*(?:sei1[a-z0-9]{38,58})/i,
        tool: 'riskAnalysis',
        confidence: 0.85,
        extractor: (msg: string) => ({ address: msg.match(/sei1[a-z0-9]{38,58}/i)?.[0] })
      }
    ];
    
    // Find best matching pattern
    for (const { pattern, tool, confidence, extractor } of patterns) {
      if (pattern.test(message)) {
        return {
          tool,
          confidence,
          extractedData: extractor(message)
        };
      }
    }
    
    // Fallback with lower confidence
    return {
      tool: 'seiBlockchainAnalyzer',
      confidence: 0.6,
      extractedData: {}
    };
  };

  // Helper functions for intelligent response generation
  const extractWalletAddress = (text: string): string | null => {
    const match = text.match(/sei1[a-z0-9]{38,58}/i);
    return match ? match[0] : null;
  };

  const generateWalletAnalysisResponse = (walletData: any, originalQuery: string): string => {
    const formatBalance = (balance: string) => {
      const num = parseFloat(balance.replace(/[^0-9.-]/g, ''));
      return num > 1000 ? `${(num / 1000).toFixed(2)}K` : num.toFixed(4);
    };

    const riskLevel = walletData.riskScore > 0.7 ? '🔴 High' : walletData.riskScore > 0.4 ? '🟡 Medium' : '🟢 Low';
    
    return `## 🔍 Wallet Analysis Results

**Address**: \`${walletData.address}\`
**Balance**: ${formatBalance(walletData.balance)} SEI
**Transactions**: ${walletData.transactionCount || 0}
**Last Activity**: ${new Date(walletData.lastActivity).toLocaleDateString()}
**Risk Level**: ${riskLevel} (${Math.round(walletData.riskScore * 100)}/100)

### 📊 Recent Activity
${walletData.recentTransactions?.slice(0, 3).map((tx: any) => 
  `• **${tx.type?.toUpperCase() || 'UNKNOWN'}**: ${tx.amount || 'N/A'} ${tx.token || 'SEI'} - ${tx.status || 'Unknown'}`
).join('\n') || 'No recent transactions found'}

### 💼 Token Holdings
${walletData.tokens?.slice(0, 5).map((token: any) => 
  `• ${token.symbol}: ${token.balance} (${token.value || 'N/A'})`
).join('\n') || 'No token data available'}

---
*Analysis based on live SEI blockchain data*`;
  };

  const generateRiskAnalysisResponse = (riskData: any, originalQuery: string): string => {
    const riskEmoji = riskData.riskLevel === 'High' ? '🚨' : riskData.riskLevel === 'Medium' ? '⚠️' : '✅';
    
    return `## 🛡️ Security Risk Analysis

**Wallet**: \`${riskData.address}\`
**Risk Score**: ${riskEmoji} ${riskData.riskScore}/100 (${riskData.riskLevel})

### 📈 Risk Factors
${riskData.factors?.map((factor: any) => 
  `• **${factor.factor}**: ${factor.score}/100\n  ${factor.description}`
).join('\n\n') || 'No risk factors analyzed'}

### 💡 Recommendations
${riskData.recommendations?.map((rec: string) => `• ${rec}`).join('\n') || 'No specific recommendations'}

---
*Risk analysis based on ${riskData.source || 'blockchain data'}*`;
  };

  const generateMarketAnalysisResponse = (marketData: any, originalQuery: string): string => {
    const priceChange = marketData.seiChange24h > 0 ? '📈' : '📉';
    
    return `## 📊 SEI Market Analysis

### 💰 Current Price Data
**SEI Price**: $${marketData.seiPrice?.toFixed(4) || 'N/A'} ${priceChange} ${marketData.seiChange24h?.toFixed(2) || '0'}%
**Market Cap**: ${marketData.marketCap || 'N/A'}
**24h Volume**: ${marketData.volume24h || 'N/A'}
**TVL**: ${marketData.tvl || 'N/A'}

### 🔥 Network Activity
**Active Wallets**: ${marketData.activeWallets?.toLocaleString() || 'N/A'}
**24h Transactions**: ${marketData.transactions24h?.toLocaleString() || 'N/A'}
**Average Gas**: ${marketData.avgGas || 'N/A'}

### 🎯 Top Tokens
${marketData.tokens?.slice(0, 5).map((token: any) => 
  `• **${token.symbol}**: $${token.price?.toFixed(4) || 'N/A'} (${token.change24h > 0 ? '+' : ''}${token.change24h?.toFixed(2) || '0'}%)`
).join('\n') || 'Token data loading...'}

---
*Live market data from SEI ecosystem*`;
  };

  const generateNFTAnalysisResponse = (nftData: any[], originalQuery: string): string => {
    if (!nftData || nftData.length === 0) {
      return `## 🎨 NFT Activity Analysis\n\n❌ **No NFT activity found**\n\nThe SEI network may have limited NFT activity at the moment, or the MCP server is unable to fetch current data.\n\n### Try:\n• Check back later for updated activity\n• Verify MCP server connection\n• Ask about specific NFT collections`;
    }

    return `## 🎨 SEI NFT Activity

### 🔥 Recent Activity (${nftData.length} events)
${nftData.slice(0, 8).map((activity: any) => {
  const typeEmoji = activity.type === 'mint' ? '🎯' : activity.type === 'sale' ? '💰' : activity.type === 'transfer' ? '🔄' : '📝';
  return `${typeEmoji} **${activity.type?.toUpperCase()}** - ${activity.collection}\n   Token #${activity.tokenId} • ${activity.price} • [View](https://seitrace.com/tx/${activity.txHash})`;
}).join('\n\n')}

### 📈 Activity Summary
• **Mints**: ${nftData.filter(a => a.type === 'mint').length}
• **Sales**: ${nftData.filter(a => a.type === 'sale').length}
• **Transfers**: ${nftData.filter(a => a.type === 'transfer').length}

---
*Live NFT data from SEI blockchain*`;
  };

  const generateTransactionAnalysis = async (txHash: string, originalQuery: string): Promise<string> => {
    try {
      const txData = await seiMcpClient.getTransaction(txHash);
      if (txData) {
        return `## 🔍 Transaction Analysis\n\n**Hash**: \`${txHash}\`\n**Status**: ${txData.status || 'Unknown'}\n**Block**: ${txData.blockNumber || 'N/A'}\n**Gas Used**: ${txData.gasUsed || 'N/A'}\n**Fee**: ${txData.fee || 'N/A'}\n\n[View on Explorer](https://seitrace.com/tx/${txHash})`;
      }
    } catch (error) {
      console.warn('Transaction analysis error:', error);
    }
    
    return `## 🔍 Transaction Analysis\n\n**Hash**: \`${txHash}\`\n\n❌ **Unable to fetch transaction details**\n\n### Possible reasons:\n• Transaction may not exist\n• Network connectivity issues\n• MCP server temporarily unavailable\n\n[View on SEI Explorer](https://seitrace.com/tx/${txHash})`;
  };

  const generateIntelligentResponse = async (query: string, analysis: any): Promise<string> => {
    const lowerQuery = query.toLowerCase();
    
    // Context-aware responses based on query patterns
    if (lowerQuery.includes('price') || lowerQuery.includes('market')) {
      const marketData = await seiMcpClient.getMarketData();
      return generateMarketAnalysisResponse(marketData, query);
    }
    
    if (lowerQuery.includes('help') || lowerQuery.includes('how')) {
      return `## 🤖 SEI Blockchain Assistant\n\n### What I can help you with:\n\n🔍 **Wallet Analysis**\n\`Analyze wallet sei1abc123...\`\n\n📊 **Market Data**\n\`Show SEI price\` or \`Market overview\`\n\n🎨 **NFT Activity**\n\`Show NFT activity\` or \`What's trending in NFTs?\`\n\n🛡️ **Risk Assessment**\n\`Is sei1xyz... safe?\` or \`Risk analysis for sei1...\`\n\n💸 **Transaction Analysis**\n\`Explain transaction 0x123...\`\n\n### 💡 Pro Tips:\n• Use specific wallet addresses for detailed analysis\n• Ask about current market conditions\n• Request NFT collection insights\n• Get security assessments for any wallet\n\n*I'm connected to live SEI blockchain data for accurate, real-time information!*`;
    }
    
    // General blockchain query
    return `## 🌐 SEI Blockchain Query\n\n**Your question**: "${query}"\n\n### 🔍 Analysis Results\n\nI understand you're asking about SEI blockchain. Based on your query, I can provide:\n\n• **Live blockchain data** from SEI network\n• **Wallet analysis** for any SEI address\n• **Market insights** and price information\n• **NFT activity** and collection data\n• **Transaction details** and explanations\n\n### 💡 For better results, try:\n• \`Analyze wallet [address]\` for wallet insights\n• \`Show market data\` for current prices\n• \`NFT activity\` for collection updates\n• \`Help\` for more command examples\n\n*Connected to live SEI MCP server for real-time data*`;
  };

  const simulateStreamingResponse = async (content: string, onChunk: (chunk: string) => void) => {
    const words = content.split(' ');
    for (let i = 0; i < words.length; i++) {
      if (abortControllerRef.current?.signal.aborted) break;
      
      const chunk = (i === 0 ? '' : ' ') + words[i];
      onChunk(chunk);
      
      // Add delay to simulate streaming
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    // Create assistant message placeholder
    const assistantMessage: Message = {
      id: generateId(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      toolCalls: []
    };

    setMessages(prev => [...prev, assistantMessage]);
    currentMessageRef.current = assistantMessage;

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();
    const startTime = Date.now();

    try {
      let response: string;
      let toolName: string | null = null;
      let confidence = 0.8;
      let sources: string[] = [];

      // Check if Gemini AI is enabled and available
      if (useGeminiAI && gemini.isInitialized && gemini.geminiService) {
        console.log('🤖 Using Gemini AI for enhanced response generation...');
        
        try {
          const geminiResponse = await gemini.generateResponse(userMessage.content, {
            mcpServerConnected: seiMcpClient.getConnectionStatus().connected,
            timestamp: new Date().toISOString()
          });
          
          response = geminiResponse.content;
          confidence = geminiResponse.confidence;
          sources = geminiResponse.sources;
          
          // Add Gemini metadata to message
          const responseTime = Date.now() - startTime;
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessage.id 
              ? { 
                  ...msg, 
                  confidence: geminiResponse.confidence,
                  source: 'Gemini AI + MCP Server',
                  metadata: {
                    ...geminiResponse.metadata,
                    responseTime,
                    model: 'gemini-enhanced',
                    sources: geminiResponse.sources
                  }
                }
              : msg
          ));
          
          console.log('✅ Gemini AI response generated successfully');
          
        } catch (geminiError) {
          console.warn('⚠️ Gemini AI failed, falling back to enhanced local processing:', geminiError);
          // Fall back to enhanced local processing
          const queryAnalysis = analyzeQueryIntent(userMessage.content);
          toolName = queryAnalysis.tool;
          confidence = queryAnalysis.confidence;
        }
      } else {
        // Use enhanced local processing with intelligent analysis
        console.log('🧠 Using enhanced local processing...');
        const queryAnalysis = analyzeQueryIntent(userMessage.content);
        toolName = queryAnalysis.tool;
        confidence = queryAnalysis.confidence;
      }
      
      // Create tool call
      const toolCall: ToolCall = {
        id: generateId(),
        name: toolName,
        arguments: { query: userMessage.content },
        status: 'pending',
        timestamp: new Date()
      };

      // Add tool call to message
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessage.id 
          ? { ...msg, toolCalls: [toolCall] }
          : msg
      ));

      onToolCall?.(toolCall);

      // Execute intelligent tool with MCP client (only if not using Gemini)
      if (!useGeminiAI || !gemini.isInitialized || !response) {
        try {
          const queryAnalysis = analyzeQueryIntent(userMessage.content);
          const extractedData = queryAnalysis.extractedData;
          
          if (toolName === 'walletAnalysis') {
            const address = extractedData.address || extractWalletAddress(userMessage.content);
            if (address) {
              const walletData = await seiMcpClient.analyzeWallet(address);
              if (walletData) {
                response = generateWalletAnalysisResponse(walletData, userMessage.content);
                confidence = 0.95;
                sources = ['SEI MCP Server', 'Live Blockchain Data'];
              } else {
                response = `## 🔍 Wallet Analysis\n\n❌ **Unable to analyze wallet**: ${address}\n\n### Possible Issues:\n- Wallet address may be invalid\n- Network connectivity issues\n- MCP server temporarily unavailable\n\n### Try:\n- Verify the wallet address format (should start with 'sei1')\n- Check your internet connection\n- Try again in a few moments`;
                confidence = 0.6;
              }
            } else {
              response = `## 🔍 Wallet Analysis\n\n❓ **No wallet address detected** in your query: "${userMessage.content}"\n\n### How to analyze a wallet:\n\`\`\`\nAnalyze wallet sei1abc123...\nCheck balance for sei1xyz789...\nShow wallet sei1def456...\n\`\`\`\n\n💡 **Tip**: SEI wallet addresses start with 'sei1' and are 39-59 characters long.`;
              confidence = 0.4;
            }
          } else if (toolName === 'riskAnalysis') {
            const address = extractedData.address || extractWalletAddress(userMessage.content);
            if (address) {
              const riskData = await seiMcpClient.getRiskAnalysis(address);
              response = generateRiskAnalysisResponse(riskData, userMessage.content);
              confidence = 0.9;
              sources = ['SEI MCP Server', 'Risk Analysis Engine'];
            }
          } else if (toolName === 'marketAnalysis') {
            const marketData = await seiMcpClient.getMarketData();
            response = generateMarketAnalysisResponse(marketData, userMessage.content);
            confidence = 0.85;
            sources = ['SEI MCP Server', 'Market Data APIs'];
          } else if (toolName === 'nftHistoryTracker') {
            const nftData = await seiMcpClient.getNFTActivity(10);
            response = generateNFTAnalysisResponse(nftData, userMessage.content);
            confidence = 0.8;
            sources = ['SEI MCP Server', 'NFT Blockchain Data'];
          } else if (toolName === 'transactionExplainer') {
            const txHash = extractedData.hash;
            if (txHash) {
              response = await generateTransactionAnalysis(txHash, userMessage.content);
              confidence = 0.9;
              sources = ['SEI MCP Server', 'Transaction Data'];
            }
          } else {
            // Intelligent general blockchain analysis
            response = await generateIntelligentResponse(userMessage.content, queryAnalysis);
            confidence = Math.max(0.7, queryAnalysis.confidence);
            sources = ['SEI MCP Server', 'Blockchain Analysis'];
          }
        } catch (mcpError) {
          console.warn('MCP client error, using fallback:', mcpError);
          response = `## SEI Blockchain Query\n\nI received your query: "${userMessage.content}"\n\n⚠️ **MCP Connection Issue**: Unable to fetch live blockchain data at the moment.\n\n### Fallback Information\n- Query type detected: ${toolName}\n- Recommended action: Check MCP server connection\n- Alternative: Try again in a few moments\n\nI can still help with general blockchain questions and guidance. Please let me know how else I can assist you!`;
          confidence = 0.6;
        }
      }

      // Update tool call status
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessage.id && msg.toolCalls
          ? { 
              ...msg, 
              toolCalls: msg.toolCalls.map(tc => 
                tc.id === toolCall.id 
                  ? { ...tc, status: 'completed', result: response }
                  : tc
              )
            }
          : msg
      ));

      // Simulate streaming response
      await simulateStreamingResponse(response, (chunk) => {
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessage.id 
            ? { ...msg, content: msg.content + chunk }
            : msg
        ));
        onResponse?.(chunk);
      });

      // Finalize message with metadata
      const responseTime = Date.now() - startTime;
      const finalMessage: Message = {
        ...assistantMessage,
        content: response,
        metadata: {
          responseTime,
          tokenCount: response.split(' ').length,
          model: 'sei-mcp',
          sources
        },
        confidence
      };

      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessage.id ? finalMessage : msg
      ));

      onFinish?.(finalMessage);

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(new Error(errorMessage));
      
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessage.id 
          ? { 
              ...msg, 
              content: `❌ Error: ${errorMessage}. Please try again.`,
              metadata: { responseTime: Date.now() - startTime }
            }
          : msg
      ));

      onError?.(new Error(errorMessage));
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
      currentMessageRef.current = null;
    }
  }, [input, isLoading, messages, onResponse, onFinish, onError, onToolCall, addToolResult]);

  const reload = useCallback(async () => {
    if (messages.length === 0) return;
    
    // Find the last user message
    const lastUserMessage = [...messages].reverse().find(msg => msg.role === 'user');
    if (!lastUserMessage) return;

    // Remove messages after the last user message
    const lastUserIndex = messages.findIndex(msg => msg.id === lastUserMessage.id);
    setMessages(prev => prev.slice(0, lastUserIndex + 1));
    
    // Resend the last user message
    setInput(lastUserMessage.content);
    
    // Trigger submit after a brief delay to allow state to update
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) {
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      }
    }, 100);
  }, [messages]);

  return {
    messages,
    input,
    isLoading,
    error,
    handleInputChange,
    handleSubmit,
    stop,
    setMessages,
    setInput,
    reload,
    addToolResult,
    append,
    clear
  };
}
