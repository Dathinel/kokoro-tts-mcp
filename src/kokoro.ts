/**
 * kokoro-tts-mcp — cross-platform local TTS MCP server.
 *
 * Based on claude-tts-mcp by Mitch Hazelhurst (Apache-2.0),
 * https://www.npmjs.com/package/claude-tts-mcp — modified by Kalpraj Solutions
 * for Windows, macOS, and Linux support. See NOTICE for details.
 */
import { spawn } from "child_process";
import * as path from "path";
import * as fs from "fs";
import { v4 as uuidv4 } from "uuid";
import * as os from "os";
import { TtsConfig, venvPythonPath } from "./config";

export function isInitialized(config: TtsConfig): boolean {
    return fs.existsSync(venvPythonPath(config));
}

export async function speak(
    text: string,
    voice: string,
    speed: number,
    config: TtsConfig
): Promise<{ wavPath: string; duration: number }> {
    const pythonBin = venvPythonPath(config);
    const speakScript = path.join(config.pythonDir, "speak.py");
    const wavPath = path.join(os.tmpdir(), `kokoro-tts-${uuidv4()}.wav`);
    if (!fs.existsSync(pythonBin)) {
        throw new Error(
            "Kokoro not initialized. Run: npx github:kalprajsolutions/kokoro-tts-mcp init"
        );
    }
    return new Promise((resolve, reject) => {
        const proc = spawn(pythonBin, [
            speakScript,
            "--text", text,
            "--voice", voice,
            "--speed", speed.toString(),
            "--output", wavPath,
            "--model-dir", config.modelDir,
        ]);
        let stdout = "";
        let stderr = "";
        proc.stdout.on("data", (data) => {
            stdout += data.toString();
        });
        proc.stderr.on("data", (data) => {
            stderr += data.toString();
        });
        proc.on("close", (code) => {
            if (code !== 0) {
                reject(new Error(`Kokoro failed: ${stderr.trim() || `exit code ${code}`}`));
                return;
            }
            const match = stdout.match(/OK duration=([\d.]+)/);
            const duration = match ? parseFloat(match[1]) : 0;
            resolve({ wavPath, duration });
        });
        proc.on("error", (err) => {
            reject(new Error(`Failed to spawn Python: ${err.message}`));
        });
    });
}
