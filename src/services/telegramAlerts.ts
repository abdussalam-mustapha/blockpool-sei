// Telegram Bot Configuration - Read from environment variables
const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
const CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID;

// Validate environment variables
if (!BOT_TOKEN || !CHAT_ID) {
  console.warn('⚠️ Telegram credentials not found in environment variables. Please check your .env file.');
}

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: number;
  amount?: number;
  token?: string;
  type: string;
  timestamp: number;
  blockNumber?: number;
}

// Alert configuration
interface AlertConfig {
  highValueThreshold: number;
  watchedAddresses: string[];
  enabledAlerts: {
    highValue: boolean;
    watchedAddress: boolean;
    whaleActivity: boolean;
  };
}

class TelegramAlerts {
  private config: AlertConfig = {
    highValueThreshold: 1000,
    watchedAddresses: ["sei123...abc"], // Add your watched addresses here
    enabledAlerts: {
      highValue: true,
      watchedAddress: true,
      whaleActivity: true
    }
  };

  // Update configuration
  public updateConfig(newConfig: Partial<AlertConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  // Main alert checker - call this for each new transaction
  public async checkAlerts(transaction: Transaction) {
    const alerts: string[] = [];

    // High value transaction alert
    if (this.config.enabledAlerts.highValue && transaction.value > this.config.highValueThreshold) {
      alerts.push(this.formatHighValueAlert(transaction));
    }

    // Watched address alert
    if (this.config.enabledAlerts.watchedAddress) {
      const isWatchedAddress = this.config.watchedAddresses.some(addr => 
        transaction.to.toLowerCase().includes(addr.toLowerCase()) || 
        transaction.from.toLowerCase().includes(addr.toLowerCase())
      );
      
      if (isWatchedAddress) {
        alerts.push(this.formatWatchedAddressAlert(transaction));
      }
    }

    // Whale activity (very high value)
    if (this.config.enabledAlerts.whaleActivity && transaction.value > 10000) {
      alerts.push(this.formatWhaleAlert(transaction));
    }

    // Send all triggered alerts
    for (const alert of alerts) {
      await this.sendTelegramMessage(alert);
      this.showToast(alert); // Also show browser toast
    }
  }

  private formatHighValueAlert(transaction: Transaction): string {
    return `🚨 *High Value Transaction Alert*

💰 Amount: ${transaction.value} SEI
📝 Hash: \`${transaction.hash}\`
📤 From: \`${transaction.from}\`
📥 To: \`${transaction.to}\`
⏰ Time: ${new Date(transaction.timestamp).toLocaleString()}

#HighValue #SEIChain`;
  }

  private formatWatchedAddressAlert(transaction: Transaction): string {
    return `👀 *Watched Address Activity*

💰 Amount: ${transaction.value} SEI
📝 Hash: \`${transaction.hash}\`
📤 From: \`${transaction.from}\`
📥 To: \`${transaction.to}\`
⏰ Time: ${new Date(transaction.timestamp).toLocaleString()}

#WatchedAddress #SEIChain`;
  }

  private formatWhaleAlert(transaction: Transaction): string {
    return `🐋 *WHALE ALERT*

💰 Amount: ${transaction.value} SEI
📝 Hash: \`${transaction.hash}\`
📤 From: \`${transaction.from}\`
📥 To: \`${transaction.to}\`
⏰ Time: ${new Date(transaction.timestamp).toLocaleString()}

#WhaleAlert #SEIChain`;
  }

  // Send message to Telegram
  private async sendTelegramMessage(message: string): Promise<boolean> {
    try {
      const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
          parse_mode: "Markdown",
          disable_web_page_preview: true
        })
      });

      if (!response.ok) {
        console.error('Telegram API error:', await response.text());
        return false;
      }

      console.log('✅ Telegram alert sent successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to send Telegram message:', error);
      return false;
    }
  }

  // Show browser toast notification
  private showToast(message: string) {
    // Extract the alert type from the message
    const alertType = message.includes('🐋') ? 'WHALE' : 
                     message.includes('👀') ? 'WATCHED' : 'HIGH VALUE';
    
    const shortMessage = `${alertType} ALERT - Check Telegram for details`;
    
    const toast = document.createElement("div");
    toast.innerText = shortMessage;
    toast.style.cssText = `
      position: fixed; 
      bottom: 20px; 
      right: 20px;
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); 
      color: #00ff88; 
      padding: 12px 20px;
      border-radius: 8px; 
      z-index: 9999;
      border: 1px solid #00ff88;
      box-shadow: 0 4px 12px rgba(0, 255, 136, 0.3);
      font-family: 'Inter', sans-serif;
      font-weight: 500;
      animation: slideIn 0.3s ease-out;
    `;
    
    // Add CSS animation
    if (!document.querySelector('#toast-styles')) {
      const style = document.createElement('style');
      style.id = 'toast-styles';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 5000);
  }

  // Test the Telegram connection
  public async testConnection(): Promise<boolean> {
    const testMessage = `🧪 *SEI Chain Pulse Test*

Connection test successful! ✅
Your Telegram alerts are now active.

Time: ${new Date().toLocaleString()}`;

    return await this.sendTelegramMessage(testMessage);
  }

  // Add a watched address
  public addWatchedAddress(address: string) {
    if (!this.config.watchedAddresses.includes(address)) {
      this.config.watchedAddresses.push(address);
      console.log(`✅ Added watched address: ${address}`);
    }
  }

  // Remove a watched address
  public removeWatchedAddress(address: string) {
    const index = this.config.watchedAddresses.indexOf(address);
    if (index > -1) {
      this.config.watchedAddresses.splice(index, 1);
      console.log(`❌ Removed watched address: ${address}`);
    }
  }

  // Get current configuration
  public getConfig(): AlertConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const telegramAlerts = new TelegramAlerts();

// Export types for use in other components
export type { Transaction, AlertConfig };
