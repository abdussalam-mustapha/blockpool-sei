// Test script to check what wallet analysis actually returns
const MCP_SERVER_URL = 'https://sei-mcp-server-1.onrender.com';

async function testWalletAnalysis() {
  console.log('🔍 Testing Wallet Analysis...');
  console.log(`Server URL: ${MCP_SERVER_URL}`);
  
  const testAddresses = [
    '0xBa9498e8F312FFFC78de8Ef3cB73B0869b51549d', // EVM format
    'sei1abc123', // SEI bech32 format (example)
    'sei1000000000000000000000000000000000000' // Another SEI format
  ];
  
  for (const address of testAddresses) {
    console.log(`\n📍 Testing address: ${address}`);
    
    try {
      // Test get_balance method
      console.log('1. Testing get_balance...');
      const balanceResponse = await fetch(`${MCP_SERVER_URL}/api/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': `test-session-${Date.now()}`
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'get_balance',
          params: { address }
        })
      });
      
      const balanceData = await balanceResponse.json();
      console.log('💰 Balance response:', JSON.stringify(balanceData, null, 2));
      
      // Test analyze_wallet method
      console.log('2. Testing analyze_wallet...');
      const analyzeResponse = await fetch(`${MCP_SERVER_URL}/api/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': `test-session-${Date.now()}`
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'analyze_wallet',
          params: { address }
        })
      });
      
      const analyzeData = await analyzeResponse.json();
      console.log('🔍 Analyze wallet response:', JSON.stringify(analyzeData, null, 2));
      
      // Test wallet_transactions method
      console.log('3. Testing wallet_transactions...');
      const txResponse = await fetch(`${MCP_SERVER_URL}/api/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': `test-session-${Date.now()}`
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 3,
          method: 'wallet_transactions',
          params: { address, limit: 5 }
        })
      });
      
      const txData = await txResponse.json();
      console.log('📜 Transactions response:', JSON.stringify(txData, null, 2));
      
    } catch (error) {
      console.error(`❌ Error testing ${address}:`, error.message);
    }
    
    console.log('\n' + '='.repeat(60));
  }
}

// Run the test
testWalletAnalysis();
