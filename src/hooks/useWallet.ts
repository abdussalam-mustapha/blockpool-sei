
import { useState, useEffect } from 'react';

interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: string | null;
  balance: string | null;
}

export const useWallet = () => {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    address: null,
    chainId: null,
    balance: null
  });
  const [isConnecting, setIsConnecting] = useState(false);

  // Check if wallet is already connected on mount
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      // Check if there's a stored connection
      const storedAddress = localStorage.getItem('wallet_address');
      if (storedAddress) {
        setWallet(prev => ({
          ...prev,
          isConnected: true,
          address: storedAddress,
          chainId: 'sei-chain',
          balance: '1.234 SEI' // Mock balance
        }));
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  };

  const connectWallet = async () => {
    setIsConnecting(true);
    
    try {
      // Simulate wallet connection (in real implementation, this would interact with wallet extension)
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate connection delay
      
      // Mock wallet address for demonstration
      const mockAddress = `sei1${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      
      // Store connection
      localStorage.setItem('wallet_address', mockAddress);
      
      setWallet({
        isConnected: true,
        address: mockAddress,
        chainId: 'sei-chain',
        balance: '1.234 SEI'
      });

      console.log('Wallet connected successfully:', mockAddress);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    localStorage.removeItem('wallet_address');
    setWallet({
      isConnected: false,
      address: null,
      chainId: null,
      balance: null
    });
    console.log('Wallet disconnected');
  };

  return {
    wallet,
    isConnecting,
    connectWallet,
    disconnectWallet
  };
};
