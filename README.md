# kokoro-tts-mcp

**Cross-platform local text-to-speech MCP server.** Give your AI assistant a voice — on **Windows, macOS, and Linux**.

Powered by [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M). Free, fully offline, no API keys, no cloud calls.

[![CI](https://github.com/kalprajsolutions/kokoro-tts-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/kalprajsolutions/kokoro-tts-mcp/actions/workflows/ci.yml)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)](#platform-support)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-green)](https://nodejs.org)
[![MCP](https://img.shields.io/badge/Model-Context%20Protocol-purple)](https://modelcontextprotocol.io)

## What it does

Exposes two [Model Context Protocol](https://modelcontextprotocol.io) tools to any MCP-compatible AI client (Claude Code, ZCode, Cursor, Windsurf, Cline, ...):

| Tool | Purpose |
|---|---|
| `speak` | Converts text to speech and plays it through the speakers |
| `tts_config` | View or change settings: mute/unmute, auto-speak, voice, speed |

With **auto-speak** enabled, your assistant speaks every response aloud — hands-free operation for accessibility, multitasking, or just vibe.

## Features

- 🖥️ **Works everywhere** — Windows, macOS, and Linux (this is the main reason this fork exists; the original is macOS-only)
- 🔒 **100% local** — synthesis and playback happen on your machine, nothing leaves it
- 🆓 **Free** — Apache 2.0 licensed, no API keys, no subscriptions
- 🌍 **48 voices** — American/British English, Spanish, French, Hindi, Italian, Japanese, Portuguese, Mandarin
- ⚡ **Offline after setup** — the model is downloaded once, then everything runs locally
- 🗣️ **Auto-speak mode** — the assistant narrates every response automatically

## Requirements

| Requirement | Version | Notes |
|---|---|---|
| Node.js | 18+ | |
| Python | 3.10 – 3.12 | Needed for Kokoro inference ([python.org](https://www.python.org/downloads/)) |
| Disk space | ~1.5 GB | Model weights (~350 MB) + Python packages |
| Audio player | — | Built in on Windows (`PowerShell`) and macOS (`afplay`); Linux needs one of `paplay`, `pw-play`, `aplay`, or `ffplay` |

## Quick start

### 1. One-time initialization

Sets up an isolated Python environment (one-time). Model weights (~350 MB) download from Hugging Face on first use:

```bash
npx github:kalprajsolutions/kokoro-tts-mcp init
```

### 2. Add to your MCP client

**Claude Code:**

```bash
claude mcp add tts -- npx -y github:kalprajsolutions/kokoro-tts-mcp
```

**Generic MCP config** (ZCode, Cursor, Windsurf, Cline, Claude Desktop, ...):

```json
{
  "mcpServers": {
    "tts": {
      "command": "npx",
      "args": ["-y", "github:kalprajsolutions/kokoro-tts-mcp"],
      "env": {
        "TTS_VOICE": "af_heart",
        "TTS_SPEED": "1.0"
      }
    }
  }
}
```

> **Windows note:** if your client has trouble launching `npx` directly, use the `cmd.exe` wrapper that works everywhere:
>
> ```json
> {
>   "mcpServers": {
>     "tts": {
>       "command": "cmd.exe",
>       "args": ["/d", "/c", "npx", "-y", "github:kalprajsolutions/kokoro-tts-mcp"]
>     }
>   }
> }
> ```

### 3. Talk to your assistant

Try: *"Speak this: hello world"*, *"Mute TTS"*, *"Change voice to bf_emma"*, *"Turn on auto-speak"*.

## Voices

48 Kokoro voices. Prefix guide: `af`/`am` = American English, `bf`/`bm` = British English, `ef`/`em` = Spanish, `ff` = French, `hf`/`hm` = Hindi, `if`/`im` = Italian, `jf`/`jm` = Japanese, `pf`/`pm` = Portuguese, `zf` = Mandarin. `f` = female, `m` = male.

| Voice | Description |
|---|---|
| `af_heart` | American English female (Grade A, **recommended default**) |
| `af_bella` | American English female (Grade A-) |
| `bf_emma` | British English female (Grade B-) |
| `am_michael` | American English male (Grade C+) |
| `am_puck` | American English male (Grade C+) |
| `zf_xiaobei` | Mandarin Chinese female |

Full list: [Kokoro-82M VOICES.md](https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md)

## Configuration

Environment variables (optional, shown above in the MCP config):

| Variable | Default | Description |
|---|---|---|
| `TTS_VOICE` | `af_heart` | Default voice |
| `TTS_SPEED` | `1.0` | Playback speed 0.5 – 2.0 |
| `TTS_ENABLED` | `true` | Set `false` to start muted |
| `TTS_AUTO` | `false` | Set `true` to start with auto-speak on |
| `TTS_BASE_DIR` | `~/.kokoro-tts` | Data directory (venv, state) |

Runtime changes made through `tts_config` are persisted to `~/.kokoro-tts/state.json`.

## Platform support

| Platform | Audio playback | Setup notes |
|---|---|---|
| **Windows 10/11** | PowerShell `Media.SoundPlayer` (built in) | Install Python from [python.org](https://www.python.org/downloads/) with "Add python.exe to PATH" checked |
| **macOS** | `afplay` (built in) | Works out of the box |
| **Linux** | `paplay` (PulseAudio) → `pw-play` (PipeWire) → `aplay` (ALSA) → `ffplay`, first available is used | Install one player, e.g. `sudo apt install pulseaudio-utils` |

## Troubleshooting

**"Python 3.10–3.12 is required but not found"** — Install Python 3.10, 3.11, or 3.12 from [python.org](https://www.python.org/downloads/). On Windows, tick "Add python.exe to PATH" in the installer. Kokoro does not yet support Python 3.13+.

**Linux: "No audio player found"** — Install one of the supported players: `sudo apt install pulseaudio-utils` (paplay), `sudo apt install alsa-utils` (aplay), or `sudo apt install ffmpeg` (ffplay). On headless servers there may be no audio device; the generated WAV can still be inspected via the tool's error/duration output.

**Windows: init fails on pip path** — Use version ≥ 1.0.0 of this package (older versions of the original upstream had POSIX-only paths).

**First `speak` call is slow** — The Kokoro model weights are downloaded from Hugging Face on first use (~350 MB, cached in `~/.cache/huggingface`). Later calls are fast and fully offline.

**Model download fails / corporate proxy** — Set the standard `HTTPS_PROXY`/`HTTP_PROXY` environment variables, or pre-download via `huggingface-cli`.

## How it works

```
MCP client (Claude Code / ZCode / Cursor / ...)
        │  stdio (JSON-RPC)
        ▼
Node.js MCP server (this package)
        │  spawn                     │  platform dispatch
        ▼                            ▼
Python venv (Kokoro pipeline)     afplay / PowerShell /
  → generates 24 kHz WAV          SoundPlayer / paplay / aplay
```

## Credits & attribution

This project is a cross-platform fork of [claude-tts-mcp](https://www.npmjs.com/package/claude-tts-mcp) by [Mitch Hazelhurst](https://github.com/mitchthestonky) — thank you for the excellent original. Modified for Windows/macOS/Linux support by **[Kalpraj Solutions](https://github.com/kalprajsolutions)**; see [NOTICE](NOTICE) for the full change list.

- TTS model: [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) by hexgrad (Apache 2.0)

## Community

Questions, setup help, or ideas? Ask in [Discussions](https://github.com/kalprajsolutions/kokoro-tts-mcp/discussions). Bugs and reproducible problems go to [Issues](https://github.com/kalprajsolutions/kokoro-tts-mcp/issues/new?template=bug_report.yml).

## License

[Apache License 2.0](LICENSE) — free for personal and commercial use.
