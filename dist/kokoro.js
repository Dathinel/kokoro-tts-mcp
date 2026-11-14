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
exports.isInitialized = isInitialized;
exports.speak = speak;
/**
 * kokoro-tts-mcp — cross-platform local TTS MCP server.
 *
 * Based on claude-tts-mcp by Mitch Hazelhurst (Apache-2.0),
 * https://www.npmjs.com/package/claude-tts-mcp — modified by Kalpraj Solutions
 * for Windows, macOS, and Linux support. See NOTICE for details.
 */
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const uuid_1 = require("uuid");
const os = __importStar(require("os"));
const config_1 = require("./config");
function isInitialized(config) {
    return fs.existsSync((0, config_1.venvPythonPath)(config));
}
async function speak(text, voice, speed, config) {
    const pythonBin = (0, config_1.venvPythonPath)(config);
    const speakScript = path.join(config.pythonDir, "speak.py");
    const wavPath = path.join(os.tmpdir(), `kokoro-tts-${(0, uuid_1.v4)()}.wav`);
    if (!fs.existsSync(pythonBin)) {
        throw new Error("Kokoro not initialized. Run: npx github:kalprajsolutions/kokoro-tts-mcp init");
    }
    return new Promise((resolve, reject) => {
        const proc = (0, child_process_1.spawn)(pythonBin, [
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
