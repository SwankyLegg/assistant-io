import { VoiceIO } from '../src/voice-io.ts';

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

  const languageSelect = document.getElementById('languageSelect');
  const voiceSelect = document.getElementById('voiceSelect');

  // Disable selects until we have data
  languageSelect.disabled = true;
  voiceSelect.disabled = true;

  const voice = new VoiceIO({
    onListenStart: () => {
      console.log('Started listening...');
      currentState.textContent = formatString(voice.states.LISTENING);
      toggleMic.textContent = 'Stop';
      accumulatedTranscript = '';
    },
    onListenEnd: () => {
      console.log('Stopped listening');
      currentState.textContent = formatString(voice.states.IDLE);
      toggleMic.textContent = 'Listen';
      interimTranscript.textContent = '';
    },
    onRecognitionResult: handleRecognitionResult,
    onVoiceStart: () => {
      console.log('Started speaking');
      currentState.textContent = formatString(voice.states.RESPONDING);
      speakButton.textContent = 'Stop';
    },
    onVoiceEnd: (utterance) => {
      console.log('Finished speaking:', utterance.text);
      currentState.textContent = formatString(voice.states.IDLE);
      speakButton.textContent = 'Speak';
    },
    onError: (error) => {
      console.error('Voice I/O error:', error);
      currentState.textContent = 'Error';
      toggleMic.textContent = 'Listen';
    },
    onLanguagesLoaded: (languages) => {
      console.log('Languages loaded:', languages);
      languageSelect.innerHTML = '';
      languageSelect.disabled = !languages.length;

      languages.forEach(lang => {
        const option = document.createElement('option');
        option.value = lang.code;
        option.textContent = `${lang.name} (${lang.code})`;
        languageSelect.appendChild(option);
      });

      // Set to current language
      languageSelect.value = voice.getSelectedLanguage();
    },
    onVoicesLoaded: (voices) => {
      console.log('Voices loaded:', voices);
      voiceSelect.innerHTML = '';
      voiceSelect.disabled = !voices.length;

      voices.forEach(voice => {
        const option = document.createElement('option');
        option.value = voice.name;
        option.textContent = `${voice.name} (${voice.lang})`;
        voiceSelect.appendChild(option);
      });

      // Set to current voice
      const currentVoice = voice.getSelectedVoice();
      if (currentVoice) {
        voiceSelect.value = currentVoice.name;
      }
    }
  });

  // Handle the speak button
  const speakButton = document.querySelector('#speakButton');
  const responseInput = document.querySelector('#responseInput');

  speakButton.addEventListener('click', () => {
    if (responseInput.value === '') {
      responseInput.value = 'Hello world';
    }
    voice.setState(voice.states.RESPONDING, responseInput.value);
  });

  // Handle the listen toggle button
  toggleMic.addEventListener('click', () => {
    if (voice.state === voice.states.LISTENING) {
      voice.setState(voice.states.IDLE);
    } else {
      voice.setState(voice.states.LISTENING);
    }
  });

  // Simple event handlers that just tell the assistant what was selected
  languageSelect.addEventListener('change', (e) => {
    voice.setLanguage(e.target.value);
  });

  voiceSelect.addEventListener('change', (e) => {
    voice.setVoice(e.target.value);
  });

  // Initialize button text
  toggleMic.textContent = 'Listen';
  speakButton.textContent = 'Speak';
  currentState.textContent = formatString(voice.states.IDLE);
});
