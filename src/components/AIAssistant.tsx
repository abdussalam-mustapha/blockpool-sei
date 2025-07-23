import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Send, Copy, ThumbsUp, ThumbsDown, Bot, User, Zap, AlertCircle, Wrench } from 'lucide-react';
import { workingAiService } from '@/services/workingAiService';
import { enhancedSeiMcpClient } from '@/services/enhancedSeiMcpClient';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  confidence?: number;
  suggestions?: string[];
  metadata?: {
    queryType: string;
    processingTime: number;
    mcpStatus: 'connected' | 'disconnected' | 'error';
    sources?: string[];
    toolsUsed?: string[];
  };
}

const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mcpStatus, setMcpStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  const [autoScroll, setAutoScroll] = useState(true);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Default suggestions for new users
  const defaultSuggestions = [
    "Analyze wallet sei1abc123...",
    "What's the latest SEI price?",
    "Show recent transactions",
    "Explain SEI tokenomics"
  ];

  useEffect(() => {
    const checkStatus = () => {
      try {
        const status = enhancedSeiMcpClient.getConnectionStatus();
        setMcpStatus(status.connected ? 'connected' : 'disconnected');
      } catch (error) {
        setMcpStatus('disconnected');
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (autoScroll && scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages, autoScroll]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: input.trim(),
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    abortControllerRef.current = new AbortController();

    try {
      const toolsToast = toast({
        title: "🔧 Processing Query",
        description: "Analyzing your request and selecting appropriate tools...",
        duration: 3000,
      });

      const response = await workingAiService.processQuery(input.trim());

      if (toolsToast.dismiss) toolsToast.dismiss();

      if (response.toolsUsed.length > 0) {
        toast({
          title: "🛠️ Tools Used",
          description: `Used: ${response.toolsUsed.join(', ')}`,
          duration: 2000,
        });
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        content: response.response,
        role: 'assistant',
        timestamp: new Date(),
        confidence: response.confidence,
        suggestions: response.suggestions,
        metadata: {
          queryType: response.metadata?.queryType || 'general',
          processingTime: response.metadata?.processingTime || 0,
          mcpStatus: enhancedSeiMcpClient.getConnectionStatus().connected ? 'connected' : 'disconnected',
          sources: response.sources,
          toolsUsed: response.toolsUsed
        }
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (response.suggestions.length > 0) {
        setTimeout(() => {
          toast({
            title: "💡 Suggestions",
            description: `Try: ${response.suggestions[0]}`,
            duration: 5000,
          });
        }, 1000);
      }

    } catch (error) {
      console.error('AI query failed:', error);

      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content: `❌ **Error Processing Request**\n\nSorry, I encountered an error while processing your request. This could be due to:\n\n• MCP server connection issues\n• Invalid query parameters\n• Temporary service unavailability\n\n**Please try again** or rephrase your question.`,
        role: 'assistant',
        timestamp: new Date(),
        confidence: 0.1,
        sources: ['Error Handler'],
        toolsUsed: [],
        suggestions: ['Try a simpler query', 'Check your wallet address', 'Ask for help'],
        metadata: {
          queryType: 'error',
          processingTime: 0,
          mcpStatus: 'error'
        }
      };

      setMessages(prev => [...prev, errorMessage]);

      toast({
        title: "Error",
        description: "Failed to process your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      toast({
        title: "Stopped",
        description: "Request cancelled",
      });
    }
  };

  const copyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Copied",
        description: "Message copied to clipboard",
      });
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleFeedback = (messageId: string, type: 'positive' | 'negative') => {
    toast({
      title: "Feedback Received",
      description: `Thank you for your ${type} feedback!`,
    });
  };

  const useSuggestion = (suggestion: string) => {
    setInput(suggestion);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const quickSuggestions = [
    "Analyze wallet sei1abc123...",
    "What's the latest block?",
    "Show me network status",
    "Help me get started"
  ];

  const getStatusBadge = () => {
    switch (mcpStatus) {
      case 'connected':
        return (
          <Badge className="text-xs bg-green-500/10 text-green-400 border-green-500/30">
            🟢 Connected
          </Badge>
        );
      case 'disconnected':
        return (
          <Badge variant="outline" className="text-xs border-yellow-500/30 text-yellow-400">
            🟡 Connecting...
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive" className="text-xs">
            🔴 Offline
          </Badge>
        );
    }
  };

  return (
    <Card className="h-[500px] sm:h-[600px] flex flex-col bg-black border-green-500/20">
      <CardHeader className="pb-3 border-b border-green-500/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <CardTitle className="text-lg sm:text-xl lg:text-2xl text-green-400 flex items-center gap-2">
            <Bot className="w-5 h-5" />
            AI Assistant
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-green-500/30 text-green-400 text-xs">
              <Zap className="w-3 h-3 mr-1" />
              Enhanced
            </Badge>
            {getStatusBadge()}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-3 sm:p-4 lg:p-6 gap-4 min-h-0">
        {mcpStatus === 'error' && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <div className="text-sm text-red-300">
              <strong>MCP Server Offline:</strong> Some features may be limited. Trying to reconnect...
            </div>
          </div>
        )}

        <ScrollArea 
          ref={scrollAreaRef}
          className="flex-1 pr-4"
        >
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <Bot className="w-12 h-12 mx-auto mb-4 text-green-400" />
                <p className="text-lg font-medium mb-2">Welcome to Blockpool AI Assistant!</p>
                <p className="text-sm mb-4">I can help you analyze wallets, transactions, and SEI network data using real-time data from our MCP server.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md mx-auto">
                  {quickSuggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="text-xs border-green-500/30 text-green-400 hover:bg-green-500/10 h-auto py-2 px-3 whitespace-normal text-left"
                      onClick={() => useSuggestion(suggestion)}
                    >
                      {suggestion.length > 25 ? `${suggestion.substring(0, 25)}...` : suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={message.id || index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[90%] sm:max-w-[85%] p-3 sm:p-4 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-primary text-black'
                      : 'bg-black text-white border border-green-500/30'
                  }`}
                >
                  <p className="text-xs sm:text-sm whitespace-pre-line leading-relaxed break-words">{message.content}</p>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-2 sm:mt-3 pt-2 border-t border-gray-600/30 space-y-2 sm:space-y-0">
                    <span className="text-xs opacity-70">{message.timestamp.toLocaleTimeString()}</span>
                    
                    {message.role === 'assistant' && (
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                        {message.confidence && (
                          <span className={`text-xs ${message.confidence >= 0.8 ? 'text-green-400' : message.confidence >= 0.6 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {(message.confidence * 100).toFixed(0)}% confident
                          </span>
                        )}
                        
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => copyMessage(message.content)}
                            className="p-1.5 sm:p-1 hover:bg-gray-600/50 rounded transition-colors"
                            title="Copy response"
                          >
                            <Copy className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                          </button>
                          <button
                            onClick={() => handleFeedback(message.id, 'positive')}
                            className="p-1.5 sm:p-1 hover:bg-gray-600/50 rounded transition-colors"
                            title="Good response"
                          >
                            <ThumbsUp className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                          </button>
                          <button
                            onClick={() => handleFeedback(message.id, 'negative')}
                            className="p-1.5 sm:p-1 hover:bg-gray-600/50 rounded transition-colors"
                            title="Poor response"
                          >
                            <ThumbsDown className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {message.suggestions.slice(0, 3).map((suggestion, idx) => (
                        <Button
                          key={idx}
                          variant="ghost"
                          size="sm"
                          className="text-xs h-6 px-2 border-green-500/30 text-green-400 hover:bg-green-500/10"
                          onClick={() => useSuggestion(suggestion)}
                        >
                          {suggestion.length > 20 ? `${suggestion.substring(0, 20)}...` : suggestion}
                        </Button>
                      ))}
                    </div>
                  )}

                {message.metadata?.sources && message.metadata.sources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-600/30">
                    <p className="text-xs text-gray-400 mb-1">Sources:</p>
                    {message.metadata.sources.map((source, idx) => (
                      <span
                        key={idx}
                        className="text-xs text-green-400 block"
                      >
                        {source}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-black text-white p-3 sm:p-4 rounded-lg border border-green-500/30">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs sm:text-sm">Analyzing SEI chain data...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

        {messages.length === 0 && (
          <div className="mb-3 sm:mb-4">
            <p className="text-xs text-gray-400 mb-2">Quick suggestions:</p>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {defaultSuggestions.slice(0, 4).map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  disabled={isLoading}
                  className="text-xs bg-black hover:bg-black/80 border border-green-500/30 hover:border-green-500/50 px-2 sm:px-3 py-1 rounded-full transition-colors disabled:opacity-50 truncate max-w-[calc(50%-0.375rem)] sm:max-w-none"
                  title={suggestion}
                >
                  {suggestion.length > 25 ? `${suggestion.slice(0, 22)}...` : suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

      <form onSubmit={handleSubmit} className="flex space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about SEI chain with Gemini AI..."
          disabled={isLoading}
          className="flex-1 bg-black border border-green-500/40 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
        />
        <Button 
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-primary hover:bg-primary/90 px-3 sm:px-4"
        >
          <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </Button>
      </form>
      </CardContent>
    </Card>
  );
};

export default AIAssistant;
