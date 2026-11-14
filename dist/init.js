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
exports.init = init;
/**
 * kokoro-tts-mcp — cross-platform local TTS MCP server.
 *
 * Based on claude-tts-mcp by Mitch Hazelhurst (Apache-2.0),
 * https://www.npmjs.com/package/claude-tts-mcp — modified by Kalpraj Solutions
 * for Windows, macOS, and Linux support. See NOTICE for details.
 */
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const config_1 = require("./config");
const MIN_MAJOR = 3;
const MIN_MINOR = 10;
const MAX_MINOR = 12;
/**
 * Find a suitable Python 3.10–3.12 interpreter.
 * On Windows, the Microsoft Store "python3" alias stub is avoided by design.
 */
function findPython() {
    const candidates = process.platform === "win32"
        ? ["python", "py"]
        : ["python3.12", "python3.11", "python3.10", "python3", "python"];
    for (const cmd of candidates) {
        try {
            const result = (0, child_process_1.spawnSync)(cmd, ["--version"], { encoding: "utf-8" });
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
        }
        catch {
            continue;
        }
    }
    throw new Error("Python 3.10–3.12 is required but not found. Install it from https://python.org " +
        "(on Windows, check 'Add python.exe to PATH' during installation).");
}
async function init() {
    const config = (0, config_1.loadConfig)();
    console.log("kokoro-tts-mcp init");
    console.log("===================\n");
    // 1. Find Python
    console.log("Checking Python...");
    const python = findPython();
    const pyVersion = (0, child_process_1.spawnSync)(python, ["--version"], { encoding: "utf-8" });
    console.log(`  Found: ${(pyVersion.stdout || pyVersion.stderr).trim()}\n`);
    // 2. Create base directory
    if (!fs.existsSync(config.baseDir)) {
        fs.mkdirSync(config.baseDir, { recursive: true });
        console.log(`Created: ${config.baseDir}`);
    }
    // 3. Create venv
    console.log("Creating Python virtual environment...");
    if (fs.existsSync((0, config_1.venvPythonPath)(config))) {
        console.log("  Venv already exists, skipping.\n");
    }
    else {
        (0, child_process_1.execSync)(`"${python}" -m venv "${config.venvDir}"`, { stdio: "inherit" });
        console.log(`  Created: ${config.venvDir}\n`);
    }
    // 4. Install dependencies
    console.log("Installing Kokoro TTS...");
    const pip = (0, config_1.venvPipPath)(config);
    const requirementsFile = path.join(config.pythonDir, "requirements.txt");
    (0, child_process_1.execSync)(`"${pip}" install -r "${requirementsFile}"`, {
        stdio: "inherit",
    });
    console.log("");
    // 5. Verify installation
    console.log("Verifying installation...");
    const venvPython = (0, config_1.venvPythonPath)(config);
    const verify = (0, child_process_1.spawnSync)(venvPython, ["-c", "from kokoro import KPipeline; print('OK')"], { encoding: "utf-8" });
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
    console.log(JSON.stringify({
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
    }, null, 2));
    console.log("");
}
