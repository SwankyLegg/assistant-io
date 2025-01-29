import { Assistant } from './assistant.js';

// Initialize everything when the document loads
document.addEventListener('DOMContentLoaded', () => {


  function logText(text) {
    console.log(text);
  }

  const asst = new Assistant({
    // onListenStart: logText,
    // onListenEnd: logText,
    onRecognitionResult: logText,
    onVoiceEnd: (utterance) => console.log('voice end', utterance),
    // onSpeechStart: logText,
    // onSpeechEnd: logText,
    // onError: logText
  });

  const speakButton = document.querySelector('#speakButton');
  const responseInput = document.querySelector('#responseInput');

  speakButton.addEventListener('click', () => {
    if (responseInput.value === '') {
      responseInput.value = 'Hello world';
    }
    asst.setState(asst.states.RESPONDING, responseInput.value);
  });

  const button = document.querySelector('button');
  button.addEventListener('click', () => {
    if (asst.state === asst.states.LISTENING) {
      asst.setState(asst.states.IDLE);
    } else {
      asst.setState(asst.states.LISTENING);
    }
  });


});
