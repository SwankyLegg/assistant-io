export class Assistant {
  constructor(config = {}) {
    this.config = {
      // Synthesis defaults
      pitch: 1,
      rate: 1,

      // Recognition defaults
      continuous: true,
      interimResults: true,
      lang: 'en-US',
      maxAlternatives: 3,
      ...config
    };
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      throw new Error('Assistant requires a browser environment to run');
    }

    this.states = {
      idle: 'idle',
      waitingForMic: 'waitingForMic',
      listening: 'listening',
      detecting: 'detecting',
      transcribing: 'transcribing',
      thinking: 'thinking',
      speaking: 'speaking',
      error: 'error'
    };

    this.state = this.states.idle;
    this.lastError = null;
    this.stateHandlers = new Map();

    // Check for Speech API support
    if (!('speechSynthesis' in window)) {
      throw new Error('Speech synthesis not supported in this browser');
    }

    this.synthesizer = window.speechSynthesis;

    // Check for Speech Recognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      throw new Error('Speech recognition not supported in this browser');
    }

    // Initialize speech recognition with error handling
    try {
      this.recognizer = new SpeechRecognition();
      this.recognizer.continuous = false;
      this.recognizer.interimResults = false;

      // Set up error handlers
      this.recognizer.onerror = (event) => {
        this.lastError = event.error;
        this.setState(this.states.error, event);
      };

      this.synthesizer.onvoiceschanged = () => {
        this.voices = this.synthesizer.getVoices();
      };

      // Get initial voices if already loaded
      this.voices = this.synthesizer.getVoices();

    } catch (error) {
      throw new Error(`Failed to initialize speech recognition: ${error.message}`);
    }

    // Initialize state machine
    this.setupStateTransitions();

    // Ensure proper cleanup on page unload
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
  }

  cleanup() {
    // Stop any ongoing speech or recognition
    this.synthesizer.cancel();
    try {
      this.recognizer.stop();
    } catch (e) {
      // Ignore errors during cleanup
    }

    // Clear all state handlers
    this.stateHandlers.clear();
  }

  // Static method to check browser compatibility
  static checkCompatibility() {
    const requirements = {
      speechSynthesis: 'speechSynthesis' in window,
      speechRecognition: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
      audioContext: 'AudioContext' in window || 'webkitAudioContext' in window
    };

    return {
      isCompatible: Object.values(requirements).every(Boolean),
      requirements
    };
  }

  setupStateTransitions() {
    // Define valid transitions from each state
    this.transitions = {
      idle: ['listening', 'error', 'waitingForMic', 'speaking'],
      waitingForMic: ['listening', 'error'],
      listening: ['detecting', 'idle', 'error'],
      detecting: ['transcribing', 'listening', 'error'],
      transcribing: ['thinking', 'detecting', 'error'],
      thinking: ['speaking', 'idle', 'error'],
      speaking: ['idle', 'error', 'listening'],  // Added listening as valid transition
      error: ['idle']
    };
  }

  setState(newState, payload = null) {
    if (!this.transitions[this.state]?.includes(newState)) {
      console.error(`Invalid state transition from ${this.state} to ${newState}`);
      return false;
    }

    const oldState = this.state;

    // Handle cleanup of current state
    this.handleStateExit(oldState);

    // Update state
    this.state = newState;

    // Initialize new state
    this.handleStateEnter(newState, payload);

    // Notify listeners
    this.notifyStateChange(oldState, newState, payload);

    return true;
  }

  handleStateExit(state) {
    switch (state) {
      case this.states.speaking:
        this.synthesizer.cancel();
        break;
      case this.states.listening:
      case this.states.detecting:
      case this.states.transcribing:
        this.recognizer.stop();
        break;
    }
  }

  handleStateEnter(state, payload) {
    switch (state) {
      case this.states.listening:
        this.recognizer.start();
        break;
      case this.states.speaking:
        const utterance = new SpeechSynthesisUtterance(payload);
        utterance.onend = () => this.setState(this.states.idle);
        utterance.onerror = (error) => this.setState(this.states.error, error);
        this.synthesizer.speak(utterance);
        break;
    }
  }

  // Event handling
  onState(state, handler) {
    if (!this.stateHandlers.has(state)) {
      this.stateHandlers.set(state, new Set());
    }
    this.stateHandlers.get(state).add(handler);
  }

  offState(state, handler) {
    this.stateHandlers.get(state)?.delete(handler);
  }

  notifyStateChange(oldState, newState, payload) {
    const handlers = this.stateHandlers.get(newState);
    if (handlers) {
      handlers.forEach(handler => handler(payload));
    }
  }
};