document.addEventListener("DOMContentLoaded", () => {
  const recordBtn = document.getElementById("recordBtn");
  const statusDisplay = document.getElementById("statusDisplay");
  const chatLog = document.getElementById("chat-log");
  const personaSelect = document.getElementById("personaSelect");
  const personaLabel = document.getElementById("personaLabel");

  let isRecording = false;
  let ws = null;
  let audioContext;
  let mediaStream;
  let processor;
  let audioQueue = [];
  let isPlaying = false;

  // Change persona label dynamically
  personaSelect.addEventListener("change", () => {
    const persona = personaSelect.value;
    let label = "";
    if (persona === "cowboy") label = "Your Cowboy AI Assistant ";
    if (persona === "pirate") label = "Your Pirate AI Assistant";
    if (persona === "robot") label = "Your Robot AI Assistant ";
    if (persona === "teacher") label = "Your Teacher AI Assistant ";
    if (persona === "me") label = " @SahilKulria27 ";
    personaLabel.textContent = label;
  });

  // Add message to UI
  const addMessage = (text, type) => {
    const msgDiv = document.createElement("div");
    msgDiv.className = `message ${type}`;
    msgDiv.textContent = text;
    chatLog.appendChild(msgDiv);
    chatLog.scrollTop = chatLog.scrollHeight;
  };

  // Play queued WAV audio chunks
  const playNextInQueue = () => {
    if (audioQueue.length > 0) {
      isPlaying = true;
      const base64Audio = audioQueue.shift();

      // Convert base64 to blob (WAV)
      const audioData = Uint8Array.from(atob(base64Audio), (c) => c.charCodeAt(0));
      const blob = new Blob([audioData], { type: "audio/wav" });
      const url = URL.createObjectURL(blob);

      const audio = new Audio(url);
      audio.onended = () => {
        URL.revokeObjectURL(url);
        playNextInQueue();
      };
      audio.play().catch((e) => console.error("Playback error:", e));
    } else {
      isPlaying = false;
    }
  };

  // Start recording
  const startRecording = async () => {
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });

      const source = audioContext.createMediaStreamSource(mediaStream);
      processor = audioContext.createScriptProcessor(4096, 1, 1);
      source.connect(processor);
      processor.connect(audioContext.destination);
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 32767;
        }
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(pcmData.buffer);
        }
      };

      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      ws = new WebSocket(`${wsProtocol}//${window.location.host}/ws`);

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: "persona", value: personaSelect.value }));
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === "assistant") {
          addMessage(msg.text, "assistant");
        } else if (msg.type === "final") {
          addMessage(msg.text, "user");
        } else if (msg.type === "audio") {
          audioQueue.push(msg.b64);
          if (!isPlaying) playNextInQueue();
        }
      };

      isRecording = true;
      recordBtn.classList.add("recording");
      statusDisplay.textContent = "Listening...";
    } catch (error) {
      console.error("Mic error:", error);
      alert("Microphone access required.");
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (processor) processor.disconnect();
    if (mediaStream) mediaStream.getTracks().forEach((t) => t.stop());
    if (ws) ws.close();

    isRecording = false;
    recordBtn.classList.remove("recording");
    statusDisplay.textContent = "Ready to chat!";
  };

  // Toggle recording
  recordBtn.addEventListener("click", () => {
    if (isRecording) stopRecording();
    else startRecording();
  });
});
