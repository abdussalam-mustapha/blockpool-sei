import { GoogleGenerativeAI, GenerativeModel, ChatSession, SchemaType } from '@google/generative-ai';
import { seiMcpClient } from './seiMcpClient';

export interface GeminiConfig {
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface GeminiResponse {
  content: string;
  confidence: number;
  sources: string[];
  toolCalls?: any[];
  metadata: {
    model: string;
    responseTime: number;
    tokenCount?: number;
  };
}

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private chatSession: ChatSession | null = null;
  private config: GeminiConfig;

  constructor(config: GeminiConfig) {
    console.log('🚀 [GEMINI] Initializing Gemini service with config:', {
      model: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      hasApiKey: !!config.apiKey
    });
    
    this.config = config;
    this.genAI = new GoogleGenerativeAI(config.apiKey);
    
    // Initialize the model with function calling capabilities
    console.log('🔧 [GEMINI] Setting up model with function calling capabilities...');
    this.model = this.genAI.getGenerativeModel({
      model: config.model,
      generationConfig: {
        temperature: config.temperature || 0.7,
        maxOutputTokens: config.maxTokens || 8192,
      },
      tools: [
        {
          functionDeclarations: [
            {
              name: "analyze_wallet",
              description: "Analyze a SEI wallet address for comprehensive insights including balance, transactions, and risk assessment",
              parameters: {
                type: SchemaType.OBJECT,
                properties: {
                  address: {
                    type: SchemaType.STRING,
                    description: "SEI wallet address (starts with 'sei1')"
                  }
                },
                required: ["address"]
              }
            },
            {
              name: "get_market_data",
              description: "Get real-time SEI market data including price, volume, and network statistics",
              parameters: {
                type: SchemaType.OBJECT,
                properties: {
                  includeTokens: {
                    type: SchemaType.BOOLEAN,
                    description: "Whether to include top token data"
                  }
                },
                required: []
              }
            },
            {
              name: "get_nft_activity",
              description: "Get recent NFT activity on the SEI network including mints, sales, and transfers",
              parameters: {
                type: SchemaType.OBJECT,
                properties: {
                  limit: {
                    type: SchemaType.NUMBER,
                    description: "Number of NFT activities to retrieve (default: 10)"
                  }
                },
                required: []
              }
            },
            {
              name: "get_risk_analysis",
              description: "Perform security risk analysis on a SEI wallet address",
              parameters: {
                type: SchemaType.OBJECT,
                properties: {
                  address: {
                    type: SchemaType.STRING,
                    description: "SEI wallet address to analyze for security risks"
                  }
                },
                required: ["address"]
              }
            },
            {
              name: "get_transaction_details",
              description: "Get detailed information about a specific transaction",
              parameters: {
                type: SchemaType.OBJECT,
                properties: {
                  hash: {
                    type: SchemaType.STRING,
                    description: "Transaction hash to analyze"
                  }
                },
                required: ["hash"]
              }
            }
          ]
        }
      ]
    });
  }

  async generateResponse(query: string, context?: any): Promise<GeminiResponse> {
    const startTime = Date.now();
    
    console.log('🤖 [GEMINI] Starting response generation for query:', {
      queryLength: query.length,
      queryPreview: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      hasContext: !!context,
      context: context ? Object.keys(context) : null
    });
    
    try {
      // Create system prompt with SEI blockchain context
      console.log('📝 [GEMINI] Creating system prompt with SEI blockchain context...');
      const systemPrompt = `You are an expert SEI blockchain assistant with access to real-time blockchain data through specialized tools. 

Key capabilities:
- Analyze SEI wallets for balance, transactions, and risk assessment
- Provide real-time market data and price information
- Track NFT activity and collection insights
- Perform security risk analysis
- Explain transaction details

Guidelines:
- Always use the provided tools to fetch real-time data
- Provide accurate, helpful responses about SEI blockchain
- Format responses with clear structure and relevant emojis
- Include confidence levels and data sources
- Suggest actionable next steps when appropriate
- If a wallet address is mentioned, always validate it starts with 'sei1'

Current context: ${context ? JSON.stringify(context) : 'No additional context'}`;

      // Start chat session if not exists
      if (!this.chatSession) {
        console.log('💬 [GEMINI] Creating new chat session with system prompt...');
        this.chatSession = this.model.startChat({
          history: [
            {
              role: "user",
              parts: [{ text: systemPrompt }]
            },
            {
              role: "model", 
              parts: [{ text: "I understand. I'm ready to help with SEI blockchain analysis using real-time data from the available tools. How can I assist you today?" }]
            }
          ]
        });
        console.log('✅ [GEMINI] Chat session created successfully');
      } else {
        console.log('🔄 [GEMINI] Using existing chat session');
      }

      // Send the user query
      console.log('📤 [GEMINI] Sending message to Gemini API...');
      const result = await this.chatSession.sendMessage(query);
      const response = await result.response;
      
      console.log('📥 [GEMINI] Received response from Gemini API:', {
        hasFunctionCalls: !!(response.functionCalls && response.functionCalls.length > 0),
        functionCallCount: response.functionCalls?.length || 0,
        hasText: !!response.text()
      });
      
      let content = '';
      let toolCalls: any[] = [];
      let sources = ['Google Gemini AI'];
      
      // Handle function calls if present (simplified approach)
      if (response.functionCalls && response.functionCalls.length > 0) {
        console.log('🔧 [GEMINI] Processing function calls from Gemini...');
        // For now, we'll handle this in a simplified way
        const firstCall = response.functionCalls[0] as any;
        if (firstCall && firstCall.name) {
          console.log('🚫 [GEMINI] Executing tool:', {
            toolName: firstCall.name,
            arguments: firstCall.args || {}
          });
          
          const toolResult = await this.executeTool(firstCall.name, firstCall.args || {});
          
          console.log('✅ [GEMINI] Tool execution completed:', {
            toolName: firstCall.name,
            success: !toolResult?.error,
            resultType: typeof toolResult
          });
          
          toolCalls.push({
            name: firstCall.name,
            arguments: firstCall.args || {},
            result: toolResult
          });
          sources.push('SEI MCP Server', 'Live Blockchain Data');
          
          // Generate a response based on the tool result
          content = this.formatToolResponse(firstCall.name, toolResult);
          console.log('📝 [GEMINI] Generated formatted response, length:', content.length);
        }
      } else {
        console.log('💬 [GEMINI] No function calls, using direct text response');
        content = response.text() || '';
        console.log('📝 [GEMINI] Direct response length:', content.length);
      }

      const responseTime = Date.now() - startTime;
      const confidence = this.calculateConfidence(content, toolCalls);
      const tokenCount = this.estimateTokenCount(content);
      
      console.log('🎉 [GEMINI] Response generation completed successfully:', {
        responseTime: responseTime + 'ms',
        confidence: Math.round(confidence * 100) + '%',
        tokenCount,
        contentLength: content.length,
        toolCallsCount: toolCalls.length,
        sources: sources.length
      });
      
      return {
        content,
        confidence,
        sources,
        toolCalls,
        metadata: {
          model: this.config.model,
          responseTime,
          tokenCount
        }
      };
      
    } catch (error) {
      console.error('❌ [GEMINI] API error occurred:', {
        error: error instanceof Error ? error.message : String(error),
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        queryPreview: query.substring(0, 50) + '...',
        responseTime: Date.now() - startTime + 'ms'
      });
      
      // Fallback to enhanced local processing
      console.log('🔄 [GEMINI] Falling back to local processing...');
      return this.generateFallbackResponse(query, context);
    }
  }

  private async executeTool(toolName: string, args: any): Promise<any> {
    try {
      switch (toolName) {
        case 'analyze_wallet':
          return await seiMcpClient.analyzeWallet(args.address);
          
        case 'get_market_data':
          return await seiMcpClient.getMarketData();
          
        case 'get_nft_activity':
          return await seiMcpClient.getNFTActivity(args.limit || 10);
          
        case 'get_risk_analysis':
          return await seiMcpClient.getRiskAnalysis(args.address);
          
        case 'get_transaction_details':
          return await seiMcpClient.getTransaction(args.hash);
          
        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    } catch (error) {
      console.error(`Tool execution error for ${toolName}:`, error);
      return { error: `Unable to execute ${toolName}`, details: error.message };
    }
  }

  private calculateConfidence(content: string, toolCalls: any[]): number {
    let confidence = 0.7; // Base confidence for Gemini responses
    
    // Increase confidence if tools were used successfully
    if (toolCalls && toolCalls.length > 0) {
      const successfulCalls = toolCalls.filter(call => !call.result?.error);
      confidence += (successfulCalls.length / toolCalls.length) * 0.25;
    }
    
    // Increase confidence for longer, more detailed responses
    if (content.length > 500) confidence += 0.05;
    if (content.includes('##') || content.includes('**')) confidence += 0.05; // Structured response
    
    return Math.min(0.98, confidence);
  }

  private estimateTokenCount(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  private formatToolResponse(toolName: string, toolResult: any): string {
    // Format tool responses for better presentation
    switch (toolName) {
      case 'analyze_wallet':
        if (toolResult && !toolResult.error) {
          return `## 🔍 Wallet Analysis Results\n\n**Address**: \`${toolResult.address}\`\n**Balance**: ${toolResult.balance}\n**Transactions**: ${toolResult.transactionCount || 0}\n**Risk Score**: ${Math.round((toolResult.riskScore || 0) * 100)}/100\n\n*Analysis powered by Google Gemini AI + SEI MCP Server*`;
        }
        break;
      case 'get_market_data':
        if (toolResult && !toolResult.error) {
          return `## 📊 SEI Market Data\n\n**Price**: $${toolResult.seiPrice?.toFixed(4) || 'N/A'}\n**24h Change**: ${toolResult.seiChange24h?.toFixed(2) || '0'}%\n**Market Cap**: ${toolResult.marketCap || 'N/A'}\n\n*Data powered by Google Gemini AI + SEI MCP Server*`;
        }
        break;
      case 'get_nft_activity':
        if (toolResult && Array.isArray(toolResult)) {
          return `## 🎨 NFT Activity\n\n**Recent Events**: ${toolResult.length}\n\n${toolResult.slice(0, 3).map((nft: any) => `• ${nft.type?.toUpperCase()} - ${nft.collection} #${nft.tokenId}`).join('\n')}\n\n*Data powered by Google Gemini AI + SEI MCP Server*`;
        }
        break;
      default:
        return `## 🤖 Analysis Results\n\n${JSON.stringify(toolResult, null, 2)}\n\n*Powered by Google Gemini AI + SEI MCP Server*`;
    }
    
    return `## ⚠️ Analysis Unavailable\n\nUnable to fetch data for ${toolName}. Please try again or check your connection.\n\n*Google Gemini AI + SEI MCP Server*`;
  }

  private async generateFallbackResponse(query: string, context?: any): Promise<GeminiResponse> {
    // Enhanced fallback when Gemini API is unavailable
    const fallbackContent = `## 🤖 SEI Blockchain Assistant (Offline Mode)

I'm currently unable to access the Gemini AI service, but I can still help with SEI blockchain queries using local processing.

**Your query**: "${query}"

### Available Actions:
- 🔍 Wallet analysis for SEI addresses
- 📊 Market data and price information  
- 🎨 NFT activity tracking
- 🛡️ Security risk assessments
- 💸 Transaction explanations

### To get the best results:
- Ensure your internet connection is stable
- Try your query again in a moment
- Use specific SEI wallet addresses or transaction hashes
- Ask for help with command examples

*Fallback mode - some advanced AI features may be limited*`;

    return {
      content: fallbackContent,
      confidence: 0.6,
      sources: ['Local Processing'],
      metadata: {
        model: 'fallback',
        responseTime: 100
      }
    };
  }

  // Utility methods
  clearChatHistory(): void {
    this.chatSession = null;
  }

  updateConfig(newConfig: Partial<GeminiConfig>): void {
    this.config = { ...this.config, ...newConfig };
    // Reinitialize model with new config if needed
    if (newConfig.model || newConfig.temperature || newConfig.maxTokens) {
      this.model = this.genAI.getGenerativeModel({
        model: this.config.model,
        generationConfig: {
          temperature: this.config.temperature || 0.7,
          maxOutputTokens: this.config.maxTokens || 8192,
        }
      });
      this.chatSession = null; // Reset chat session
    }
  }

  getConfig(): GeminiConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const createGeminiService = (config: GeminiConfig): GeminiService => {
  return new GeminiService(config);
};

// Default configuration from environment
export const getDefaultGeminiConfig = (): GeminiConfig => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('VITE_GEMINI_API_KEY is required for Gemini integration');
  }
  
  return {
    apiKey,
    model: import.meta.env.VITE_GEMINI_MODEL || 'gemini-1.5-pro',
    temperature: parseFloat(import.meta.env.VITE_GEMINI_TEMPERATURE || '0.7'),
    maxTokens: parseInt(import.meta.env.VITE_GEMINI_MAX_TOKENS || '8192')
  };
};
