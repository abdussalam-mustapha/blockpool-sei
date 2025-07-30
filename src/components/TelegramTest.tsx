import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, TestTube, MessageCircle, Zap } from 'lucide-react';
import { telegramAlerts } from '@/services/telegramAlerts';

export function TelegramTest() {
  const [testResults, setTestResults] = useState<{
    connection: string | null;
    mockAlert: string | null;
  }>({
    connection: null,
    mockAlert: null
  });
  const [isLoading, setIsLoading] = useState({
    connection: false,
    mockAlert: false
  });

  const testConnection = async () => {
    setIsLoading(prev => ({ ...prev, connection: true }));
    setTestResults(prev => ({ ...prev, connection: null }));
    
    try {
      const success = await telegramAlerts.testConnection();
      setTestResults(prev => ({ 
        ...prev, 
        connection: success ? 'success' : 'failed' 
      }));
    } catch (error) {
      console.error('Connection test error:', error);
      setTestResults(prev => ({ ...prev, connection: 'error' }));
    } finally {
      setIsLoading(prev => ({ ...prev, connection: false }));
    }
  };

  const testMockAlert = async () => {
    setIsLoading(prev => ({ ...prev, mockAlert: true }));
    setTestResults(prev => ({ ...prev, mockAlert: null }));
    
    try {
      // Create a mock high-value transaction
      const mockTransaction = {
        hash: 'test_' + Date.now(),
        from: 'sei1test...sender',
        to: 'sei1test...receiver',
        value: 5000, // This should trigger a high-value alert
        amount: 5000,
        token: 'SEI',
        type: 'transfer',
        timestamp: Date.now(),
        blockNumber: 12345
      };

      console.log('🧪 Testing with mock transaction:', mockTransaction);
      await telegramAlerts.checkAlerts(mockTransaction);
      
      setTestResults(prev => ({ ...prev, mockAlert: 'success' }));
    } catch (error) {
      console.error('Mock alert test error:', error);
      setTestResults(prev => ({ ...prev, mockAlert: 'error' }));
    } finally {
      setIsLoading(prev => ({ ...prev, mockAlert: false }));
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string | null, type: 'connection' | 'mockAlert') => {
    if (type === 'connection') {
      switch (status) {
        case 'success':
          return 'Connection successful! Check your Telegram for a test message.';
        case 'failed':
          return 'Connection failed. Check your bot token and chat ID.';
        case 'error':
          return 'Connection error. Please try again.';
        default:
          return 'Test your Telegram bot connection';
      }
    } else {
      switch (status) {
        case 'success':
          return 'Mock alert sent! Check your Telegram for a high-value transaction alert.';
        case 'failed':
          return 'Alert failed to send. Check your configuration.';
        case 'error':
          return 'Alert error. Please try again.';
        default:
          return 'Test a mock high-value transaction alert';
      }
    }
  };

  const config = telegramAlerts.getConfig();

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-green-400" />
          Telegram Bot Testing
        </CardTitle>
        <CardDescription>
          Test your Telegram bot integration and alert system
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Configuration */}
        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Current Configuration</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">High Value Threshold:</span>
              <p className="font-medium">{config.highValueThreshold} SEI</p>
            </div>
            <div>
              <span className="text-muted-foreground">Watched Addresses:</span>
              <p className="font-medium">{config.watchedAddresses.length}</p>
            </div>
          </div>
          <div className="mt-2 flex gap-2">
            {config.enabledAlerts.highValue && <Badge variant="secondary">High Value</Badge>}
            {config.enabledAlerts.whaleActivity && <Badge variant="secondary">Whale Activity</Badge>}
            {config.enabledAlerts.watchedAddress && <Badge variant="secondary">Watched Addresses</Badge>}
          </div>
        </div>

        {/* Test Connection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-medium">1. Test Bot Connection</h4>
              <p className="text-sm text-muted-foreground">
                {getStatusText(testResults.connection, 'connection')}
              </p>
            </div>
            <Button 
              onClick={testConnection}
              disabled={isLoading.connection}
              variant="outline"
              size="sm"
            >
              <TestTube className="h-4 w-4 mr-2" />
              {isLoading.connection ? 'Testing...' : 'Test Connection'}
            </Button>
          </div>
          
          {testResults.connection && (
            <div className="flex items-center gap-2 p-2 bg-muted rounded">
              {getStatusIcon(testResults.connection)}
              <span className="text-sm">
                {getStatusText(testResults.connection, 'connection')}
              </span>
            </div>
          )}
        </div>

        {/* Test Mock Alert */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-medium">2. Test Alert System</h4>
              <p className="text-sm text-muted-foreground">
                {getStatusText(testResults.mockAlert, 'mockAlert')}
              </p>
            </div>
            <Button 
              onClick={testMockAlert}
              disabled={isLoading.mockAlert}
              variant="outline"
              size="sm"
            >
              <Zap className="h-4 w-4 mr-2" />
              {isLoading.mockAlert ? 'Sending...' : 'Send Test Alert'}
            </Button>
          </div>
          
          {testResults.mockAlert && (
            <div className="flex items-center gap-2 p-2 bg-muted rounded">
              {getStatusIcon(testResults.mockAlert)}
              <span className="text-sm">
                {getStatusText(testResults.mockAlert, 'mockAlert')}
              </span>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="p-4 border rounded-lg">
          <h4 className="font-medium mb-2">What to Expect:</h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• <strong>Connection Test:</strong> Sends a "Test successful" message to your Telegram</li>
            <li>• <strong>Alert Test:</strong> Simulates a 5,000 SEI transaction (triggers high-value alert)</li>
            <li>• <strong>Live Monitoring:</strong> Real transactions in your LiveFeed will automatically trigger alerts</li>
            <li>• <strong>Browser Toasts:</strong> You'll also see notifications in your browser</li>
          </ul>
        </div>

        {/* Console Instructions */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <h4 className="font-medium mb-2">Alternative: Browser Console Test</h4>
          <p className="text-sm text-muted-foreground mb-2">
            You can also test directly in the browser console:
          </p>
          <code className="text-xs bg-muted p-2 rounded block">
            telegramAlerts.testConnection()
          </code>
        </div>
      </CardContent>
    </Card>
  );
}
