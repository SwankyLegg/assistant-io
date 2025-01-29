import { Assistant } from './assistant.js';

// Add this function after the imports but before the DOMContentLoaded listener
function formatString(str) {
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

// Initialize everything when the document loads
document.addEventListener('DOMContentLoaded', () => {
  // Get existing elements
  const finalTranscript = document.querySelector('#finalTranscript');
  const interimTranscript = document.querySelector('#interimTranscript');
  const currentState = document.querySelector('#currentState');
  const toggleMic = document.querySelector('#toggleMic');

  let accumulatedTranscript = '';

  function handleRecognitionResult(results, bestTranscript, accumulatedTranscript) {
    console.info('handleRecognitionResult', results, bestTranscript, accumulatedTranscript);
    // Get the latest result array
    const latestResult = results[results.length - 1];
    const bestResult = latestResult[0];

    // Get the transcript element
    const transcript = document.querySelector('#transcript');

    // Update text and style based on whether it's final
    transcript.textContent = bestResult.isFinal ? accumulatedTranscript : bestTranscript;
    transcript.classList.toggle('interim', !bestResult.isFinal);

    if (bestResult.isFinal) {
      console.log('Final result:', {
        transcript: accumulatedTranscript,
        confidence: bestResult.confidence
      });
    }
  }

  const asst = new Assistant({
    onListenStart: () => {
      console.log('Started listening...');
      currentState.textContent = formatString(asst.states.LISTENING);
      toggleMic.textContent = 'Stop';
      accumulatedTranscript = '';
    },
    onListenEnd: () => {
      console.log('Stopped listening');
      currentState.textContent = formatString(asst.states.IDLE);
      toggleMic.textContent = 'Listen';
      interimTranscript.textContent = '';
    },
    onRecognitionResult: handleRecognitionResult,
    onVoiceStart: () => {
      console.log('Started speaking');
      currentState.textContent = formatString(asst.states.RESPONDING);
      speakButton.textContent = 'Stop';
    },
    onVoiceEnd: (utterance) => {
      console.log('Finished speaking:', utterance.text);
      currentState.textContent = formatString(asst.states.IDLE);
      speakButton.textContent = 'Speak';
    },
    onError: (error) => {
      console.error('Assistant error:', error);
      currentState.textContent = 'Error';
      toggleMic.textContent = 'Listen';
    }
  });

  // Handle the speak button
  const speakButton = document.querySelector('#speakButton');
  const responseInput = document.querySelector('#responseInput');

  speakButton.addEventListener('click', () => {
    if (responseInput.value === '') {
      responseInput.value = 'Hello world';
    }
    asst.setState(asst.states.RESPONDING, responseInput.value);
  });

  // Handle the listen toggle button
  toggleMic.addEventListener('click', () => {
    if (asst.state === asst.states.LISTENING) {
      asst.setState(asst.states.IDLE);
    } else {
      asst.setState(asst.states.LISTENING);
    }
  });

  // Initialize button text
  toggleMic.textContent = 'Listen';
  speakButton.textContent = 'Speak';
  currentState.textContent = formatString(asst.states.IDLE);
});
