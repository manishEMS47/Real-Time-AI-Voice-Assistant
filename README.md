# Real-time Fast AI Voice assistant
## Features
- Fast AI Voice Assistant, takes <1 second to reply back to you.
- Built using Node.js and Websockets.
- AI Voice Assistant makes use of Groq API(AI models), deepgram api(STT) and playHT/60db/neets API (TTS)
- Switchable TTS provider: choose between **PlayHT** and **60db** via the `TTS_PROVIDER` env variable (Deepgram STT and Groq LLM stay the same).
- The voice assistance that actually listens to you when you speak or interrupt the assistant.
- Uses LLama 3 70b/8b or gemma 7b AI models.
- Has memory of your past conversations.
- You can stop the assistant by saying "Disconnect".
  
  ## Installation
  ### Clone this repository
  ```git clone https://github.com/xriddin/real-time-AI-voice-assistant.git```
  ### install the dependencies:
  ```npm i```
  ### Set up the API keys in .env file:
  - GROQ_API https://console.groq.com/keys
  - playht_api and playht_userId https://play.ht
  - deepgram_api https://console.deepgram.com
  - neets_api https://neets.ai/studio
  - 60db_api https://60db.ai (used when `TTS_PROVIDER=60db`)

  ### Choose your TTS provider:
  Set `TTS_PROVIDER` in the env file to pick which voice the assistant speaks with.

  **PlayHT (default):**
  ```
  TTS_PROVIDER=playht
  PLAY_API_KEY=your_playht_key
  PLAY_USERID=your_playht_userid
  ```

  **60db:**
  ```
  TTS_PROVIDER=60db
  DB60_API_KEY=your_60db_key
  DB60_VOICE_ID=your_60db_voice_id
  # optional tuning (defaults shown)
  DB60_SPEED=1
  DB60_STABILITY=50
  DB60_SIMILARITY=75
  ```
  60db uses the streaming `POST /tts-stream` endpoint and returns mp3 audio, so it
  plugs into the same playback/interruption pipeline as PlayHT — no other changes needed.
  Get a voice id from the `GET /myvoices` endpoint or the 60db dashboard.

  ### Start the Assistant
  ``` npm run start ```
  ### Contributing
  If you encounter bugs or have feature requests, please create an issue on GitHub. Pull requests are also appreciated. Don't forget to star this project if you find it useful!
  
  ### Thanks to the following projects:
- [Groq API](https://groq.com)
- [Deepgram API](https://deepgram.com)
- [PlayHT API](https://play.ht)
- [60db API](https://60db.ai)
- [Neets API](https://neets.ai/studio)
