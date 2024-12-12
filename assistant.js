class Assistant {
  constructor() {
    this.state = 'idle';

    // Initialize speech APIs with browser compatibility
    this.synthesizer = window.speechSynthesis;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognizer = new SpeechRecognition();

    // Default recognition settings
    this.recognizer.continuous = true;
    this.recognizer.interimResults = true;
    this.recognizer.lang = 'en-US';
    this.recognizer.maxAlternatives = 3;
  }

  // Event binding methods to match documentation
  on(eventName, handler) {
    switch (eventName) {
      case 'listenStart':
        this.recognizer.onaudiostart = handler;
        break;
      case 'volume':
        // Handler for volume changes
        break;
      case 'recognitionResult':
        this.recognizer.onresult = (event) => {
          handler(event.results);
        };
        break;
      case 'listenEnd':
        this.recognizer.onend = handler;
        break;
      case 'voiceStart':
        this.recognizer.onspeechstart = handler;
        break;
      case 'voiceEnd':
        this.recognizer.onspeechend = handler;
        break;
    }
  }

  // State management
  setState(newState) {
    const validStates = ['idle', 'listening', 'thinking', 'responding'];
    if (validStates.includes(newState)) {
      this.state = newState;
    }
  }

  getState() {
    return this.state;
  }

  // Voice methods
  speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    this.synthesizer.speak(utterance);
  }

  startListening() {
    this.recognizer.start();
  }

  stopListening() {
    this.recognizer.stop();
  }
}

export default Assistant;