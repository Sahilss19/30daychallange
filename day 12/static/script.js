document.addEventListener("DOMContentLoaded", () => {
    const recordBtn = document.getElementById("recordBtn");
    const audioPlayer = document.getElementById("audioPlayer");
    const statusDisplay = document.getElementById("statusDisplay");
    const chatHistoryDiv = document.getElementById("chatHistory");

    let mediaRecorder;
    let recordedChunks = [];
    let sessionId;

    // --- SESSION MANAGEMENT ---
    const urlParams = new URLSearchParams(window.location.search);
    sessionId = urlParams.get('session_id');
    if (!sessionId) {
        sessionId = crypto.randomUUID();
        window.history.replaceState({}, '', `?session_id=${sessionId}`);
    }

    // --- MAIN LOGIC ---

    const startRecording = async () => {
        if (!navigator.mediaDevices?.getUserMedia) {
            alert("Audio recording not supported in this browser.");
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            recordedChunks = [];
            mediaRecorder.start();

            recordBtn.classList.add("recording");
            statusDisplay.textContent = "Recording... Click to stop.";

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) recordedChunks.push(event.data);
            };

            mediaRecorder.onstop = () => {
                stream.getTracks().forEach(track => track.stop());
                recordBtn.classList.remove("recording");
                handleStopRecording();
            };

        } catch (err) {
            console.error("Error accessing mic:", err);
            alert("Could not access microphone. Please check permissions.");
            recordBtn.classList.remove("recording");
            statusDisplay.textContent = "Ready to chat!";
        }
    };

    const handleStopRecording = async () => {
        const blob = new Blob(recordedChunks, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("audio_file", blob, "recording.webm");

        statusDisplay.textContent = "Thinking...";
        recordBtn.disabled = true;

        try {
            const response = await fetch(`/agent/chat/${sessionId}`, {
                method: "POST",
                body: formData,
            });

            const isError = response.headers.get("X-Error") === "true";

            if (response.ok && !isError) {
                const result = await response.json();
                addMessageToChat('You', result.user_query_text, 'user-message');
                addMessageToChat('AI', result.llm_response_text, 'agent-message');
                statusDisplay.textContent = "Here is my response:";
                audioPlayer.src = result.audio_url;
                audioPlayer.play();
                audioPlayer.onended = () => {
                    statusDisplay.textContent = "Click the microphone to record again.";
                    recordBtn.disabled = false;
                };
            } else {
                const audioBlob = await response.blob();
                const fallbackAudioUrl = URL.createObjectURL(audioBlob);

                statusDisplay.textContent = `❌ Server Error: I'm having trouble right now.`;
                addMessageToChat('AI', "I'm having trouble connecting right now.", 'agent-message');

                audioPlayer.src = fallbackAudioUrl;
                audioPlayer.play();

                audioPlayer.onended = () => {
                    recordBtn.disabled = false;
                    statusDisplay.textContent = "Click the microphone to record again.";
                };
            }
        } catch (error) {
            console.error("Error with conversational agent:", error);
            addMessageToChat('AI', "❌ Network Error: Could not connect to the server.", 'agent-message');
            statusDisplay.textContent = "❌ An error occurred. Please try again.";

            audioPlayer.src = "/static/fallback.mp3";
            audioPlayer.play();
            audioPlayer.onended = () => {
                recordBtn.disabled = false;
            };
        }
    };

    function addMessageToChat(sender, message, className) {
        const p = document.createElement('p');
        p.className = className;
        p.textContent = message;
        chatHistoryDiv.appendChild(p);
        chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;
    }

    // --- Event Listeners for the single button ---
    recordBtn.addEventListener("click", () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        } else {
            startRecording();
        }
    });

    // Initial state setup
    statusDisplay.textContent = "Ready to chat!";
});