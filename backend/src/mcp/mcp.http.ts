import express from 'express';
import type { Express, Request, Response } from 'express';
import { mcpAuthRouter } from '@modelcontextprotocol/sdk/server/auth/router.js';
import { requireBearerAuth } from '@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { McpOAuthProvider } from './mcp-oauth.provider';
import { buildMcpServer, type McpDeps } from './mcp-tools';

/** Mount the OAuth 2.1 AS + Streamable HTTP MCP transport on the raw Express instance. */
export function mountMcp(app: Express, opts: { provider: McpOAuthProvider; deps: McpDeps; publicUrl: string }): void {
  const issuer = new URL(opts.publicUrl);
  const resource = new URL('/mcp', issuer);

  // Custom login POST from the /authorize consent page
  app.post('/mcpauth/login', express.urlencoded({ extended: true }), (req, res) => {
    void opts.provider.handleLogin(req, res).catch(() => {
      if (!res.headersSent) res.status(500).send('login error');
    });
  });

  // OAuth 2.1 endpoints (/authorize /token /register /revoke) + discovery (.well-known)
  app.use(
    mcpAuthRouter({
      provider: opts.provider,
      issuerUrl: issuer,
      resourceServerUrl: resource,
      scopesSupported: ['mcp'],
      resourceName: 'PMN Digital MCP',
    }),
  );

  // Require a valid bearer token on the MCP resource (emits 401 + WWW-Authenticate)
  app.use(
    '/mcp',
    requireBearerAuth({
      verifier: opts.provider,
      resourceMetadataUrl: new URL('/.well-known/oauth-protected-resource/mcp', issuer).href,
    }),
  );

  // Stateless Streamable HTTP (fresh server+transport per request → survives redeploys / multi-replica)
  app.post('/mcp', async (req: Request, res: Response) => {
    try {
      const server = buildMcpServer(opts.deps);
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
      res.on('close', () => {
        void transport.close();
        void server.close();
      });
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch {
      if (!res.headersSent) {
        res.status(500).json({ jsonrpc: '2.0', error: { code: -32603, message: 'Internal error' }, id: null });
      }
    }
  });
  app.get('/mcp', (_req: Request, res: Response) => {
    res.status(405).set('Allow', 'POST').end();
  });
  app.delete('/mcp', (_req: Request, res: Response) => {
    res.status(405).set('Allow', 'POST').end();
  });
}
