// Test script to verify MCP server data fetching
const MCP_SERVER_URL = 'https://sei-mcp-server-1.onrender.com';

async function testMCPConnection() {
  console.log('🔍 Testing MCP Server Connection...');
  console.log(`Server URL: ${MCP_SERVER_URL}`);
  
  try {
    // Test health endpoint
    console.log('\n1. Testing health endpoint...');
    const healthResponse = await fetch(`${MCP_SERVER_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
    
    // Test wallet balance
    console.log('\n2. Testing wallet balance...');
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
        params: { address: 'sei1abc123' }
      })
    });
    
    const balanceData = await balanceResponse.json();
    console.log('💰 Balance response:', balanceData);
    
    // Test market data
    console.log('\n3. Testing market data...');
    const marketResponse = await fetch(`${MCP_SERVER_URL}/api/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': `test-session-${Date.now()}`
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'get_market_data',
        params: { symbol: 'SEI' }
      })
    });
    
    const marketData = await marketResponse.json();
    console.log('📈 Market data response:', marketData);
    
    // Test latest block
    console.log('\n4. Testing latest block...');
    const blockResponse = await fetch(`${MCP_SERVER_URL}/api/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': `test-session-${Date.now()}`
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 3,
        method: 'get_latest_block',
        params: {}
      })
    });
    
    const blockData = await blockResponse.json();
    console.log('🔗 Block data response:', blockData);
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testMCPConnection();
