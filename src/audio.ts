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
import { spawn, spawnSync } from "child_process";
import * as fs from "fs";

interface PlayerSpec {
    command: string;
    /** Full argument list to play the given WAV file. */
    args: (wavPath: string) => string[];
}

const WINDOWS_PLAYER: PlayerSpec = {
    command: "powershell.exe",
    args: (wavPath) => [
        "-NoProfile",
        "-Command",
        // Single-quoted PowerShell string: double any embedded single quotes.
        `(New-Object Media.SoundPlayer '${wavPath.replace(/'/g, "''")}').PlaySync()`,
    ],
};

const MACOS_PLAYERS: PlayerSpec[] = [{ command: "afplay", args: (w) => [w] }];

const LINUX_PLAYERS: PlayerSpec[] = [
    { command: "paplay", args: (w) => [w] }, // PulseAudio
    { command: "pw-play", args: (w) => [w] }, // PipeWire
    { command: "aplay", args: (w) => [w] }, // ALSA
    {
        command: "ffplay",
        args: (w) => ["-autoexit", "-nodisp", "-loglevel", "error", w],
    },
];

function playersForPlatform(): PlayerSpec[] {
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
function isAvailable(spec: PlayerSpec): boolean {
    if (process.platform === "win32" || process.platform === "darwin") {
        return true; // powershell.exe / afplay ship with the OS
    }
    try {
        const res = spawnSync("which", [spec.command], { encoding: "utf-8" });
        return res.status === 0;
    } catch {
        return false;
    }
}

function playWith(spec: PlayerSpec, wavPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const proc = spawn(spec.command, spec.args(wavPath));
        proc.on("close", (code) => {
            // Clean up temp file
            try {
                fs.unlinkSync(wavPath);
            } catch {
                // ignore cleanup errors
            }
            if (code !== 0) {
                reject(new Error(`${spec.command} failed with exit code ${code}`));
            } else {
                resolve();
            }
        });
        proc.on("error", (err) => {
            reject(err);
        });
    });
}

const LINUX_HINT =
    "No audio player found on this system. Install one of: " +
    "paplay (PulseAudio), pw-play (PipeWire), aplay (ALSA utils), or ffmpeg/ffplay. " +
    "Example: sudo apt install pulseaudio-utils";

export async function playAudio(wavPath: string): Promise<void> {
    const candidates = playersForPlatform().filter(isAvailable);
    if (candidates.length === 0) {
        throw new Error(LINUX_HINT);
    }
    let lastError: Error | null = null;
    for (const spec of candidates) {
        try {
            await playWith(spec, wavPath);
            return;
        } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
            // ENOENT (binary vanished between probe and spawn): try the next player.
        }
    }
    throw new Error(
        `Failed to play audio: ${lastError?.message ?? "unknown error"}` +
            (process.platform === "linux" ? `. ${LINUX_HINT}` : "")
    );
}
