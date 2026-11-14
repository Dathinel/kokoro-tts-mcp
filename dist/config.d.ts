export declare const VOICES: string[];
export interface TtsState {
    enabled: boolean;
    auto: boolean;
    voice: string;
    speed: number;
}
export interface TtsConfig {
    voice: string;
    speed: number;
    baseDir: string;
    venvDir: string;
    modelDir: string;
    pythonDir: string;
}
export declare function loadState(baseDir: string): TtsState;
export declare function saveState(baseDir: string, state: TtsState): void;
export declare function loadConfig(): TtsConfig;
/** Platform-aware path to the Python interpreter inside the venv. */
export declare function venvPythonPath(config: TtsConfig): string;
/** Platform-aware path to pip inside the venv. */
export declare function venvPipPath(config: TtsConfig): string;
