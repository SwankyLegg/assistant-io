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

    this.initRecognizer();
    this.initSynthesizer();

    // Clean up on page unload
    window.addEventListener('beforeunload', () => this.cleanup());

    this.recognitionResults = [];
    this.accumulatedTranscript = '';
  };

  initRecognizer() {
    // Browser compatibility check
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      throw new Error('Speech recognition not supported');
    }
    this.recognizer = new SpeechRecognition();
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

    this.recognizer.onerror = (error) => {
      this.handleError(error, 'recognizer');
    };
  };

  initSynthesizer() {
    this.synthesizer = window.speechSynthesis;

    // Load available voices
    this.voices = [];
    const loadVoices = () => {
      this.voices = this.synthesizer.getVoices();
    };

    loadVoices();
    if (this.synthesizer.onvoiceschanged !== undefined) {
      this.synthesizer.onvoiceschanged = loadVoices;
    }
  };

  handleRecognitionResult(evt) {
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
  };

  setIdle() {
    this.cleanup();
  };

  setListening() {
    // If we're currently speaking, just stop that
    // No need for full cleanup which would also stop recognition
    if (this.state === STATES.RESPONDING) {
      this.stopSpeaking();
    } else {
      this.cleanup();
    }

    this.accumulatedTranscript = ''; // Reset accumulated transcript when starting new session
    this.recognizer.start();
  };

  setThinking() {
    this.cleanup();
  };

  setSpeaking(text) {
    this.cleanup();
    const utterance = new SpeechSynthesisUtterance(text);

    // Apply config including voice if specified
    Object.assign(utterance, this.config.synthesis);
    if (this.config.synthesis.voice) {
      const voice = this.voices.find(v => v.name === this.config.synthesis.voice);
      if (voice) {
        utterance.voice = voice;
      }
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
  };

  setState(newState, textToSynthesize) {
    // Don't do anything if state is invalid or same
    if (!this.states[newState]) {
      throw new Error(`Invalid state: ${newState}`);
    }
    if (this.state === newState) {
      return console.log('No Assistant state change');
    }

    // Update the state first
    this.state = newState;

    // Then handle the state change
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
  };

  handleError(error, label) {
    console.info(`Assistant ${label} error`, error);
    this.config.onError?.(error);
    this.stopRecognizing();
    this.setState(STATES.IDLE);
  };

  stopRecognizing() {
    if (this.recognizer) {
      try {
        this.recognizer.stop();
      } catch (err) {
        console.warn('Error stopping recognition:', err);
      }
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

  getVoices() {
    return this.voices;
  };

  getState() {
    return this.state;
  };
};