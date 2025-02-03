export interface SynthesisConfig {
  pitch: number;
  rate: number;
  voice?: SpeechSynthesisVoice;
};

export interface RecognitionConfig {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
};

export interface VoiceIOConfig {
  onListenStart?: () => void;
  onListenEnd?: () => void;
  onRecognitionResult?: (
    results: RecognitionResult[][],
    bestTranscript: string,
    accumulatedTranscript: string
  ) => void;
  onVoiceStart?: (utterance: SpeechSynthesisUtterance) => void;
  onVoiceEnd?: (utterance: SpeechSynthesisUtterance) => void;
  onError?: (error: SpeechRecognitionErrorEvent | SpeechSynthesisErrorEvent) => void;
  onLanguagesLoaded?: (languages: LanguageInfo[]) => void;
  onVoicesLoaded?: (voices: SpeechSynthesisVoice[]) => void;
  synthesis?: Partial<SynthesisConfig>;
  recognition?: Partial<RecognitionConfig>;
};

export interface RecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
};

export interface LanguageInfo {
  code: string;
  name: string;
  prefix?: string;
};

export enum STATES {
  IDLE = 'IDLE',
  LISTENING = 'LISTENING',
  THINKING = 'THINKING',
  RESPONDING = 'RESPONDING'
};

export type VoiceIOState = keyof typeof STATES;

export class VoiceIO {
  constructor(config?: Partial<VoiceIOConfig>);
  
  readonly states: typeof STATES;
  state: VoiceIOState;
  
  setState(newState: VoiceIOState, textToSynthesize?: string): void;
  setLanguage(languageCode: string): void;
  setVoice(voiceName: string): void;
  
  getState(): VoiceIOState;
  getVoices(): SpeechSynthesisVoice[];
  getSelectedLanguage(): string;
  getSelectedVoice(): SpeechSynthesisVoice | null;
  getAvailableLanguages(): LanguageInfo[];
  
  cleanup(): void;
};