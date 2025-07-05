
import { useState, useEffect } from 'react';

interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: string | null;
  balance: string | null;
}

declare global {
  interface Window {
    keplr?: any;
    compass?: any;
    fin?: any;
  }
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
      // Check for Keplr wallet
      if (window.keplr) {
        const chainId = 'pacific-1'; // SEI mainnet
        try {
          const key = await window.keplr.getKey(chainId);
          if (key) {
            const balance = await getBalance(key.bech32Address);
            setWallet({
              isConnected: true,
              address: key.bech32Address,
              chainId: chainId,
              balance: balance
            });
          }
        } catch (error) {
          console.log('No existing connection found');
        }
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  };

  const getBalance = async (address: string): Promise<string> => {
    try {
      // Use SEI RPC endpoint to get balance
      const response = await fetch('https://sei-rpc.polkachu.com/abci_query?path="/cosmos.bank.v1beta1.Query/Balance"&data=0x' + 
        Buffer.from(JSON.stringify({
          address: address,
          denom: 'usei'
        })).toString('hex'));
      
      const data = await response.json();
      if (data.result && data.result.response && data.result.response.value) {
        const decodedValue = JSON.parse(Buffer.from(data.result.response.value, 'base64').toString());
        const balance = parseInt(decodedValue.balance.amount) / 1000000; // Convert from usei to SEI
        return `${balance.toFixed(3)} SEI`;
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
    return '0.000 SEI';
  };

  const connectWallet = async () => {
    setIsConnecting(true);
    
    try {
      if (!window.keplr && !window.compass && !window.fin) {
        throw new Error('No wallet extension found. Please install Keplr, Compass, or Fin wallet.');
      }

      const chainId = 'pacific-1'; // SEI mainnet
      
      // Try Keplr first
      if (window.keplr) {
        try {
          await window.keplr.enable(chainId);
          const key = await window.keplr.getKey(chainId);
          const balance = await getBalance(key.bech32Address);
          
          setWallet({
            isConnected: true,
            address: key.bech32Address,
            chainId: chainId,
            balance: balance
          });

          console.log('Wallet connected successfully:', key.bech32Address);
          return;
        } catch (keplrError) {
          console.error('Keplr connection failed:', keplrError);
        }
      }

      // Try Compass wallet
      if (window.compass) {
        try {
          await window.compass.enable(chainId);
          const key = await window.compass.getKey(chainId);
          const balance = await getBalance(key.bech32Address);
          
          setWallet({
            isConnected: true,
            address: key.bech32Address,
            chainId: chainId,
            balance: balance
          });

          console.log('Compass wallet connected successfully:', key.bech32Address);
          return;
        } catch (compassError) {
          console.error('Compass connection failed:', compassError);
        }
      }

      // Try Fin wallet
      if (window.fin) {
        try {
          await window.fin.enable(chainId);
          const key = await window.fin.getKey(chainId);
          const balance = await getBalance(key.bech32Address);
          
          setWallet({
            isConnected: true,
            address: key.bech32Address,
            chainId: chainId,
            balance: balance
          });

          console.log('Fin wallet connected successfully:', key.bech32Address);
          return;
        } catch (finError) {
          console.error('Fin connection failed:', finError);
        }
      }

      throw new Error('Failed to connect to any available wallet');

    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
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
