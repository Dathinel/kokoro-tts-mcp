import { TtsConfig } from "./config";
export declare function isInitialized(config: TtsConfig): boolean;
export declare function speak(text: string, voice: string, speed: number, config: TtsConfig): Promise<{
    wavPath: string;
    duration: number;
}>;
