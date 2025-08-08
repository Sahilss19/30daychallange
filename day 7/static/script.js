const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const echoPlayer = document.getElementById("echoPlayer");
const statusDiv = document.getElementById("status");

let mediaRecorder;
let audioChunks = [];

// Check if the browser supports MediaRecorder
if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
  alert(
    "Your browser does not support the MediaRecorder API. Please use a modern browser like Chrome or Firefox."
  );
}

// Start Recording Function
startBtn.onclick = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    // --- onstop event handler (Day 7 Update) ---
    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: "audio/wav" });

      // --- New Echo Logic for Day 7 ---
      statusDiv.textContent = " Wait for few sec... processing your voice...";
      const formData = new FormData();
      formData.append("audio_file", audioBlob, "user_recording.wav");

      try {
        // Call the new /tts/echo endpoint
        const response = await fetch("/tts/echo", {
          method: "POST",
          body: formData,
        });
        const result = await response.json();

        // FINAL FIX: Check for "audio_url" to match the server response
        if (response.ok && result.audio_url) {
          statusDiv.textContent = " Murf AI voice is readY :) ";
          echoPlayer.src = result.audio_url;
          echoPlayer.hidden = false;
          echoPlayer.play();
        } else {
          // UPDATED: Better error display
          let errorMsg = ` Error: ${result.error || "Request failed"}.`;
          if (result.details && result.details.message) {
            errorMsg += ` Details: ${result.details.message}`;
          } else if (result.details) {
            errorMsg += ` Details: ${JSON.stringify(result.details)}`;
          }
          statusDiv.textContent = errorMsg;
          console.error("Server returned an error:", result);
        }
      } catch (error) {
        console.error("Echo error:", error);
        statusDiv.textContent = " Failed to get a response from the server.";
      }
      // --- End of New Echo Logic ---

      audioChunks = [];
      stream.getTracks().forEach((track) => track.stop());
    };

    mediaRecorder.start();
    statusDiv.textContent = " Listening...";
    echoPlayer.hidden = true;
    echoPlayer.src = "";
    startBtn.disabled = true;
    stopBtn.disabled = false;
  } catch (err) {
    console.error("Error accessing microphone:", err);
    statusDiv.textContent = "Error: Could not access microphone.";
    alert(
      "Could not access the microphone. Please grant permission and try again."
    );
  }
};

// Stop Recording Function
stopBtn.onclick = () => {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
    statusDiv.textContent = "...Processing your voice...";
    startBtn.disabled = false;
    stopBtn.disabled = true;
  }
};