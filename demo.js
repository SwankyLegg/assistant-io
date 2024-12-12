import Assistant from './assistant.js';

const asst = new Assistant();
const toggleButton = document.getElementById('toggleMic');
const stateDisplay = document.getElementById('currentState');
const finalTranscript = document.getElementById('finalTranscript');
const interimTranscript = document.getElementById('interimTranscript');

asst.recognizer.onresult = (event) => {
  let interim = '';
  let final = '';

  for (let i = event.resultIndex; i < event.results.length; i++) {
    const transcript = event.results[i][0].transcript;
    if (event.results[i].isFinal) {
      final += transcript + ' ';
    } else {
      interim += transcript;
    }
  }

  if (final) finalTranscript.textContent += final;
  interimTranscript.textContent = interim;
};

toggleButton.onclick = () => {
  if (asst.state === asst.states.idle) {
    asst.setState(asst.states.listening);
    toggleButton.textContent = 'Stop Listening';
    toggleButton.classList.add('listening');
  } else {
    asst.setState(asst.states.idle);
    toggleButton.textContent = 'Start Listening';
    toggleButton.classList.remove('listening');
  }
};

// Export the main demo functionality
export function initializeDemo() {
  // Existing demo initialization code...
}

// Export any other functions that need to be accessed by other files
export function handleDemoEvents() {
  // Existing event handling code...
}