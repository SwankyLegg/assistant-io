const DEFAULT_CONFIG = {
  // Event handlers
  onListenStart: null,
  onListenEnd: null,
  onRecognitionResult: null,
  onSpeechStart: null,
  onSpeechEnd: null,
  onError: null,

  // Synthesis settings
  synthesis: {
    // voice: null,
    pitch: 1,
    rate: 1
  },

  // Recognition settings
  recognition: {
    continuous: true,
    interimResults: true,
    lang: 'en-US',
    maxAlternatives: 1
  }
};

const STATES = {
  IDLE: 'IDLE',
  LISTENING: 'LISTENING',
  THINKING: 'THINKING',
  RESPONDING: 'RESPONDING'
};

export class Assistant {
  constructor(config = {}) {
    // So these can be accessed directly without a separate import
    this.states = STATES;

    this.state = this.states.IDLE;

    // Initialize speech APIs with browser compatibility checks
    if (!('speechSynthesis' in window)) {
      throw new Error('Speech synthesis not supported');
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      throw new Error('Speech recognition not supported');
    }

    this.synthesizer = window.speechSynthesis;
    this.recognizer = new SpeechRecognition();

    // Merge configs
    this.config = {
      ...DEFAULT_CONFIG,
      synthesis: { ...DEFAULT_CONFIG.synthesis, ...config.synthesis },
      recognition: { ...DEFAULT_CONFIG.recognition, ...config.recognition },
      ...config
    };

    // Configure recognition
    Object.assign(this.recognizer, this.config.recognition);

    // Set up recognition event handlers
    this.recognizer.onstart = () => {
      this.setState(STATES.LISTENING);
      this.config.onListenStart?.();
    };

    this.recognizer.onend = () => {
      if (this.state === STATES.LISTENING) {
        this.setState(STATES.IDLE);
      }
      this.config.onListenEnd?.();
    };

    this.recognizer.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      this.config.onRecognitionResult?.(result);
    };

    this.recognizer.onerror = (error) => {
      this.setState(STATES.IDLE);
      this.config.onError?.(error);
    };

    // Clean up on page unload
    window.addEventListener('beforeunload', () => this.cleanup());
  }

  setState(newState) {
    if (!this.states[newState]) {
      throw new Error(`Invalid state: ${newState}`);
    }

    // Don't do anything if state isn't changing
    if (this.state === newState) {
      return;
    }

    // Handle cleanup of previous state
    switch (this.state) {
      case STATES.LISTENING:
        this.recognizer.stop();
        break;
      case STATES.RESPONDING:
        this.synthesizer.cancel();
        break;
    }

    // Handle initialization of new state
    switch (newState) {
      case STATES.LISTENING:
        try {
          this.recognizer.start();
        } catch (error) {
          this.config.onError?.(error);
          // If we can't start listening, remain in current state
          return;
        }
        break;
      case STATES.IDLE:
        // Make sure everything is stopped
        this.cleanup();
        break;
    }

    this.state = newState;
  }

  startListening() {
    this.setState(STATES.LISTENING);
  }

  stopListening() {
    this.setState(STATES.IDLE);
  }

  speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);

    // Apply synthesis settings
    Object.assign(utterance, this.config.synthesis);

    utterance.onstart = () => {
      this.setState(STATES.RESPONDING);
      this.config.onSpeechStart?.();
    };

    utterance.onend = () => {
      this.setState(STATES.IDLE);
      this.config.onSpeechEnd?.();
    };

    utterance.onerror = (error) => {
      this.setState(STATES.IDLE);
      this.config.onError?.(error);
    };

    this.synthesizer.speak(utterance);
  }

  cleanup() {
    this.synthesizer.cancel();
    try {
      this.recognizer.stop();
    } catch (e) {
      // Ignore errors during cleanup
    }
  }
}