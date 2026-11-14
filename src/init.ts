/**
 * kokoro-tts-mcp — cross-platform local TTS MCP server.
 *
 * Based on claude-tts-mcp by Mitch Hazelhurst (Apache-2.0),
 * https://www.npmjs.com/package/claude-tts-mcp — modified by Kalpraj Solutions
 * for Windows, macOS, and Linux support. See NOTICE for details.
 */
import { spawnSync, execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { loadConfig, venvPipPath, venvPythonPath } from "./config";

const MIN_MAJOR = 3;
const MIN_MINOR = 10;
const MAX_MINOR = 12;

/**
 * Find a suitable Python 3.10–3.12 interpreter.
 * On Windows, the Microsoft Store "python3" alias stub is avoided by design.
 */
function findPython(): string {
    const candidates =
        process.platform === "win32"
            ? ["python", "py"]
            : ["python3.12", "python3.11", "python3.10", "python3", "python"];
    for (const cmd of candidates) {
        try {
            const result = spawnSync(cmd, ["--version"], { encoding: "utf-8" });
            if (result.status === 0) {
                const version = result.stdout.trim() || result.stderr.trim();
                const match = version.match(/(\d+)\.(\d+)/);
                if (match) {
                    const major = parseInt(match[1]);
                    const minor = parseInt(match[2]);
                    if (major === MIN_MAJOR && minor >= MIN_MINOR && minor <= MAX_MINOR) {
                        return cmd;
                    }
                }
            }
        } catch {
            continue;
        }
    }
    throw new Error(
        "Python 3.10–3.12 is required but not found. Install it from https://python.org " +
            "(on Windows, check 'Add python.exe to PATH' during installation)."
    );
}

export async function init(): Promise<void> {
    const config = loadConfig();
    console.log("kokoro-tts-mcp init");
    console.log("===================\n");

    // 1. Find Python
    console.log("Checking Python...");
    const python = findPython();
    const pyVersion = spawnSync(python, ["--version"], { encoding: "utf-8" });
    console.log(`  Found: ${(pyVersion.stdout || pyVersion.stderr).trim()}\n`);

    // 2. Create base directory
    if (!fs.existsSync(config.baseDir)) {
        fs.mkdirSync(config.baseDir, { recursive: true });
        console.log(`Created: ${config.baseDir}`);
    }

    // 3. Create venv
    console.log("Creating Python virtual environment...");
    if (fs.existsSync(venvPythonPath(config))) {
        console.log("  Venv already exists, skipping.\n");
    } else {
        execSync(`"${python}" -m venv "${config.venvDir}"`, { stdio: "inherit" });
        console.log(`  Created: ${config.venvDir}\n`);
    }

    // 4. Install dependencies
    console.log("Installing Kokoro TTS...");
    const pip = venvPipPath(config);
    const requirementsFile = path.join(config.pythonDir, "requirements.txt");
    execSync(`"${pip}" install -r "${requirementsFile}"`, {
        stdio: "inherit",
    });
    console.log("");

    // 5. Verify installation
    console.log("Verifying installation...");
    const venvPython = venvPythonPath(config);
    const verify = spawnSync(
        venvPython,
        ["-c", "from kokoro import KPipeline; print('OK')"],
        { encoding: "utf-8" }
    );
    if (verify.status !== 0) {
        console.error("  Verification failed:", verify.stderr);
        process.exit(1);
    }
    console.log("  Kokoro TTS installed successfully.\n");

    // 6. Print config
    console.log("Setup complete!\n");
    console.log("Add this to your MCP client config:\n");
    console.log("  Claude Code:  claude mcp add tts -- npx github:kalprajsolutions/kokoro-tts-mcp\n");
    console.log("Or add manually:\n");
    console.log(
        JSON.stringify(
            {
                mcpServers: {
                    tts: {
                        command: "npx",
                        args: ["-y", "github:kalprajsolutions/kokoro-tts-mcp"],
                        env: {
                            TTS_VOICE: "af_heart",
                            TTS_SPEED: "1.0",
                        },
                    },
                },
            },
            null,
            2
        )
    );
    console.log("");
}
