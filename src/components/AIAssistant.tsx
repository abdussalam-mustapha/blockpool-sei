
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const suggestions = [
  "What has wallet sei1xy... done recently?",
  "Which meme coin is trending in the past hour?",
  "Summarize this NFT project's activity",
  "Show me the top whale transactions today"
];

const AIAssistant = () => {
  const [messages, setMessages] = useState([
    {
      type: 'assistant',
      content: "Hello! I'm your AI assistant for SEI blockchain analysis. Ask me anything about wallets, tokens, NFTs, or market trends.",
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    
    setMessages(prev => [...prev, {
      type: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString()
    }]);
    
    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        type: 'assistant',
        content: `Based on the SEI blockchain data, I can see that ${input.toLowerCase()} involves several recent transactions. The activity shows increased volume and some interesting patterns. Would you like me to dive deeper into specific metrics?`,
        timestamp: new Date().toLocaleTimeString()
      }]);
    }, 1000);
    
    setInput('');
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  return (
    <Card className="glass-card p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
          AI Assistant
        </h3>
        <span className="text-xs text-gray-400">Powered by SEI MCP</span>
      </div>

      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.type === 'user'
                  ? 'bg-primary text-black'
                  : 'bg-secondary text-white'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <span className="text-xs opacity-70 mt-1 block">{message.timestamp}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <p className="text-xs text-gray-400 mb-2">Quick suggestions:</p>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="text-xs bg-secondary hover:bg-secondary/80 px-3 py-1 rounded-full transition-colors"
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
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask anything about SEI chain..."
          className="flex-1 bg-secondary border border-gray-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <Button onClick={handleSend} className="bg-primary hover:bg-primary/90">
          Send
        </Button>
      </div>
    </Card>
  );
};

export default AIAssistant;
