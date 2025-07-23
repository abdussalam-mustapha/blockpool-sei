import { useState, useEffect, useRef, useCallback } from 'react';
import { GeminiService, createGeminiService, getDefaultGeminiConfig, GeminiResponse } from '@/services/geminiService';

export interface UseGeminiOptions {
  enabled?: boolean;
  autoInitialize?: boolean;
  onResponse?: (response: GeminiResponse) => void;
  onError?: (error: Error) => void;
}

export interface UseGeminiReturn {
  geminiService: GeminiService | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: Error | null;
  generateResponse: (query: string, context?: any) => Promise<GeminiResponse>;
  clearHistory: () => void;
  reinitialize: () => Promise<void>;
  isEnabled: boolean;
}

export function useGemini({
  enabled = true,
  autoInitialize = true,
  onResponse,
  onError
}: UseGeminiOptions = {}): UseGeminiReturn {
  const [geminiService, setGeminiService] = useState<GeminiService | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const initializationRef = useRef<Promise<void> | null>(null);
  const isEnabledRef = useRef(enabled);

  // Check if Gemini is enabled via environment
  const isGeminiEnabled = import.meta.env.VITE_ENABLE_GEMINI_AI !== 'false' && enabled;

  const initialize = useCallback(async (): Promise<void> => {
    if (!isGeminiEnabled) {
      console.log('🚫 [GEMINI-HOOK] Gemini AI is disabled via configuration');
      return;
    }

    // Prevent multiple simultaneous initializations
    if (initializationRef.current) {
      console.log('⏳ [GEMINI-HOOK] Initialization already in progress, waiting...');
      return initializationRef.current;
    }

    initializationRef.current = (async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('🚀 [GEMINI-HOOK] Starting Gemini AI service initialization...');
        
        // Get configuration from environment
        const config = getDefaultGeminiConfig();
        
        console.log('⚙️ [GEMINI-HOOK] Configuration loaded:', {
          model: config.model,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          hasApiKey: !!config.apiKey,
          apiKeyLength: config.apiKey?.length || 0
        });
        
        // Create Gemini service instance
        console.log('🏗️ [GEMINI-HOOK] Creating Gemini service instance...');
        const service = createGeminiService(config);
        
        setGeminiService(service);
        setIsInitialized(true);
        
        console.log('✅ [GEMINI-HOOK] Gemini AI service initialized successfully!');
        console.log('📋 [GEMINI-HOOK] Service details:', {
          model: config.model,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          serviceCreated: !!service
        });
        
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to initialize Gemini service');
        console.error('❌ [GEMINI-HOOK] Initialization error:', {
          error: error.message,
          errorType: error.constructor.name,
          stack: error.stack?.split('\n').slice(0, 3)
        });
        setError(error);
        onError?.(error);
      } finally {
        setIsLoading(false);
        initializationRef.current = null;
        console.log('🏁 [GEMINI-HOOK] Initialization process completed');
      }
    })();

    return initializationRef.current;
  }, [isGeminiEnabled, onError]);

  const generateResponse = useCallback(async (query: string, context?: any): Promise<GeminiResponse> => {
    if (!isGeminiEnabled) {
      console.error('🚫 [GEMINI-HOOK] Cannot generate response: Gemini AI is disabled');
      throw new Error('Gemini AI is disabled');
    }

    if (!geminiService) {
      console.error('❌ [GEMINI-HOOK] Cannot generate response: Gemini service not initialized');
      throw new Error('Gemini service not initialized');
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🚀 [GEMINI-HOOK] Starting response generation:', {
        queryLength: query.length,
        queryPreview: query.substring(0, 50) + (query.length > 50 ? '...' : ''),
        hasContext: !!context,
        contextKeys: context ? Object.keys(context) : null
      });
      
      const startTime = Date.now();
      const response = await geminiService.generateResponse(query, context);
      const hookResponseTime = Date.now() - startTime;
      
      console.log('✅ [GEMINI-HOOK] Response generated successfully:', {
        confidence: Math.round(response.confidence * 100) + '%',
        serviceResponseTime: response.metadata.responseTime + 'ms',
        hookResponseTime: hookResponseTime + 'ms',
        toolCalls: response.toolCalls?.length || 0,
        contentLength: response.content.length,
        sources: response.sources.length
      });
      
      onResponse?.(response);
      return response;
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to generate response');
      console.error('❌ [GEMINI-HOOK] Response generation failed:', {
        error: error.message,
        errorType: error.constructor.name,
        queryPreview: query.substring(0, 30) + '...'
      });
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
      console.log('🏁 [GEMINI-HOOK] Response generation process completed');
    }
  }, [geminiService, isGeminiEnabled, onResponse, onError]);

  const clearHistory = useCallback(() => {
    if (geminiService) {
      console.log('🗑️ Clearing Gemini chat history');
      geminiService.clearChatHistory();
    }
  }, [geminiService]);

  const reinitialize = useCallback(async () => {
    console.log('🔄 Reinitializing Gemini service...');
    setGeminiService(null);
    setIsInitialized(false);
    setError(null);
    initializationRef.current = null;
    
    await initialize();
  }, [initialize]);

  // Auto-initialize on mount if enabled
  useEffect(() => {
    if (autoInitialize && isGeminiEnabled && !isInitialized && !initializationRef.current) {
      initialize();
    }
  }, [autoInitialize, isGeminiEnabled, isInitialized, initialize]);

  // Update enabled state
  useEffect(() => {
    isEnabledRef.current = enabled;
  }, [enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (geminiService) {
        console.log('🧹 Cleaning up Gemini service');
        geminiService.clearChatHistory();
      }
    };
  }, [geminiService]);

  return {
    geminiService,
    isInitialized: isInitialized && isGeminiEnabled,
    isLoading,
    error,
    generateResponse,
    clearHistory,
    reinitialize,
    isEnabled: isGeminiEnabled
  };
}

// Utility hook for Gemini status
export function useGeminiStatus() {
  const hasApiKey = !!import.meta.env.VITE_GEMINI_API_KEY;
  const isEnabled = import.meta.env.VITE_ENABLE_GEMINI_AI !== 'false';
  
  return {
    hasApiKey,
    isEnabled,
    isConfigured: hasApiKey && isEnabled,
    model: import.meta.env.VITE_GEMINI_MODEL || 'gemini-1.5-pro'
  };
}
