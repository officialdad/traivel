import type { Env } from './types';
import { handleApiRequest } from './api/router';
import { createMcpServer } from './mcp/server';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

async function handleMcpRequest(request: Request, db: D1Database): Promise<Response> {
  // Only accept POST for JSON-RPC
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed. Use POST for MCP JSON-RPC.' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const mcpServer = createMcpServer(db);

  // Use in-memory transport to handle stateless JSON-RPC
  const { InMemoryTransport } = await import('@modelcontextprotocol/sdk/inMemory.js');
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  await mcpServer.connect(serverTransport);

  const body = await request.json();

  // Send the JSON-RPC message through the client side and collect the response
  const responsePromise = new Promise<unknown>((resolve) => {
    clientTransport.onmessage = (message: unknown) => {
      resolve(message);
    };
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await clientTransport.send(body as any);
  const response = await responsePromise;

  await mcpServer.close();

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export default {
  async fetch(
    request: Request,
    env: Env,
    _ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // API routes
    if (path.startsWith('/api/')) {
      const response = await handleApiRequest(request, env);
      const headers = new Headers(response.headers);
      headers.set('Access-Control-Allow-Origin', '*');
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }

    // MCP endpoint
    if (path === '/mcp' || path.startsWith('/mcp/')) {
      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, mcp-session-id',
          },
        });
      }

      return handleMcpRequest(request, env.DB);
    }

    // Static assets served automatically by [assets] binding
    return env.ASSETS.fetch(request);
  },
};
