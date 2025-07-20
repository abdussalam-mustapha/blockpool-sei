
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Send, Copy, ThumbsUp, ThumbsDown } from 'lucide-react';
import { generateAIResponse } from '@/services/aiService';

const suggestions = [
  "What has wallet sei1xy... done recently?",
  "Which meme coin is trending in the past hour?",
  "Summarize recent NFT activity",
  "Show me the top whale transactions today",
  "Is this contract safe to interact with?",
  "What's the current SEI market sentiment?"
];

interface Message {
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
  confidence?: number;
  sources?: string[];
}

const AIAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      type: 'assistant',
      content: "Hello! I'm your AI assistant connected to the SEI blockchain. I can analyze wallets, track tokens, monitor NFTs, assess risks, and provide real-time market insights. What would you like to know?",
      timestamp: new Date().toLocaleTimeString(),
      confidence: 1.0
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage: Message = {
      type: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      const response = await generateAIResponse(input);
      
      const assistantMessage: Message = {
        type: 'assistant',
        content: response.content,
        timestamp: new Date().toLocaleTimeString(),
        confidence: response.confidence,
        sources: response.sources
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      const errorMessage: Message = {
        type: 'assistant',
        content: "I apologize, but I'm having trouble connecting to the SEI chain data right now. Please try again in a moment.",
        timestamp: new Date().toLocaleTimeString(),
        confidence: 0.1
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
    
    setInput('');
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-400';
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <Card className="bg-black border border-green-500/40 p-3 sm:p-4 lg:p-6 h-[500px] sm:h-[600px] flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 space-y-2 sm:space-y-0">
        <h3 className="text-base sm:text-lg font-semibold text-white flex items-center">
          <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 mr-2" />
          AI Assistant
        </h3>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-400">Live SEI Data</span>
        </div>
      </div>

      <ScrollArea ref={scrollAreaRef} className="flex-1 mb-3 sm:mb-4 pr-2 sm:pr-4">
        <div className="space-y-3 sm:space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[90%] sm:max-w-[85%] p-3 sm:p-4 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-primary text-black'
                    : 'bg-black text-white border border-green-500/30'
                }`}
              >
                <p className="text-xs sm:text-sm whitespace-pre-line leading-relaxed break-words">{message.content}</p>
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-2 sm:mt-3 pt-2 border-t border-gray-600/30 space-y-2 sm:space-y-0">
                  <span className="text-xs opacity-70">{message.timestamp}</span>
                  
                  {message.type === 'assistant' && (
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                      {message.confidence && (
                        <span className={`text-xs ${getConfidenceColor(message.confidence)}`}>
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
                          className="p-1.5 sm:p-1 hover:bg-gray-600/50 rounded transition-colors"
                          title="Good response"
                        >
                          <ThumbsUp className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                        </button>
                        <button
                          className="p-1.5 sm:p-1 hover:bg-gray-600/50 rounded transition-colors"
                          title="Poor response"
                        >
                          <ThumbsDown className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {message.sources && message.sources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-600/30">
                    <p className="text-xs text-gray-400 mb-1">Sources:</p>
                    {message.sources.map((source, idx) => (
                      <a
                        key={idx}
                        href={source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-green-400 hover:text-green-300 underline block"
                      >
                        {source}
                      </a>
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

      <div className="mb-3 sm:mb-4">
        <p className="text-xs text-gray-400 mb-2">Quick suggestions:</p>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {suggestions.slice(0, 4).map((suggestion, index) => (
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
          {suggestions.length > 4 && (
            <div className="hidden sm:contents">
              {suggestions.slice(4).map((suggestion, index) => (
                <button
                  key={index + 4}
                  onClick={() => handleSuggestionClick(suggestion)}
                  disabled={isLoading}
                  className="text-xs bg-black hover:bg-black/80 border border-green-500/30 hover:border-green-500/50 px-3 py-1 rounded-full transition-colors disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Ask about SEI chain..."
          disabled={isLoading}
          className="flex-1 bg-black border border-green-500/40 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
        />
        <Button 
          onClick={handleSend} 
          disabled={isLoading || !input.trim()}
          className="bg-primary hover:bg-primary/90 px-3 sm:px-4"
        >
          <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </Button>
      </div>
    </Card>
  );
};

export default AIAssistant;
