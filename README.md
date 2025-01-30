# Voice I/O

Browser-based Speech Recognition & Speech Synthesis with support for multiple languages and voices.

## Quickstart

```bash
npm install @swankylegg/voice-io
```

```javascript
import { VoiceIO } from "@swankylegg/voice-io";

// Initialize
const voice = new VoiceIO();

// Listen for speech
voice.setState(voice.states.LISTENING);

// Handle speech recognition
voice.config.onRecognitionResult = (results, bestTranscript) => {
  console.log("User said:", bestTranscript);

  // Respond with speech
  voice.setState(voice.states.RESPONDING, "I heard you!");
};
```

## Demo

Try it out: [Live Demo](https://swankylegg.github.io/voice-io/)

## Browser Support

This library uses the [Web Speech API](https://caniuse.com/?search=Web%20Speech%20API) and requires browser support for:

- `SpeechRecognition` (or `webkitSpeechRecognition`)
- `speechSynthesis`

## Voice Support

Voice I/O automatically detects available system voices for speech synthesis. Different operating systems and browsers provide different voices:

- **macOS/iOS**: High-quality system voices in multiple languages
- **Windows**: Microsoft system voices + installed language packs
- **Android**: System voices vary by device/manufacturer
- **Chrome**: Additional cloud-based voices when online

To get available voices:

```javascript
voice.getVoices(); // Get all available voices
voice.getVoicesForCurrentLanguage(); // Get voices matching current language
```

To set a specific voice:

```javascript
voice.setVoice("Samantha"); // Use a specific voice by name
```

## Language Support

Voice I/O supports multiple languages for both recognition and synthesis. Available languages include:

- English (en-US)
- Spanish (es-ES)
- French (fr-FR)
- German (de-DE)
- Italian (it-IT)
- Japanese (ja-JP)
- Korean (ko-KR)
- Chinese (zh-CN)

Note: Actual language availability depends on browser support for both recognition and synthesis in the selected language. The library will automatically filter voices to match the selected language.

### States

Voice I/O has four possible states:

- `IDLE`: Default state, not listening or speaking

  🎤🚫 | 🔈🚫

- `LISTENING`: Actively listening for speech input

  🎤🟢 | 🔈🚫

- `THINKING`: Transitional state between listening and responding (use for loading states)

  🎤🚫 | 🔈🚫

- `RESPONDING`: Currently speaking using speech synthesis

  🎤🚫 | 🔊🟢

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
