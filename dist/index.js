#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * kokoro-tts-mcp — cross-platform local TTS MCP server.
 *
 * Based on claude-tts-mcp by Mitch Hazelhurst (Apache-2.0),
 * https://www.npmjs.com/package/claude-tts-mcp — modified by Kalpraj Solutions
 * for Windows, macOS, and Linux support. See NOTICE for details.
 */
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const server_1 = require("./server");
async function main() {
    const server = (0, server_1.createServer)();
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
}
main().catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
});
