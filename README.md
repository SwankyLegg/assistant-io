# assistant-io

Speech Recognition (text-to-speech) & Speech Synthesis (speech-to-text)

## Demo

Try it out: [Live Demo](https://swankylegg.github.io/assistant-io/)

### States

The assistant has four possible states:

- `IDLE`: Default state, not listening or speaking
- `LISTENING`: Actively listening for speech input
- `THINKING`: Transitional state between listening and responding
- `RESPONDING`: Currently speaking using speech synthesis

## Browser Support

This library uses the Web Speech API and requires browser support for:

- `SpeechRecognition` (or `webkitSpeechRecognition`)
- `speechSynthesis`

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
