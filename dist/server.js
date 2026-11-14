"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServer = createServer;
/**
 * kokoro-tts-mcp — cross-platform local TTS MCP server.
 *
 * Based on claude-tts-mcp by Mitch Hazelhurst (Apache-2.0),
 * https://www.npmjs.com/package/claude-tts-mcp — modified by Kalpraj Solutions
 * for Windows, macOS, and Linux support. See NOTICE for details.
 */
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
// Import the zod v3 subpath: the MCP SDK's zod-compat layer types its tool
// schemas as zod/v3, and the root "zod" entry in zod@3.25 is a distinct type
// identity (importing it here causes TS2589 deep-instantiation failures).
const v3_1 = require("zod/v3");
const config_1 = require("./config");
const kokoro_1 = require("./kokoro");
const audio_1 = require("./audio");
/** Runtime voice validation (kept out of the JSON schema to avoid huge enums). */
function invalidVoiceResponse(voice) {
    return {
        content: [
            {
                type: "text",
                text: `Unknown voice "${voice}". Valid voices: ${config_1.VOICES.join(", ")}`,
            },
        ],
        isError: true,
    };
}
function formatStatus(state) {
    const lines = [
        `enabled: ${state.enabled}`,
        `auto-speak: ${state.auto}`,
        `voice: ${state.voice}`,
        `speed: ${state.speed}x`,
    ];
    return lines.join("\n");
}
function autoSpeakHint(state) {
    if (state.auto) {
        return "\n\nIMPORTANT: Auto-speak is ON. You MUST call the speak tool with your response text for EVERY response from now on, including this one. Do NOT skip any response. Always call speak AFTER generating your text response.";
    }
    return "";
}
// Shapes are declared as standalone ZodRawShapes: declaring them inline at the
// server.tool() call site triggers TS2589 (excessively deep type instantiation)
// in the MCP SDK's type-level JSON-schema inference.
const configShape = {
    enabled: v3_1.z.boolean().optional().describe("true to enable TTS, false to disable (mute/unmute)"),
    auto: v3_1.z
        .boolean()
        .optional()
        .describe("true = Claude should call speak on every response automatically. false = only speak when explicitly asked."),
    voice: v3_1.z
        .string()
        .optional()
        .describe("Kokoro voice ID. Prefix guide: af/am=American English, bf/bm=British English, ef/em=Spanish, ff=French, hf/hm=Hindi, if/im=Italian, jf/jm=Japanese, pf/pm=Portuguese, zf=Mandarin. f=female, m=male."),
    speed: v3_1.z
        .number()
        .min(0.5)
        .max(2.0)
        .optional()
        .describe("Playback speed multiplier (0.5 to 2.0, default 1.0)"),
};
const speakShape = {
    text: v3_1.z.string().describe("The text to speak aloud"),
    voice: v3_1.z
        .string()
        .optional()
        .describe("Override voice for this call. Prefix guide: af/am=American English, bf/bm=British English, ef/em=Spanish, ff=French, hf/hm=Hindi, if/im=Italian, jf/jm=Japanese, pf/pm=Portuguese, zf=Mandarin."),
    speed: v3_1.z
        .number()
        .min(0.5)
        .max(2.0)
        .optional()
        .describe("Override speed for this call (0.5 to 2.0)"),
};
function createServer() {
    const config = (0, config_1.loadConfig)();
    const state = (0, config_1.loadState)(config.baseDir);
    const server = new mcp_js_1.McpServer({
        name: "kokoro-tts-mcp",
        version: "1.0.0",
    });
    server.tool("tts_config", "View or change TTS settings. Call with no parameters to see current config. Use to: enable/disable TTS, turn auto-speak on/off (auto-speak makes Claude speak every response), change voice, change speed. When the user says 'mute tts', 'unmute tts', 'tts on', 'tts off', 'stop speaking', 'start speaking', 'auto speak', 'speak all responses', 'change voice', or 'change speed' — use this tool.", configShape, async ({ enabled, auto, voice, speed }) => {
        const noParams = enabled === undefined &&
            auto === undefined &&
            voice === undefined &&
            speed === undefined;
        if (voice !== undefined && !config_1.VOICES.includes(voice)) {
            return invalidVoiceResponse(voice);
        }
        if (noParams) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Current TTS config:\n${formatStatus(state)}`,
                    },
                ],
            };
        }
        if (enabled !== undefined)
            state.enabled = enabled;
        if (auto !== undefined)
            state.auto = auto;
        if (voice !== undefined)
            state.voice = voice;
        if (speed !== undefined)
            state.speed = speed;
        (0, config_1.saveState)(config.baseDir, state);
        return {
            content: [
                {
                    type: "text",
                    text: `TTS config updated:\n${formatStatus(state)}${autoSpeakHint(state)}`,
                },
            ],
        };
    });
    server.tool("speak", "Convert text to speech and play it through speakers using Kokoro TTS (local, free, no API key needed). IMPORTANT: If auto-speak is enabled (check via tts_config), you MUST call this tool with your full response text for EVERY response, no exceptions. Never skip calling speak when auto-speak is ON.", speakShape, async ({ text, voice, speed }) => {
        if (!state.enabled) {
            return {
                content: [
                    {
                        type: "text",
                        text: "TTS is muted. Say 'unmute tts' or 'tts on' to enable.",
                    },
                ],
            };
        }
        if (!(0, kokoro_1.isInitialized)(config)) {
            return {
                content: [
                    {
                        type: "text",
                        text: "Kokoro TTS is not initialized. Run: npx github:kalprajsolutions/kokoro-tts-mcp init",
                    },
                ],
            };
        }
        const resolvedVoice = voice || state.voice;
        const resolvedSpeed = speed || state.speed;
        if (!config_1.VOICES.includes(resolvedVoice)) {
            return invalidVoiceResponse(resolvedVoice);
        }
        try {
            const result = await (0, kokoro_1.speak)(text, resolvedVoice, resolvedSpeed, config);
            await (0, audio_1.playAudio)(result.wavPath);
            const hint = state.auto
                ? " [Auto-speak is ON — remember to call speak for your next response too.]"
                : "";
            return {
                content: [
                    {
                        type: "text",
                        text: `Spoke ${result.duration.toFixed(1)}s of audio using voice "${resolvedVoice}" at ${resolvedSpeed}x speed.${hint}`,
                    },
                ],
            };
        }
        catch (err) {
            const message = err instanceof Error ? err.message : "Unknown error";
            return {
                content: [
                    {
                        type: "text",
                        text: `TTS error: ${message}`,
                    },
                ],
                isError: true,
            };
        }
    });
    return server;
}
