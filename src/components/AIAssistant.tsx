
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
    <Card className="glass-card p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Brain className="w-5 h-5 text-green-400 mr-2" />
          AI Assistant
        </h3>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-400">Live SEI Data</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-4 rounded-lg ${
                message.type === 'user'
                  ? 'bg-primary text-black'
                  : 'bg-secondary text-white border border-green-500/20'
              }`}
            >
              <p className="text-sm whitespace-pre-line leading-relaxed">{message.content}</p>
              
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-600/30">
                <span className="text-xs opacity-70">{message.timestamp}</span>
                
                {message.type === 'assistant' && (
                  <div className="flex items-center space-x-2">
                    {message.confidence && (
                      <span className={`text-xs ${getConfidenceColor(message.confidence)}`}>
                        {(message.confidence * 100).toFixed(0)}% confident
                      </span>
                    )}
                    
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => copyMessage(message.content)}
                        className="p-1 hover:bg-gray-600/50 rounded transition-colors"
                        title="Copy response"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        className="p-1 hover:bg-gray-600/50 rounded transition-colors"
                        title="Good response"
                      >
                        <ThumbsUp className="w-3 h-3" />
                      </button>
                      <button
                        className="p-1 hover:bg-gray-600/50 rounded transition-colors"
                        title="Poor response"
                      >
                        <ThumbsDown className="w-3 h-3" />
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
            <div className="bg-secondary text-white p-4 rounded-lg border border-green-500/20">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm">Analyzing SEI chain data...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mb-4">
        <p className="text-xs text-gray-400 mb-2">Quick suggestions:</p>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              disabled={isLoading}
              className="text-xs bg-secondary hover:bg-secondary/80 px-3 py-1 rounded-full transition-colors disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      <div className="flex space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Ask anything about SEI chain..."
          disabled={isLoading}
          className="flex-1 bg-secondary border border-gray-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
        />
        <Button 
          onClick={handleSend} 
          disabled={isLoading || !input.trim()}
          className="bg-primary hover:bg-primary/90"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
};

export default AIAssistant;
