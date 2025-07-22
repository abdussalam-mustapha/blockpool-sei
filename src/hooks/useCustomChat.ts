import { useState, useRef, useCallback } from 'react';
import { seiMcpClient } from '@/services/seiMcpClient';

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
  onToolCall
}: UseCustomChatOptions = {}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentMessageRef = useRef<Message | null>(null);

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

  const selectTool = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    // Transfer and gas estimation queries
    if (lowerMessage.includes('transfer') || lowerMessage.includes('send') || 
        lowerMessage.includes('gas') || lowerMessage.includes('fee') || 
        lowerMessage.includes('cost')) {
      return 'seiTransferTool';
    }
    
    // Wallet analysis queries
    if (lowerMessage.includes('wallet') || lowerMessage.includes('balance') || 
        lowerMessage.includes('sei1') || lowerMessage.includes('address')) {
      return 'walletAnalysis';
    }
    
    // NFT queries
    if (lowerMessage.includes('nft') || lowerMessage.includes('collection') || 
        lowerMessage.includes('token') || lowerMessage.includes('mint')) {
      return 'nftHistoryTracker';
    }
    
    // Transaction queries
    if (lowerMessage.includes('transaction') || lowerMessage.includes('tx') || 
        lowerMessage.includes('hash') || lowerMessage.includes('0x')) {
      return 'transactionExplainer';
    }
    
    // Default to blockchain analyzer for general queries
    return 'seiBlockchainAnalyzer';
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

      // Use MCP client for blockchain data
      toolName = selectTool(userMessage.content);
      
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

      // Simulate tool execution with MCP client
      try {
        if (toolName === 'walletAnalysis') {
          const walletData = await seiMcpClient.analyzeWallet(userMessage.content);
          if (walletData) {
            response = `## Wallet Analysis\n\n**Address**: ${walletData.address}\n**Balance**: ${walletData.balance} SEI\n**Transactions**: ${walletData.transactionCount}\n**Last Activity**: ${walletData.lastActivity}\n**Risk Score**: ${walletData.riskScore}/10\n\n### Recent Transactions\n${walletData.recentTransactions.slice(0, 3).map(tx => `- ${tx.type.toUpperCase()}: ${tx.amount} ${tx.token} (${tx.status})`).join('\n')}`;
            confidence = 0.9;
            sources = ['SEI MCP Server', 'Live Blockchain Data'];
          } else {
            response = `## Wallet Analysis\n\nUnable to analyze wallet from query: "${userMessage.content}"\n\nPlease provide a valid SEI wallet address (starting with 'sei1') for analysis.`;
            confidence = 0.5;
          }
        } else if (toolName === 'seiTransferTool') {
          response = `## SEI Transfer Analysis\n\nBased on your query: "${userMessage.content}"\n\n### Transfer Estimation\n- **Estimated Gas**: ~21,000 units\n- **Gas Price**: ~0.1 usei\n- **Total Fee**: ~0.0021 SEI\n- **Network**: SEI Mainnet\n\n### Transfer Guide\n1. Ensure sufficient balance for amount + fees\n2. Verify recipient address format\n3. Consider network congestion\n4. Use appropriate gas limit\n\n*Note: This is a simulated response. Connect to live MCP server for real-time data.*`;
          confidence = 0.85;
        } else {
          // Default blockchain analysis
          response = `## SEI Blockchain Analysis\n\nAnalyzing your query: "${userMessage.content}"\n\n### Current Network Status\n- **Block Height**: ~${Math.floor(Math.random() * 1000000) + 5000000}\n- **Network**: SEI Pacific-1\n- **Status**: Active\n\n### Market Data\n- **SEI Price**: $${(Math.random() * 2 + 0.1).toFixed(4)}\n- **24h Change**: ${(Math.random() * 20 - 10).toFixed(2)}%\n- **Market Cap**: $${(Math.random() * 1000 + 100).toFixed(0)}M\n\n*This is simulated data. Enable MCP connection for live blockchain information.*`;
          confidence = 0.75;
        }
      } catch (mcpError) {
        console.warn('MCP client error, using fallback:', mcpError);
        response = `## SEI Blockchain Query\n\nI received your query: "${userMessage.content}"\n\n⚠️ **MCP Connection Issue**: Unable to fetch live blockchain data at the moment.\n\n### Fallback Information\n- Query type detected: ${toolName}\n- Recommended action: Check MCP server connection\n- Alternative: Try again in a few moments\n\nI can still help with general blockchain questions and guidance. Please let me know how else I can assist you!`;
        confidence = 0.6;
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
