# Changelog

All notable changes to this project are documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org).

## [1.0.0] - 2026-11-14

First release. A cross-platform fork of [claude-tts-mcp](https://www.npmjs.com/package/claude-tts-mcp) by Mitch Hazelhurst (Apache-2.0); see [NOTICE](NOTICE) for the full change list.

### Added

- Windows, macOS, and Linux support (the original is macOS-only)
- `speak` MCP tool: converts text to speech and plays it through the speakers
- `tts_config` MCP tool: mute/unmute, auto-speak, voice, and speed settings, persisted to `~/.kokoro-tts/state.json`
- Auto-speak mode: the assistant narrates every response automatically
- 48 Kokoro-82M voices across 9 languages
- `kokoro-tts-mcp init` one-time setup command (Python venv + Kokoro install)
- Per-platform audio playback: PowerShell `Media.SoundPlayer` (Windows), `afplay` (macOS), `paplay`/`pw-play`/`aplay`/`ffplay` (Linux)
