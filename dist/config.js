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
exports.VOICES = void 0;
exports.loadState = loadState;
exports.saveState = saveState;
exports.loadConfig = loadConfig;
exports.venvPythonPath = venvPythonPath;
exports.venvPipPath = venvPipPath;
/**
 * kokoro-tts-mcp — cross-platform local TTS MCP server.
 *
 * Based on claude-tts-mcp by Mitch Hazelhurst (Apache-2.0),
 * https://www.npmjs.com/package/claude-tts-mcp — modified by Kalpraj Solutions
 * for Windows, macOS, and Linux support. See NOTICE for details.
 */
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const fs = __importStar(require("fs"));
exports.VOICES = [
    // American English (female)
    "af_alloy", "af_aoede", "af_bella", "af_heart", "af_jessica",
    "af_kore", "af_nicole", "af_nova", "af_river", "af_sarah", "af_sky",
    // American English (male)
    "am_adam", "am_echo", "am_eric", "am_fenrir", "am_liam",
    "am_michael", "am_onyx", "am_puck", "am_santa",
    // British English (female)
    "bf_alice", "bf_emma", "bf_isabella", "bf_lily",
    // British English (male)
    "bm_daniel", "bm_fable", "bm_george", "bm_lewis",
    // Spanish
    "ef_dora", "em_alex", "em_santa",
    // French
    "ff_siwis",
    // Hindi
    "hf_alpha", "hf_beta", "hm_omega", "hm_psi",
    // Italian
    "if_sara", "im_nicola",
    // Japanese
    "jf_alpha", "jf_gongitsune", "jf_nezumi", "jf_tebukuro", "jm_kumo",
    // Portuguese
    "pf_dora", "pm_alex", "pm_santa",
    // Mandarin Chinese
    "zf_xiaobei", "zf_xiaoni", "zf_xiaoxiao", "zf_xiaoyi",
];
function statePath(baseDir) {
    return path.join(baseDir, "state.json");
}
function loadState(baseDir) {
    const defaults = {
        enabled: process.env.TTS_ENABLED !== "false",
        auto: process.env.TTS_AUTO === "true",
        voice: process.env.TTS_VOICE || "af_heart",
        speed: Math.max(0.5, Math.min(2.0, parseFloat(process.env.TTS_SPEED || "1.0") || 1.0)),
    };
    const file = statePath(baseDir);
    try {
        const raw = JSON.parse(fs.readFileSync(file, "utf-8"));
        return {
            enabled: typeof raw.enabled === "boolean" ? raw.enabled : defaults.enabled,
            auto: typeof raw.auto === "boolean" ? raw.auto : defaults.auto,
            voice: exports.VOICES.includes(raw.voice) ? raw.voice : defaults.voice,
            speed: typeof raw.speed === "number" ? Math.max(0.5, Math.min(2.0, raw.speed)) : defaults.speed,
        };
    }
    catch {
        return defaults;
    }
}
function saveState(baseDir, state) {
    const file = statePath(baseDir);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(state, null, 2) + "\n");
}
function loadConfig() {
    const baseDir = process.env.TTS_BASE_DIR || path.join(os.homedir(), ".kokoro-tts");
    const state = loadState(baseDir);
    return {
        voice: state.voice,
        speed: state.speed,
        baseDir,
        venvDir: path.join(baseDir, "venv"),
        modelDir: path.join(baseDir, "models"),
        pythonDir: path.join(__dirname, "..", "python"),
    };
}
/** Platform-aware path to the Python interpreter inside the venv. */
function venvPythonPath(config) {
    return process.platform === "win32"
        ? path.join(config.venvDir, "Scripts", "python.exe")
        : path.join(config.venvDir, "bin", "python");
}
/** Platform-aware path to pip inside the venv. */
function venvPipPath(config) {
    return process.platform === "win32"
        ? path.join(config.venvDir, "Scripts", "pip.exe")
        : path.join(config.venvDir, "bin", "pip");
}
