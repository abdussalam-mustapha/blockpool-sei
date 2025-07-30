import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Settings, TestTube, Bell } from 'lucide-react';
import { telegramAlerts } from '@/services/telegramAlerts';

export function TelegramSettings() {
  const [config, setConfig] = useState(telegramAlerts.getConfig());
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [newWatchedAddress, setNewWatchedAddress] = useState('');

  const handleConfigUpdate = (updates: any) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    telegramAlerts.updateConfig(newConfig);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const success = await telegramAlerts.testConnection();
      setTestResult(success ? 'success' : 'failed');
    } catch (error) {
      setTestResult('error');
    } finally {
      setIsTesting(false);
    }
  };

  const addWatchedAddress = () => {
    if (newWatchedAddress.trim()) {
      telegramAlerts.addWatchedAddress(newWatchedAddress.trim());
      setConfig(telegramAlerts.getConfig());
      setNewWatchedAddress('');
    }
  };

  const removeWatchedAddress = (address: string) => {
    telegramAlerts.removeWatchedAddress(address);
    setConfig(telegramAlerts.getConfig());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Bell className="h-6 w-6 text-green-400" />
        <h2 className="text-2xl font-bold">Telegram Alert Settings</h2>
      </div>

      {/* Bot Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Setup Instructions
          </CardTitle>
          <CardDescription>
            Follow these steps to set up Telegram notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm space-y-3">
            <div>
              <strong>1. Create a Telegram Bot:</strong>
              <ul className="ml-4 mt-1 space-y-1 text-muted-foreground">
                <li>• Open Telegram and search for @BotFather</li>
                <li>• Send /newbot and follow the instructions</li>
                <li>• Copy your Bot Token (it should look like: 7210992745:AAHfD3uh6yAqCVfLUxd2h_Cf6V28k-1p2K0)</li>
              </ul>
            </div>
            <div>
              <strong>2. Get Your Chat ID:</strong>
              <ul className="ml-4 mt-1 space-y-1 text-muted-foreground">
                <li>• Send a message to your bot</li>
                <li>• Visit: https://api.telegram.org/bot&lt;YOUR_BOT_TOKEN&gt;/getUpdates</li>
                <li>• Find your chat.id in the response</li>
              </ul>
            </div>
            <div>
              <strong>3. Update the bot token in the code:</strong>
              <p className="ml-4 mt-1 text-muted-foreground">
                Edit <code>src/services/telegramAlerts.ts</code> and replace the BOT_TOKEN and CHAT_ID with your values.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Connection */}
      <Card>
        <CardHeader>
          <CardTitle>Test Connection</CardTitle>
          <CardDescription>
            Test if your Telegram bot is working correctly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {testResult === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
              {testResult === 'failed' && <AlertTriangle className="h-4 w-4 text-red-500" />}
              {testResult === 'error' && <AlertTriangle className="h-4 w-4 text-red-500" />}
              <span className="text-sm">
                {testResult === 'success' && 'Test successful! Check your Telegram.'}
                {testResult === 'failed' && 'Test failed. Check your bot token and chat ID.'}
                {testResult === 'error' && 'Connection error. Please try again.'}
                {!testResult && 'Click test to verify your setup'}
              </span>
            </div>
            <Button 
              onClick={handleTestConnection} 
              variant="outline" 
              size="sm"
              disabled={isTesting}
            >
              <TestTube className="h-4 w-4 mr-2" />
              {isTesting ? 'Testing...' : 'Test Connection'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alert Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Configuration</CardTitle>
          <CardDescription>
            Configure when to receive Telegram notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* High Value Threshold */}
          <div className="space-y-2">
            <Label htmlFor="threshold">High Value Threshold (SEI)</Label>
            <Input
              id="threshold"
              type="number"
              value={config.highValueThreshold}
              onChange={(e) => handleConfigUpdate({ highValueThreshold: parseFloat(e.target.value) || 1000 })}
              placeholder="1000"
            />
            <p className="text-xs text-muted-foreground">
              Get alerts for transactions above this amount
            </p>
          </div>

          {/* Alert Types */}
          <div className="space-y-4">
            <h4 className="font-medium">Alert Types</h4>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="high-value">High Value Transactions</Label>
                <p className="text-xs text-muted-foreground">
                  Transactions above the threshold amount
                </p>
              </div>
              <Switch
                id="high-value"
                checked={config.enabledAlerts.highValue}
                onCheckedChange={(checked) => 
                  handleConfigUpdate({ 
                    enabledAlerts: { ...config.enabledAlerts, highValue: checked } 
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="whale-activity">Whale Activity</Label>
                <p className="text-xs text-muted-foreground">
                  Very large transactions (10,000+ SEI)
                </p>
              </div>
              <Switch
                id="whale-activity"
                checked={config.enabledAlerts.whaleActivity}
                onCheckedChange={(checked) => 
                  handleConfigUpdate({ 
                    enabledAlerts: { ...config.enabledAlerts, whaleActivity: checked } 
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="watched-address">Watched Address Activity</Label>
                <p className="text-xs text-muted-foreground">
                  Activity involving your watched addresses
                </p>
              </div>
              <Switch
                id="watched-address"
                checked={config.enabledAlerts.watchedAddress}
                onCheckedChange={(checked) => 
                  handleConfigUpdate({ 
                    enabledAlerts: { ...config.enabledAlerts, watchedAddress: checked } 
                  })
                }
              />
            </div>
          </div>

          {/* Watched Addresses */}
          <div className="space-y-3">
            <h4 className="font-medium">Watched Addresses</h4>
            
            <div className="flex gap-2">
              <Input
                placeholder="sei1abc...xyz or partial address"
                value={newWatchedAddress}
                onChange={(e) => setNewWatchedAddress(e.target.value)}
              />
              <Button onClick={addWatchedAddress} size="sm">
                Add
              </Button>
            </div>

            <div className="space-y-2">
              {config.watchedAddresses.map((address, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                  <code className="text-sm">{address}</code>
                  <Button 
                    onClick={() => removeWatchedAddress(address)}
                    variant="ghost" 
                    size="sm"
                  >
                    Remove
                  </Button>
                </div>
              ))}
              {config.watchedAddresses.length === 0 && (
                <p className="text-sm text-muted-foreground">No watched addresses configured</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle>Current Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>High Value Threshold</Label>
              <p className="text-2xl font-bold text-green-400">{config.highValueThreshold} SEI</p>
            </div>
            <div>
              <Label>Watched Addresses</Label>
              <p className="text-2xl font-bold text-green-400">{config.watchedAddresses.length}</p>
            </div>
          </div>
          
          <div className="mt-4 flex gap-2">
            {config.enabledAlerts.highValue && <Badge variant="secondary">High Value</Badge>}
            {config.enabledAlerts.whaleActivity && <Badge variant="secondary">Whale Activity</Badge>}
            {config.enabledAlerts.watchedAddress && <Badge variant="secondary">Watched Addresses</Badge>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
