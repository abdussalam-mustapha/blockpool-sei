// Simple test script to verify MCP server connection
import EventSource from 'eventsource';

console.log('🧪 Testing MCP Server Connection...');

// Test 1: Check if MCP server is running
async function testServerHealth() {
  try {
    const response = await fetch('http://localhost:3001/health');
    if (response.ok) {
      console.log('✅ MCP Server health check passed');
      return true;
    } else {
      console.log('❌ MCP Server health check failed:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ MCP Server not reachable:', error.message);
    return false;
  }
}

// Test 2: Test SSE connection
function testSSEConnection() {
  return new Promise((resolve) => {
    const sessionId = 'test_' + Date.now();
    const eventSource = new EventSource(`http://localhost:3001/sse?sessionId=${sessionId}`);
    
    let connected = false;
    
    eventSource.onopen = () => {
      console.log('✅ SSE connection established');
      connected = true;
      eventSource.close();
      resolve(true);
    };
    
    eventSource.onerror = (error) => {
      console.log('❌ SSE connection failed:', error);
      eventSource.close();
      resolve(false);
    };
    
    // Timeout after 5 seconds
    setTimeout(() => {
      if (!connected) {
        console.log('❌ SSE connection timeout');
        eventSource.close();
        resolve(false);
      }
    }, 5000);
  });
}

// Test 3: Test MCP message endpoint
async function testMCPMessages() {
  try {
    const message = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {}, resources: {}, prompts: {} },
        clientInfo: { name: 'TestClient', version: '1.0.0' }
      }
    };
    
    const response = await fetch('http://localhost:3001/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(message)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ MCP message endpoint working:', result);
      return true;
    } else {
      console.log('❌ MCP message endpoint failed:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ MCP message test failed:', error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('\n🔍 Running MCP Integration Tests...\n');
  
  const healthOk = await testServerHealth();
  if (!healthOk) {
    console.log('\n❌ MCP Server is not running. Please start it first.');
    console.log('💡 Run: cd C:\\Users\\DELL\\Desktop\\sei-mcp-server && npm start');
    return;
  }
  
  const sseOk = await testSSEConnection();
  const mcpOk = await testMCPMessages();
  
  console.log('\n📊 Test Results:');
  console.log(`Health Check: ${healthOk ? '✅' : '❌'}`);
  console.log(`SSE Connection: ${sseOk ? '✅' : '❌'}`);
  console.log(`MCP Messages: ${mcpOk ? '✅' : '❌'}`);
  
  if (healthOk && sseOk && mcpOk) {
    console.log('\n🎉 All tests passed! MCP integration is ready.');
  } else {
    console.log('\n⚠️ Some tests failed. Check MCP server configuration.');
  }
}

runTests().catch(console.error);
