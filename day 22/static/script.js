let ws = null;
let audioContext = null;
let gainNode = null;
let audioQueue = [];
let base64AudioChunks = [];
let isPlaying = false;
let nextStartTime = 0;
let isFirstAudio = true;
let currentTranscriptionMessage = null;

const SAMPLE_RATE = 44100;
const CHANNELS = 1;
const BITS_PER_SAMPLE = 16;
const BUFFER_GAP = 0.01;
const FADE_DURATION = 0.005;

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const retryBtn = document.getElementById("retryBtn");
const status = document.getElementById("status");
const chatWindow = document.getElementById("chatWindow");
const connectionStatus = document.getElementById("connectionStatus");

// Initialize WebSocket connection
function connectWebSocket() {
  ws = new WebSocket("ws://" + window.location.host + "/ws");

  ws.onopen = () => {
    console.log("WebSocket opened");
    connectionStatus.textContent = "Connected to server ✅";
    connectionStatus.classList.add("connected");
    startBtn.disabled = false;
  };

  ws.onmessage = async (event) => {
    const data = event.data;
    console.log("WebSocket message received:", data.substring(0, 100) + "...");

    // Handle JSON audio data
    if (data.startsWith("{")) {
      try {
        const jsonData = JSON.parse(data);
        if (jsonData.type === "audio" && jsonData.data) {
          console.log(
            "Audio chunk received, is_final:",
            jsonData.is_final,
            "length:",
            jsonData.data.length
          );
          base64AudioChunks.push(jsonData.data);
          await queueAudio(jsonData.data, jsonData.is_final);
        } else {
          console.warn("Invalid audio message format:", jsonData);
        }
      } catch (e) {
        console.error("Error parsing JSON message:", e);
        status.textContent = "Error: Invalid audio data received ❌";
      }
      return;
    }

    // Handle text messages
    if (data === "Started transcription") {
      status.textContent = "Status: Transcribing 🎤";
      currentTranscriptionMessage = document.createElement("div");
      currentTranscriptionMessage.className = "message sent";
      currentTranscriptionMessage.innerHTML =
        '<span class="spinner">⏳</span><span class="text"></span>';
      chatWindow.appendChild(currentTranscriptionMessage);
      chatWindow.scrollTop = chatWindow.scrollHeight;
      startBtn.style.display = "none";
      stopBtn.style.display = "inline-block";
      retryBtn.style.display = "none";
    } else if (data === "turn_ended") {
      status.textContent = "Status: Processing response 🤖";
      if (currentTranscriptionMessage) {
        const spinner = currentTranscriptionMessage.querySelector(".spinner");
        if (spinner) spinner.remove();
      }
    } else if (data.startsWith("Stopped transcription")) {
      status.textContent = "Status: Idle ⏳";
      if (currentTranscriptionMessage) {
        const spinner = currentTranscriptionMessage.querySelector(".spinner");
        if (spinner) spinner.remove();
      }
      startBtn.style.display = "inline-block";
      stopBtn.style.display = "none";
      retryBtn.style.display = "inline-block";
      if (data.includes("saved")) {
        const filename = data.match(/saved: (.+)$/)[1];
        const savedMessage = document.createElement("div");
        savedMessage.className = "message received";
        savedMessage.innerHTML = `<span class="text">Audio saved as ${filename}</span>`;
        chatWindow.appendChild(savedMessage);
        chatWindow.scrollTop = chatWindow.scrollHeight;
      }
    } else if (
      data.startsWith("Error:") ||
      data.startsWith("Transcription error:")
    ) {
      status.textContent = `Error: ${data}`;
      if (currentTranscriptionMessage) {
        const spinner = currentTranscriptionMessage.querySelector(".spinner");
        if (spinner) spinner.remove();
      }
      startBtn.style.display = "inline-block";
      stopBtn.style.display = "none";
      retryBtn.style.display = "inline-block";
    } else if (data === "Already transcribing") {
      status.textContent = "Status: Already transcribing 🎤";
    } else {
      // Append transcription text as sent message
      if (currentTranscriptionMessage) {
        const textSpan = currentTranscriptionMessage.querySelector(".text");
        textSpan.textContent = data;
        chatWindow.scrollTop = chatWindow.scrollHeight;
      } else {
        // Fallback for AI response or unexpected text
        const message = document.createElement("div");
        message.className = "message received";
        message.innerHTML = `<span class="text">${data}</span>`;
        chatWindow.appendChild(message);
        chatWindow.scrollTop = chatWindow.scrollHeight;
      }
    }
  };

  ws.onclose = () => {
    console.log("WebSocket closed");
    connectionStatus.textContent = "Disconnected from server 🔌";
    connectionStatus.classList.remove("connected");
    startBtn.disabled = true;
    stopBtn.style.display = "none";
    retryBtn.style.display = "inline-block";
    status.textContent = "Status: Disconnected 🔌";
  };

  ws.onerror = () => {
    console.error("WebSocket error");
    connectionStatus.textContent = "Error connecting to server ❌";
    connectionStatus.classList.remove("connected");
    startBtn.disabled = true;
  };
}

// Initialize AudioContext
function initAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)({
      sampleRate: SAMPLE_RATE,
    });
    gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(0.8, audioContext.currentTime);
    gainNode.connect(audioContext.destination);
    console.log(
      "AudioContext initialized, sampleRate:",
      audioContext.sampleRate
    );
  }
}

// Decode base64 to ArrayBuffer
function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Create WAV header for combined playback
function createWavHeader(
  dataLength,
  sampleRate = SAMPLE_RATE,
  numChannels = CHANNELS,
  bitDepth = BITS_PER_SAMPLE
) {
  const blockAlign = (numChannels * bitDepth) / 8;
  const byteRate = sampleRate * blockAlign;
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);

  function writeStr(offset, str) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeStr(36, "data");
  view.setUint32(40, dataLength, true);

  return new Uint8Array(buffer);
}

// Combine and play WAV chunks
function playCombinedWavChunks(base64Chunks) {
  console.log("Combining WAV chunks, total chunks:", base64Chunks.length);
  const pcmData = [];

  for (let i = 0; i < base64Chunks.length; i++) {
    const bytes = base64ToArrayBuffer(base64Chunks[i]);
    pcmData.push(i === 0 ? bytes.slice(44) : bytes);
  }

  const totalPcm = new Uint8Array(
    pcmData.reduce((sum, c) => sum + c.length, 0)
  );
  let offset = 0;
  for (const part of pcmData) {
    totalPcm.set(part, offset);
    offset += part.length;
  }

  const wavHeader = createWavHeader(totalPcm.length);
  const finalWav = new Uint8Array(wavHeader.length + totalPcm.length);
  finalWav.set(wavHeader, 0);
  finalWav.set(totalPcm, wavHeader.length);

  const blob = new Blob([finalWav], { type: "audio/wav" });
  const url = URL.createObjectURL(blob);
  console.log("Combined WAV created, playing via Audio element");

  const audio = document.getElementById("audioPlayer");
  audio.src = url;
  audio.play().catch((e) => console.error("Error playing combined WAV:", e));
}

// Queue audio chunk
async function queueAudio(base64Audio, isFinal) {
  try {
    let pcmBuffer = base64ToArrayBuffer(base64Audio);
    if (isFirstAudio) {
      console.log("First audio chunk: skipping 44-byte WAV header");
      pcmBuffer = pcmBuffer.slice(44);
      isFirstAudio = false;
    }

    const int16 = new Int16Array(pcmBuffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768;
    }

    const audioBuffer = audioContext.createBuffer(
      CHANNELS,
      float32.length,
      SAMPLE_RATE
    );
    audioBuffer.copyToChannel(float32, 0);

    console.log(
      "Audio chunk processed, duration:",
      audioBuffer.duration,
      "isFinal:",
      isFinal
    );
    audioQueue.push({ buffer: audioBuffer, isFinal });

    if (isFinal) {
      playCombinedWavChunks(base64AudioChunks);
      audioQueue = [];
      base64AudioChunks = [];
      status.textContent = "Status: Audio playback complete (combined) ✅";
    } else {
      playNextAudio();
    }
  } catch (error) {
    console.error("Error processing audio:", error);
    status.textContent = "Error: Failed to play audio ❌";
  }
}

// Play queued audio chunks
function playNextAudio() {
  if (isPlaying || audioQueue.length === 0) {
    console.log(
      "Skipping playNextAudio: isPlaying=",
      isPlaying,
      "queue length=",
      audioQueue.length
    );
    return;
  }

  isPlaying = true;
  const { buffer, isFinal } = audioQueue.shift();
  const source = audioContext.createBufferSource();
  source.buffer = buffer;

  const chunkGain = audioContext.createGain();
  chunkGain.connect(gainNode);
  source.connect(chunkGain);

  const currentTime = audioContext.currentTime;
  const startTime = Math.max(nextStartTime, currentTime) + BUFFER_GAP;

  chunkGain.gain.setValueAtTime(0, startTime);
  chunkGain.gain.linearRampToValueAtTime(0.8, startTime + FADE_DURATION);
  chunkGain.gain.linearRampToValueAtTime(
    0,
    startTime + buffer.duration - FADE_DURATION
  );

  source.start(startTime);
  nextStartTime = startTime + buffer.duration;
  console.log(
    "Playing audio chunk, duration:",
    buffer.duration,
    "startTime:",
    startTime,
    "fadeDuration:",
    FADE_DURATION
  );

  source.onended = () => {
    isPlaying = false;
    if (isFinal) {
      audioQueue = [];
      nextStartTime = 0;
      isFirstAudio = true;
      console.log("Audio playback complete (real-time)");
    } else {
      playNextAudio();
    }
  };
}

// Event listeners
startBtn.addEventListener("click", () => {
  initAudioContext();
  isFirstAudio = true;
  base64AudioChunks = [];
  ws.send("start");
  console.log("Start transcription requested");
});

stopBtn.addEventListener("click", () => {
  ws.send("stop");
  console.log("Stop transcription requested");
});

retryBtn.addEventListener("click", () => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send("start");
    console.log("Retry transcription requested");
  } else {
    connectWebSocket();
    status.textContent = "Status: Reconnecting... 🔄";
    console.log("Reconnecting WebSocket");
  }
});

// Initialize
connectWebSocket();