class Assistant {
  constructor() {
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

    // Initialize speech APIs
    this.synthesizer = window.speechSynthesis;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognizer = new SpeechRecognition();

    this.setupStateTransitions();
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
        if (this.synthesizer.speaking) {
          this.synthesizer.cancel();
        }
        this.recognizer.start();
        break;
      case this.states.speaking:
        if (this.recognizer.listening) {
          this.recognizer.stop();
        }
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

  notifyStateChange(newState, payload) {
    const handlers = this.stateHandlers.get(newState);
    if (handlers) {
      handlers.forEach(handler => handler(payload));
    }
  }
}

export default Assistant;