// Test EVM wallet analysis functionality
import { seiMcpClient } from './src/services/seiMcpClient.ts';

console.log('🧪 Testing EVM Wallet Analysis...');

async function testEVMWallet() {
  try {
    // Test with a sample EVM address
    const evmAddress = '0x742d35Cc6634C0532925a3b8D4b9C7CB1f5c5e8C';
    
    console.log('🔍 Testing EVM address:', evmAddress);
    
    // Test wallet analysis
    const walletData = await seiMcpClient.analyzeWallet(evmAddress);
    
    console.log('✅ EVM Wallet Analysis Result:');
    console.log('- Address:', walletData.address);
    console.log('- Balance:', walletData.balance);
    console.log('- Transaction Count:', walletData.transactionCount);
    console.log('- Risk Score:', walletData.riskScore);
    console.log('- Tokens:', walletData.tokens?.length || 0, 'tokens');
    console.log('- Recent Transactions:', walletData.recentTransactions?.length || 0, 'transactions');
    
    return true;
  } catch (error) {
    console.error('❌ EVM Wallet Analysis Failed:', error.message);
    return false;
  }
}

async function testSEINativeWallet() {
  try {
    // Test with a sample SEI native address
    const seiAddress = 'sei1qy352eufqy352eufqy352eufqy352eufqy352eu';
    
    console.log('🔍 Testing SEI native address:', seiAddress);
    
    // Test wallet analysis
    const walletData = await seiMcpClient.analyzeWallet(seiAddress);
    
    console.log('✅ SEI Native Wallet Analysis Result:');
    console.log('- Address:', walletData.address);
    console.log('- Balance:', walletData.balance);
    console.log('- Transaction Count:', walletData.transactionCount);
    console.log('- Risk Score:', walletData.riskScore);
    console.log('- Tokens:', walletData.tokens?.length || 0, 'tokens');
    console.log('- Recent Transactions:', walletData.recentTransactions?.length || 0, 'transactions');
    
    return true;
  } catch (error) {
    console.error('❌ SEI Native Wallet Analysis Failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting wallet analysis tests...\n');
  
  const evmResult = await testEVMWallet();
  console.log('');
  const seiResult = await testSEINativeWallet();
  
  console.log('\n📊 Test Results:');
  console.log('- EVM Wallet Analysis:', evmResult ? '✅ PASSED' : '❌ FAILED');
  console.log('- SEI Native Wallet Analysis:', seiResult ? '✅ PASSED' : '❌ FAILED');
  
  if (evmResult && seiResult) {
    console.log('\n🎉 All tests passed! EVM wallet analysis is working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the implementation.');
  }
}

runTests().catch(console.error);
