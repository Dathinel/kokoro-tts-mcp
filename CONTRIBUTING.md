# Contributing

Thanks for helping make kokoro-tts-mcp better. Questions and ideas belong in [Discussions](https://github.com/kalprajsolutions/kokoro-tts-mcp/discussions); bugs go to [Issues](https://github.com/kalprajsolutions/kokoro-tts-mcp/issues).

## Setup

You need Node.js 18+. Python 3.10-3.12 is only needed if you want to actually run TTS locally.

```bash
git clone https://github.com/kalprajsolutions/kokoro-tts-mcp
cd kokoro-tts-mcp
npm install
npm run build
```

## Check your change

CI (`.github/workflows/ci.yml`) runs the same commands:

```bash
npm run build
node dist/cli.js --help
```

Smoke test the MCP server by hand with an initialize request:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"dev","version":"0"}}}' | node dist/cli.js
```

You should get back a JSON result with `serverInfo.name` = `kokoro-tts-mcp`. Press Ctrl+C to stop the server.

## Pull requests

1. Keep the diff focused on one change.
2. Run the checks above and make sure they pass.
3. Open a PR against `main` describing what changed and why.
