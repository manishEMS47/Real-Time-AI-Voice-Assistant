const https = require('https');
const { PassThrough } = require('stream');

// 60db streaming TTS provider.
// Mirrors the playht module: initialize() + play(text) -> Node Readable of mp3 bytes,
// so it drops straight into server.js's play_stream() (stream.on('data', ...)).
//
// Docs: POST https://api.60db.ai/tts-stream  -> NDJSON lines:
//   { "type": "chunk", "audioContent": "<base64>" }   (audio piece)
//   { "type": "complete" }                              (done)
//   { "type": "error",  "message": "..." }              (failure)
// The exact nesting isn't fully pinned down in the docs, so the parser below is
// tolerant of a few likely shapes (audioContent at top level or under chunk/data).

const TTS_STREAM_URL = 'https://api.60db.ai/tts-stream';

async function initialize() {
  console.log('60db: initializing');
  if (!process.env.DB60_API_KEY || !process.env.DB60_VOICE_ID) {
    console.error('Please provide DB60_API_KEY and DB60_VOICE_ID in the env file');
    process.exit(1);
  }
}

// Pull base64 audio out of an NDJSON message regardless of which shape 60db uses.
function extractAudio(msg) {
  if (typeof msg.audioContent === 'string') return msg.audioContent;
  if (msg.chunk && typeof msg.chunk.audioContent === 'string') return msg.chunk.audioContent;
  if (msg.data && typeof msg.data.audioContent === 'string') return msg.data.audioContent;
  if (typeof msg.chunk === 'string') return msg.chunk; // chunk holds the base64 directly
  return null;
}

function isError(msg) {
  return msg.type === 'error' || msg.error !== undefined;
}

function errorMessage(msg) {
  return msg.message || (msg.error && (msg.error.message || msg.error)) || '60db tts-stream error';
}

function handleLine(line, out) {
  let msg;
  try {
    msg = JSON.parse(line);
  } catch (e) {
    return; // ignore non-JSON / partial lines
  }

  if (isError(msg)) {
    out.destroy(new Error(errorMessage(msg)));
    return;
  }

  const audio = extractAudio(msg);
  if (audio) {
    out.write(Buffer.from(audio, 'base64'));
  }
  // a "complete" message just means no more audio; out.end() fires on response 'end'
}

async function play(text) {
  // PassThrough lets us return a Node Readable immediately while we decode chunks into it.
  const out = new PassThrough();

  const body = JSON.stringify({
    text,
    voice_id: process.env.DB60_VOICE_ID,
    output_format: 'mp3', // keep mp3 so the browser's audio/mpeg MediaSource pipeline is unchanged
    enhance: true,
    speed: Number(process.env.DB60_SPEED || 1),
    stability: Number(process.env.DB60_STABILITY || 50),
    similarity: Number(process.env.DB60_SIMILARITY || 75),
  });

  const req = https.request(
    TTS_STREAM_URL,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.DB60_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    },
    (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        let errBody = '';
        res.setEncoding('utf8');
        res.on('data', (d) => (errBody += d));
        res.on('end', () =>
          out.destroy(new Error(`60db tts-stream HTTP ${res.statusCode}: ${errBody}`))
        );
        return;
      }

      let buffer = '';
      res.setEncoding('utf8');
      res.on('data', (data) => {
        buffer += data;
        let idx;
        // process every complete NDJSON line; keep the remainder buffered
        while ((idx = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, idx).trim();
          buffer = buffer.slice(idx + 1);
          if (line) handleLine(line, out);
        }
      });
      res.on('end', () => {
        const tail = buffer.trim();
        if (tail) handleLine(tail, out);
        out.end();
      });
      res.on('error', (e) => out.destroy(e));
    }
  );

  req.on('error', (e) => out.destroy(e));
  req.write(body);
  req.end();

  return out;
}

module.exports = {
  play,
  initialize,
};
