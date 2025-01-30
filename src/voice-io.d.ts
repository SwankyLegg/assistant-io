export interface VoiceIOConfig {
  onListenStart?: () => void;
  onListenEnd?: () => void;
  onRecognitionResult?: (results: RecognitionResult[][], bestTranscript: string, accumulatedTranscript: string) => void;
  onVoiceStart?: (utterance: SpeechSynthesisUtterance) => void;
  onVoiceEnd?: (utterance: SpeechSynthesisUtterance) => void;
  onError?: (error: any) => void;
  onLanguagesLoaded?: (languages: Language[]) => void;
  onVoicesLoaded?: (voices: SpeechSynthesisVoice[]) => void;
  synthesis?: {
    pitch?: number;
    rate?: number;
  };
  recognition?: {
    continuous?: boolean;
    interimResults?: boolean;
    lang?: string;
    maxAlternatives?: number;
  };
}

export interface RecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export interface Language {
  code: string;
  name: string;
  prefix: string;
}

export declare class VoiceIO {
  constructor(config?: VoiceIOConfig);
  
  states: {
    IDLE: string;
    LISTENING: string;
    THINKING: string;
    RESPONDING: string;
  };
  
  state: string;
  
  setState(newState: string, textToSynthesize?: string): void;
  setLanguage(languageCode: string): void;
  setVoice(voiceName: string): void;
  
  getState(): string;
  getVoices(): SpeechSynthesisVoice[];
  getSelectedLanguage(): string;
  getSelectedVoice(): SpeechSynthesisVoice | null;
  getAvailableLanguages(): Language[];
  
  cleanup(): void;
} 