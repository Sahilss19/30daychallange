document.addEventListener("DOMContentLoaded", () => {
  let mediaRecorder = null;
  let recordedChunks = [];

  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");
  const echoPlayer = document.getElementById("echoPlayer");
  const statusDiv = document.getElementById("status");
  const recordingIndicator = document.getElementById("recordingIndicator");

  startBtn.addEventListener("click", async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      alert("Audio recording not supported in this browser.");
      return;
    }

    startBtn.disabled = true;
    stopBtn.disabled = false;
    recordingIndicator.hidden = false;
    statusDiv.textContent = "🎤 Recording... Ask your question.";
    echoPlayer.hidden = true;
    recordedChunks = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordedChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        recordingIndicator.hidden = true;
        const blob = new Blob(recordedChunks, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("audio_file", blob, "recording.webm");

        statusDiv.textContent = "WAIT FOR FEW SEC BRO";

        try {
          const response = await fetch("/llm/query", {
            method: "POST",
            body: formData,
          });
          const result = await response.json();

          if (response.ok && result.audio_url) {
            statusDiv.textContent = "✅ AI RESPONSE  :)";
            echoPlayer.src = result.audio_url;
            echoPlayer.hidden = false;
            echoPlayer.classList.add("response-glow");
            echoPlayer.play();
            setTimeout(() => echoPlayer.classList.remove("response-glow"), 1000);
          } else {
            statusDiv.textContent = `❌ Error: ${result.error || "Failed to get response."}`;
          }
        } catch (error) {
          console.error("Error with conversational agent:", error);
          statusDiv.textContent = "❌ An error occurred during the process.";
        }
      };

      mediaRecorder.start();
    } catch (err) {
      console.error("Error accessing mic:", err);
      alert("Could not access microphone. Please check permissions.");
      startBtn.disabled = false;
      stopBtn.disabled = true;
      statusDiv.textContent = "";
    }
  });

  stopBtn.addEventListener("click", () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
    }
    stopBtn.disabled = true;
    startBtn.disabled = false;
    recordingIndicator.hidden = true;
  });
});
