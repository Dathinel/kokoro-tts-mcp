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
const init_1 = require("./init");
const command = process.argv[2];
if (command === "init") {
    (0, init_1.init)().catch((err) => {
        console.error("Init failed:", err.message);
        process.exit(1);
    });
}
else if (command === "--help" || command === "-h") {
    console.log(`kokoro-tts-mcp - Cross-platform local TTS (Windows, macOS, Linux)

Usage:
  kokoro-tts-mcp init    Set up Python environment for Kokoro TTS (one-time)
  kokoro-tts-mcp         Start MCP server (used by your MCP client)

Environment variables:
  TTS_VOICE      Kokoro voice ID (default: af_heart)
  TTS_SPEED      Playback speed 0.5-2.0 (default: 1.0)
  TTS_BASE_DIR   Override the data directory (default: ~/.kokoro-tts)
  TTS_ENABLED    Set to "false" to start muted

Voices:
  af_heart     American English female (Grade A, recommended)
  af_bella     American English female (Grade A-)
  bf_emma      British English female (Grade B-)
  am_michael   American English male (Grade C+)
  am_puck      American English male (Grade C+)
  zf_xiaobei   Mandarin Chinese female

  Full list: https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md

Audio playback per platform:
  macOS    afplay (built in)
  Windows  PowerShell Media.SoundPlayer (built in)
  Linux    paplay / pw-play / aplay / ffplay (first available)`);
}
else {
    // Default: start MCP server
    require("./index");
}
