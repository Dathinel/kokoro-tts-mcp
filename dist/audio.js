"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.playAudio = playAudio;
/**
 * kokoro-tts-mcp — cross-platform local TTS MCP server.
 *
 * Based on claude-tts-mcp by Mitch Hazelhurst (Apache-2.0),
 * https://www.npmjs.com/package/claude-tts-mcp — modified by Kalpraj Solutions
 * for Windows, macOS, and Linux support. See NOTICE for details.
 *
 * Audio playback uses the native player for each platform:
 *   - macOS:   afplay (built in)
 *   - Windows: PowerShell Media.SoundPlayer (built in)
 *   - Linux:   paplay / pw-play / aplay / ffplay (first one available)
 */
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const WINDOWS_PLAYER = {
    command: "powershell.exe",
    args: (wavPath) => [
        "-NoProfile",
        "-Command",
        // Single-quoted PowerShell string: double any embedded single quotes.
        `(New-Object Media.SoundPlayer '${wavPath.replace(/'/g, "''")}').PlaySync()`,
    ],
};
const MACOS_PLAYERS = [{ command: "afplay", args: (w) => [w] }];
const LINUX_PLAYERS = [
    { command: "paplay", args: (w) => [w] }, // PulseAudio
    { command: "pw-play", args: (w) => [w] }, // PipeWire
    { command: "aplay", args: (w) => [w] }, // ALSA
    {
        command: "ffplay",
        args: (w) => ["-autoexit", "-nodisp", "-loglevel", "error", w],
    },
];
function playersForPlatform() {
    switch (process.platform) {
        case "win32":
            return [WINDOWS_PLAYER];
        case "darwin":
            return MACOS_PLAYERS;
        default:
            return LINUX_PLAYERS;
    }
}
/** Whether a player binary exists on PATH (skipped for built-in platform players). */
function isAvailable(spec) {
    if (process.platform === "win32" || process.platform === "darwin") {
        return true; // powershell.exe / afplay ship with the OS
    }
    try {
        const res = (0, child_process_1.spawnSync)("which", [spec.command], { encoding: "utf-8" });
        return res.status === 0;
    }
    catch {
        return false;
    }
}
function playWith(spec, wavPath) {
    return new Promise((resolve, reject) => {
        const proc = (0, child_process_1.spawn)(spec.command, spec.args(wavPath));
        proc.on("close", (code) => {
            // Clean up temp file
            try {
                fs.unlinkSync(wavPath);
            }
            catch {
                // ignore cleanup errors
            }
            if (code !== 0) {
                reject(new Error(`${spec.command} failed with exit code ${code}`));
            }
            else {
                resolve();
            }
        });
        proc.on("error", (err) => {
            reject(err);
        });
    });
}
const LINUX_HINT = "No audio player found on this system. Install one of: " +
    "paplay (PulseAudio), pw-play (PipeWire), aplay (ALSA utils), or ffmpeg/ffplay. " +
    "Example: sudo apt install pulseaudio-utils";
async function playAudio(wavPath) {
    const candidates = playersForPlatform().filter(isAvailable);
    if (candidates.length === 0) {
        throw new Error(LINUX_HINT);
    }
    let lastError = null;
    for (const spec of candidates) {
        try {
            await playWith(spec, wavPath);
            return;
        }
        catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
            // ENOENT (binary vanished between probe and spawn): try the next player.
        }
    }
    throw new Error(`Failed to play audio: ${lastError?.message ?? "unknown error"}` +
        (process.platform === "linux" ? `. ${LINUX_HINT}` : ""));
}
