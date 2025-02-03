import { STATES } from './types/voice-io.d';
import type { 
  VoiceIOConfig, 
  SynthesisConfig, 
  RecognitionConfig,
  RecognitionResult,
  LanguageInfo,
  VoiceIOState
} from './types/voice-io.d';

// Add type assertion for SpeechRecognition
const SpeechRecognitionAPI = (window.SpeechRecognition || window.webkitSpeechRecognition) as typeof SpeechRecognition;

/**
 * Default configuration for VoiceIO instance
 */
const DEFAULT_CONFIG: VoiceIOConfig = {
  // Event handlers
  onListenStart: undefined,
  onListenEnd: undefined,
  onRecognitionResult: undefined,
  onVoiceStart: undefined,
  onVoiceEnd: undefined,
  onError: undefined,

  // Synthesis settings
  synthesis: {
    pitch: 1,
    rate: 1
  },

  // Recognition settings
  recognition: {
    continuous: true,
    interimResults: true,
    lang: 'en-US',
    maxAlternatives: 3
  },

  // Add new callbacks
  onLanguagesLoaded: undefined,
  onVoicesLoaded: undefined,
};

/**
 * VoiceIO - A class to handle browser-based speech recognition and synthesis
 */
export class VoiceIO {
  private readonly config: VoiceIOConfig;
  private readonly states = STATES;
  private state: VoiceIOState = STATES.IDLE;
  private recognizer!: SpeechRecognition;
  private synthesizer!: SpeechSynthesis;
  private recognitionResults: RecognitionResult[][] = [];
  private accumulatedTranscript: string = '';
  private selectedLanguage: string;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private voicesLoaded: boolean = false;
  private readonly recognitionLanguages: LanguageInfo[] = [
    { code: 'en-US', name: 'English' },
    { code: 'es-ES', name: 'Español' },
    { code: 'fr-FR', name: 'Français' },
    { code: 'de-DE', name: 'Deutsch' },
    { code: 'it-IT', name: 'Italiano' },
    { code: 'ja-JP', name: '日本語' },
    { code: 'ko-KR', name: '한국어' },
    { code: 'zh-CN', name: '中文' }
  ];

  constructor(config: Partial<VoiceIOConfig> = {}) {
    // Check browser support first
    if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
      throw new Error('Speech recognition is not supported in this browser');
    }
    if (!('speechSynthesis' in window)) {
      throw new Error('Speech synthesis is not supported in this browser');
    }

    // So these can be accessed directly without a separate import
    this.states = STATES;
    this.state = this.states.IDLE;

    // Merge configs
    this.config = {
      ...DEFAULT_CONFIG,
      synthesis: { ...DEFAULT_CONFIG.synthesis, ...config.synthesis },
      recognition: { ...DEFAULT_CONFIG.recognition, ...config.recognition },
      ...config
    };

    this.selectedLanguage = this.config.recognition!.lang!;

    // Initialize recognizer first
    this.initRecognizer();

    // Initialize synthesizer and set up voice loading
    this.synthesizer = window.speechSynthesis;

    // Try loading voices immediately
    this.voices = this.synthesizer.getVoices();
    if (this.voices.length > 0) {
      this.handleVoicesLoaded();
    }

    // Set up voice changed listener for browsers that need it
    if (this.synthesizer.onvoiceschanged !== undefined) {
      this.synthesizer.onvoiceschanged = () => {
        this.voices = this.synthesizer.getVoices();
        if (!this.voicesLoaded && this.voices.length > 0) {
          this.handleVoicesLoaded();
        }
      };
    }

    // Clean up on page unload
    window.addEventListener('beforeunload', () => this.cleanup());
  }

  /**
   * Initializes the speech recognition system
   * @private
   */
  private initRecognizer(): void {
    if (!SpeechRecognitionAPI) {
      throw new Error('Speech recognition not supported');
    }
    this.recognizer = new SpeechRecognitionAPI();
    Object.assign(this.recognizer, this.config.recognition);

    this.recognizer.onstart = () => {
      this.config.onListenStart?.();
    };

    this.recognizer.onresult = (evt) => this.handleRecognitionResult(evt);

    this.recognizer.onspeechend = () => {
      this.recognizer.stop();
    };

    this.recognizer.onend = () => {
      // Only call onListenEnd here, when recognition fully ends
      this.config.onListenEnd?.();
    };

    this.recognizer.onerror = (error: SpeechRecognitionErrorEvent) => {
      this.handleError(error, 'recognizer');
    };
  }

  /**
   * Handles the loading of speech synthesis voices
   * @private
   */
  private handleVoicesLoaded(): void {
    this.voicesLoaded = true;

    // Get available languages based on available voices
    const availableLanguages = this.getAvailableLanguages();

    // Only proceed if we have available languages
    if (availableLanguages.length > 0) {
      // If no language selected or current language isn't available,
      // select first available language
      const currentLanguageIsValid = availableLanguages.some(
        l => l.code === this.selectedLanguage
      );

      if (!this.selectedLanguage || !currentLanguageIsValid) {
        // Select first available language
        this.setLanguage(availableLanguages[0].code);
      } else {
        // Current language is valid, just update voices
        const availableVoices = this.getVoicesForCurrentLanguage();

        // Select first voice if none selected
        if (availableVoices.length > 0 && !this.selectedVoice) {
          this.setVoice(availableVoices[0].name);
        }

        // Notify about available voices for current language
        this.config.onVoicesLoaded?.(availableVoices);
      }

      // Notify about available languages
      this.config.onLanguagesLoaded?.(availableLanguages);
    }
  }

  /**
   * Processes speech recognition results
   * @private
   */
  private handleRecognitionResult(evt: SpeechRecognitionEvent): void {
    // Convert results to a more usable format
    const results = Array.from(evt.results).map(resultArray => {
      return Array.from(resultArray).map(result => ({
        transcript: result.transcript,
        confidence: result.confidence,
        isFinal: resultArray.isFinal
      }));
    });

    // Get the best transcript by taking highest confidence result from each group
    const bestTranscript = results
      .map(alternatives => alternatives.reduce((best, current) =>
        current.confidence > best.confidence ? current : best
      ))
      .map(result => result.transcript)
      .join(' ');

    // Accumulate final transcripts
    const lastResult = results[results.length - 1];
    // Stop recognizing if we have final results
    if (lastResult && lastResult[0].isFinal) {
      this.accumulatedTranscript = (this.accumulatedTranscript + ' ' + bestTranscript).trim();
      this.stopRecognizing();
      // Use setState but skip cleanup since we just stopped recognizing
      this.state = this.states.IDLE; // Directly set state to avoid cleanup
    }

    this.recognitionResults = results;
    this.config.onRecognitionResult?.(results, bestTranscript, this.accumulatedTranscript);
  }

  /**
   * Sets the state to IDLE and performs cleanup
   * @private
   */
  private setIdle(): void {
    this.cleanup();
  }

  /**
   * Starts listening for speech input
   * @private
   */
  private setListening(): void {
    // If we're currently speaking, just stop that
    // No need for full cleanup which would also stop recognition
    if (this.state === STATES.RESPONDING) {
      this.stopSpeaking();
    } else {
      this.cleanup();
    }

    this.accumulatedTranscript = ''; // Reset accumulated transcript when starting new session
    this.recognizer.start();
  }

  /**
   * Sets the state to THINKING (transitional state)
   * @private
   */
  private setThinking(): void {
    this.cleanup();
  }

  /**
   * Initiates speech synthesis
   * @private
   */
  private setSpeaking(text: string): void {
    this.cleanup();
    const utterance = new SpeechSynthesisUtterance(text);

    // Apply config settings
    Object.assign(utterance, this.config.synthesis);

    // Set the voice and language
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
      utterance.lang = this.selectedVoice.lang; // Use full language code from voice
    } else {
      utterance.lang = this.selectedLanguage;
    }

    // Add event handlers
    utterance.onend = () => {
      this.setState(STATES.IDLE);
      this.config.onVoiceEnd?.(utterance);
    };
    utterance.onstart = () => {
      this.config.onVoiceStart?.(utterance);
    };
    utterance.onerror = (error) => {
      this.handleError(error, 'utterance');
    };
    this.synthesizer.speak(utterance);
  }

  /**
   * Changes the current state of the VoiceIO instance
   */
  setState(newState: VoiceIOState, textToSynthesize?: string): void {
    // Don't do anything if state is invalid or same
    if (!this.states[newState]) {
      throw new Error(`Invalid state: ${newState}`);
    }
    if (this.state === newState) {
      return console.log('No Voice I/O state change');
    }

    // Update the state first
    this.state = newState;

    // Then handle the state change
    switch (newState) {
      case STATES.IDLE:
        return this.setIdle();
      case STATES.RESPONDING:
        return this.setSpeaking(textToSynthesize!);
      case STATES.LISTENING:
        return this.setListening();
      case STATES.THINKING:
        return this.setThinking();
    }
  }

  /**
   * Handles errors from speech recognition or synthesis
   * @private
   */
  private handleError(error: SpeechRecognitionErrorEvent | SpeechSynthesisErrorEvent, label: string): void {
    console.info(`Voice I/O ${label} error`, error);
    this.config.onError?.(error);
    this.stopRecognizing();
    this.setState(STATES.IDLE);
  }

  /**
   * Stops the speech recognition process
   * @private
   */
  private stopRecognizing(): void {
    if (this.recognizer) {
      try {
        this.recognizer.stop();
      } catch (err) {
        console.warn('Error stopping recognition:', err);
      }
    }
  }

  /**
   * Stops any ongoing speech synthesis
   * @private
   */
  private stopSpeaking(): void {
    if (this.synthesizer.speaking) {
      this.synthesizer.cancel();
    }
  }

  /**
   * Performs cleanup of speech recognition and synthesis
   */
  cleanup(): void {
    try {
      this.stopSpeaking();
      this.stopRecognizing();
    } catch (err) {
      this.handleError(err as SpeechRecognitionErrorEvent | SpeechSynthesisErrorEvent, "cleanup");
    }
  }

  /**
   * Gets all available speech synthesis voices
   */
  getVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  /**
   * Gets the current state of the VoiceIO instance
   */
  getState(): VoiceIOState {
    return this.state;
  }

  /**
   * Sets the language for both speech recognition and synthesis
   */
  setLanguage(languageCode: string): void {
    this.selectedLanguage = languageCode;
    this.config.recognition!.lang = languageCode;

    // Get voices for new language
    const availableVoices = this.getVoicesForCurrentLanguage();

    // Reset voice selection
    this.selectedVoice = null;
    this.config!.synthesis!.voice = undefined;

    // Always select first available voice for this language
    if (availableVoices.length > 0) {
      this.setVoice(availableVoices[0].name);
    }

    // Notify about available voices for this language
    this.config.onVoicesLoaded?.(availableVoices);

    // Reinitialize recognizer
    this.initRecognizer();
  }

  /**
   * Gets available voices for the currently selected language
   * @private
   */
  private getVoicesForCurrentLanguage(): SpeechSynthesisVoice[] {
    // Get language prefix (e.g., 'en' from 'en-US')
    const currentLangPrefix = this.selectedLanguage.split('-')[0].toLowerCase();

    return this.voices.filter(voice => {
      const voiceLangPrefix = voice.lang.split('-')[0].toLowerCase();
      return voiceLangPrefix === currentLangPrefix;
    });
  }

  /**
   * Sets the voice for speech synthesis
   */
  setVoice(voiceName: string): void {
    const validVoices = this.getVoicesForCurrentLanguage();
    const voice = validVoices.find(v => v.name === voiceName);
    if (voice) {
      this.selectedVoice = voice;
      this.config.synthesis!.voice = voice;
    } else {
      console.warn('Selected voice is not available for current language');
    }
  }

  /**
   * Gets the currently selected language code
   */
  getSelectedLanguage(): string {
    return this.selectedLanguage;
  }

  /**
   * Gets the currently selected voice
   */
  getSelectedVoice(): SpeechSynthesisVoice | null {
    return this.selectedVoice;
  }

  /**
   * Gets available languages that have both recognition and synthesis support
   */
  getAvailableLanguages(): LanguageInfo[] {
    if (!this.voices || this.voices.length === 0) {
      return [];
    }

    // Get languages that have synthesis voices
    const synthLanguages = new Set(
      this.voices.map(voice => voice.lang.split('-')[0].toLowerCase())
    );

    // Filter recognition languages to only those that also have synthesis support
    return this.recognitionLanguages
      .filter(lang => {
        const langPrefix = lang.code.split('-')[0].toLowerCase();
        return synthLanguages.has(langPrefix);
      })
      .map(lang => ({
        code: lang.code,
        name: lang.name,
        prefix: lang.code.split('-')[0].toLowerCase()
      }));
  }
} 