# MCP Server Configuration for Blockpool Project in Windsurf

## Overview
This guide helps you configure the MCP (Model Context Protocol) server for the Blockpool project in Windsurf, enabling AI-powered blockchain analysis with real SEI network data.

## Configuration Options

### Option 1: Production Server (Recommended)
Uses the deployed MCP server at `https://sei-mcp-server-1.onrender.com`

### Option 2: Local Development
Runs the MCP server locally for development and testing

### Option 3: NPX Command
Uses the official SEI MCP server package via NPX

## Setup Instructions

### 1. Windsurf MCP Configuration

The MCP configuration file has been created at:
```
.windsurf/mcp.json
```

This file contains three server configurations:
- **blockpool-sei-mcp**: NPX-based local server
- **blockpool-sei-http**: Production HTTP/SSE server
- **blockpool-sei-local**: Local development server

### 2. Windsurf Settings Configuration

To enable MCP in Windsurf:

1. Open Windsurf Settings (Ctrl+,)
2. Search for "MCP" in settings
3. Enable "MCP Servers"
4. Add the server configurations from the mcp.json file

### 3. Environment Variables (Optional)

For enhanced functionality, create a `.env` file in your project root:

```env
# SEI Network Configuration
SEI_RPC_URL=https://sei-rpc.polkachu.com
SEI_REST_URL=https://sei-api.polkachu.com

# MCP Server Configuration
VITE_MCP_SERVER_URL=https://sei-mcp-server-1.onrender.com
MCP_SERVER_PORT=3001

# Debug Mode
VITE_DEBUG=false
```

### 4. Testing MCP Connection

You can test the MCP server connection using the test script:

```bash
node test-mcp-connection.js
```

Or test specific wallet analysis:

```bash
node test-evm-wallet.js
```

## Usage in Windsurf

Once configured, you can use natural language commands in Windsurf:

### Wallet Analysis
- "Analyze wallet sei1abc123... using the MCP server"
- "Check the balance of 0x742d35cc6ad4a8f7c2a8d8b6c4e8f9a1b2c3d4e5"
- "Show me the transaction history for this wallet"

### Transaction Lookup
- "Look up transaction hash 0x1234567890abcdef..."
- "Explain this transaction: [hash]"
- "Check transaction status for [hash]"

### Network Information
- "What's the latest block on SEI?"
- "Show me current network status"
- "Get chain information"

### Market Data
- "What's the current SEI price?"
- "Show me SEI market data"
- "Get token information for SEI"

## Troubleshooting

### Common Issues

1. **Connection Timeout**
   - Check if the MCP server URL is accessible
   - Verify network connectivity
   - Try switching between production and local servers

2. **Authentication Errors**
   - Check environment variables are loaded

3. **CORS Issues**
   - The production server has CORS configured for cross-origin requests
   - Local development may require additional CORS setup

### Debug Mode

Enable debug mode by setting:
```env
VITE_DEBUG=true
```

This will show detailed logs in the browser console and Windsurf output.

## Server Endpoints

### Production Server: `https://sei-mcp-server-1.onrender.com`
- Health Check: `/health`
- SSE Endpoint: `/sse`
- Messages: `/messages`

### Local Server: `http://localhost:3001`
- Same endpoints as production
- Requires local MCP server to be running

## Integration with Blockpool AI Assistant

The Blockpool AI Assistant automatically uses the configured MCP server for:
- Real-time wallet analysis
- Transaction lookups
- Network status checks
- Market data retrieval

The assistant will show connection status and data sources for transparency.

## Next Steps

1. Configure Windsurf with the MCP settings
2. Test the connection using the provided test scripts
3. Try wallet analysis queries in the Blockpool AI Assistant
4. Monitor connection status in the dashboard

## Support

If you encounter issues:
1. Check the MCP server health endpoint
2. Review browser console for errors
3. Verify environment variables are set correctly
4. Test with different server configurations (production vs local)
