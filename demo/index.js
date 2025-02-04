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

  // Disable selects and show loading state
  languageSelect.disabled = true;
  languageSelect.innerHTML = '<option>Loading languages...</option>';
  voiceSelect.disabled = true;
  voiceSelect.innerHTML = '<option>Loading voices...</option>';

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

      // Clear loading state
      languageSelect.innerHTML = '';

      if (languages.length === 0) {
        languageSelect.innerHTML = '<option>Default</option>';
        languageSelect.disabled = true;
        return;
      }

      // Enable select and add options
      languageSelect.disabled = false;
      languages.forEach(lang => {
        const option = document.createElement('option');
        option.value = lang.code;
        option.textContent = `${lang.name} (${lang.code})`;
        languageSelect.appendChild(option);
      });

      // Set to current language
      const currentLang = voice.getSelectedLanguage();
      if (currentLang) {
        languageSelect.value = currentLang;
      }
    },
    onVoicesLoaded: (voices) => {
      console.log('Voices loaded:', voices);

      // Clear loading state
      voiceSelect.innerHTML = '';

      if (voices.length === 0) {
        voiceSelect.innerHTML = '<option>Default</option>';
        voiceSelect.disabled = true;
        return;
      }

      // Enable select and add options
      voiceSelect.disabled = false;
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

  // Update language selection handler to be more robust
  languageSelect.addEventListener('change', (e) => {
    const selectedLang = e.target.value;
    if (selectedLang) {
      // Disable voice select while changing language
      voiceSelect.disabled = true;
      voiceSelect.innerHTML = '<option>Loading voices...</option>';

      voice.setLanguage(selectedLang);
    }
  });

  // Update voice selection handler
  voiceSelect.addEventListener('change', (e) => {
    const selectedVoice = e.target.value;
    if (selectedVoice) {
      voice.setVoice(selectedVoice);
    }
  });

  // Initialize button text
  toggleMic.textContent = 'Listen';
  speakButton.textContent = 'Speak';
  currentState.textContent = formatString(voice.states.IDLE);
});
