// TTS provider selector.
// Set TTS_PROVIDER in the env to switch the voice the assistant speaks with:
//   TTS_PROVIDER=playht   (default)  -> models/playht.js
//   TTS_PROVIDER=60db                -> models/sixtydb.js
//
// Both providers expose the same contract:
//   initialize(): Promise<void>            -- validate keys / set up the client
//   play(text):   Promise<Readable>        -- Node stream of mp3 bytes
// so server.js stays identical regardless of which one is active.

const playht = require('./playht');
const sixtydb = require('./sixtydb');

const provider = (process.env.TTS_PROVIDER || 'playht').toLowerCase();

const providers = {
  playht,
  '60db': sixtydb,
  sixtydb,
};

const impl = providers[provider] || playht;

console.log(`tts: using provider "${impl === playht ? 'playht' : '60db'}"`);

module.exports = {
  play: impl.play,
  initialize: impl.initialize,
};
