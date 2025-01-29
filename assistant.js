const DEFAULT_CONFIG = {
  // Event handlers
  onListenStart: null,
  onListenEnd: null,
  onRecognitionResult: null,
  onVoiceStart: null,
  onVoiceEnd: null,
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
    maxAlternatives: 3
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

    // Merge configs
    this.config = {
      ...DEFAULT_CONFIG,
      synthesis: { ...DEFAULT_CONFIG.synthesis, ...config.synthesis },
      recognition: { ...DEFAULT_CONFIG.recognition, ...config.recognition },
      ...config
    };

    this.initRecognizer();
    this.initSynthesizer();

    // Clean up on page unload
    window.addEventListener('beforeunload', () => this.cleanup());
  }

  initRecognizer() {
    // Browser compatibility check
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      throw new Error('Speech recognition not supported');
    }
    this.recognizer = new SpeechRecognition();
    Object.assign(this.recognizer, this.config.recognition);

    this.recognitionResults = [];

    this.recognizer.onstart = () => {
      this.config.onListenStart?.();
    };

    this.recognizer.onresult = (evt) => this.handleRecognitionResult(evt);

    this.recognizer.onend = () => {
      this.config.onListenEnd?.();
    };

    this.recognizer.onerror = (error) => {
      this.handleError(error, 'recognizer');
    };
  }

  initSynthesizer() {
    // Browser compatibility check
    if (!('speechSynthesis' in window)) {
      throw new Error('Speech synthesis not supported');
    }
    this.synthesizer = window.speechSynthesis;
  };

  handleRecognitionResult(evt) {
    console.log(evt.results);
    [...evt.results].map((recognitionResult) => {
      [...recognitionResult].map((result) => {
        console.log(result.transcript);
      });
    });
    // console.log(evt.results.map(r => r.transcript));
    // this.recognitionResults.push(evt.recognitionResults);
    // this.config.onRecognitionResult?.(evt);
  };

  setIdle() {
    this.cleanup();
  };

  setListening() {
    this.cleanup();
    this.recognizer.start();
  };

  setThinking() {
    this.cleanup();
  };

  setSpeaking(text) {
    this.cleanup();
    const utterance = new SpeechSynthesisUtterance(text);
    // Apply config
    Object.assign(utterance, this.config.synthesis);
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
  };

  setState(newState, textToSynthesize) {
    console.log(newState);

    // Don't do anything if state state is invalid or same
    if (!this.states[newState]) {
      throw new Error(`Invalid state: ${newState}`);
    }
    if (this.state === newState) {
      return console.log('No Assistant state change');
    }

    switch (newState) {
      case STATES.IDLE:
        return this.setIdle();
      case STATES.RESPONDING:
        return this.setSpeaking(textToSynthesize);
      case STATES.LISTENING:
        return this.setListening();
      case STATES.THINKING:
        return this.setThinking();
    }

    // Update the state
    this.state = newState;
  };

  handleError(error, label) {
    console.info(`Assistant ${label} error`, error);
    this.config.onError?.(error);
    this.setState(STATES.IDLE);
  };

  stopRecognizing() {
    if (this.recognizer.listening) {
      this.recognizer.stop();
    }
  };

  stopSpeaking() {
    if (this.synthesizer.speaking) {
      this.synthesizer.cancel();
    }
  };

  cleanup() {
    try {
      this.stopSpeaking();
      this.stopRecognizing();
    } catch (err) {
      this.handleError(err, "cleanup");
    }
  };
}