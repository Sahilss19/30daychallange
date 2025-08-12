document.addEventListener("DOMContentLoaded", () => {
    // --- UI Elements ---
    const startBtn = document.getElementById("startBtn");
    const stopBtn = document.getElementById("stopBtn");
    const audioPlayer = document.getElementById("audioPlayer");
    const statusDisplay = document.getElementById("statusDisplay");
    const recordingIndicator = document.getElementById("recordingIndicator");
    const sessionIdSpan = document.getElementById("sessionId");
    const chatHistoryDiv = document.getElementById("chatHistory");

    // --- State Variables ---
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
    
    // Check if the element exists before setting textContent
    if (sessionIdSpan) {
        const shortSessionId = `${sessionId.substring(0, 4)}...${sessionId.slice(-4)}`;
        sessionIdSpan.textContent = shortSessionId;
    }

    // --- MAIN LOGIC ---

    // Event listener to automatically start recording after the AI's response ends
    audioPlayer.addEventListener("ended", () => {
        statusDisplay.textContent = "I'm listening... Click Stop to send.";
        startRecording();
    });

    const startRecording = async () => {
        if (!navigator.mediaDevices?.getUserMedia) {
            alert("Audio recording not supported in this browser.");
            return;
        }

        startBtn.disabled = true;
        stopBtn.disabled = false;
        recordingIndicator.hidden = false;
        audioPlayer.hidden = true;
        recordedChunks = [];

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) recordedChunks.push(event.data);
            };

            mediaRecorder.onstop = () => {
                // The stream tracks should be stopped here to release the microphone
                stream.getTracks().forEach(track => track.stop());
                handleStopRecording();
            };

            mediaRecorder.start();
        } catch (err) {
            console.error("Error accessing mic:", err);
            alert("Could not access microphone. Please check permissions.");
            startBtn.disabled = false;
            stopBtn.disabled = true;
            recordingIndicator.hidden = true;
            statusDisplay.textContent = "Ready to chat!";
        }
    };

    const handleStopRecording = async () => {
        recordingIndicator.hidden = true;
        const blob = new Blob(recordedChunks, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("audio_file", blob, "recording.webm");

        statusDisplay.textContent = "Thinking...";
        startBtn.disabled = true;
        stopBtn.disabled = true;

        try {
            const response = await fetch(`/agent/chat/${sessionId}`, {
                method: "POST",
                body: formData,
            });
            
            // Check for the custom error header from the server
            const isError = response.headers.get("X-Error") === "true";

            if (response.ok && !isError) {
                const result = await response.json();
                
                addMessageToChat('You', result.user_query_text, 'user-message');
                addMessageToChat('AI', result.llm_response_text, 'agent-message');
                statusDisplay.textContent = "Here is my response:";
                audioPlayer.src = result.audio_url;
                audioPlayer.hidden = false;
                audioPlayer.play();
            } else {
                statusDisplay.textContent = `❌ Error: I'm having trouble connecting right now.`;
                
                const audioBlob = await response.blob();
                audioPlayer.src = URL.createObjectURL(audioBlob);
                audioPlayer.hidden = false;
                audioPlayer.play();

                startBtn.disabled = false;
            }
        } catch (error) {
            console.error("Error with conversational agent:", error);
            statusDisplay.textContent = "❌ An error occurred. Please try again.";
            
            audioPlayer.src = "/static/fallback.mp3"; 
            audioPlayer.hidden = false;
            audioPlayer.play();

            startBtn.disabled = false;
        }
    };

    function addMessageToChat(sender, message, className) {
        const p = document.createElement('p');
        p.className = className;
        p.textContent = `${sender}: ${message}`;
        chatHistoryDiv.appendChild(p);
        chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;
    }

    // Event listeners for UI buttons
    startBtn.addEventListener("click", () => {
        statusDisplay.textContent = "Recording... Click Stop to send.";
        startRecording();
    });

    stopBtn.addEventListener("click", () => {
        if (mediaRecorder && mediaRecorder.state === "recording") {
            mediaRecorder.stop();
        }
    });

    // Set initial status message when the page loads
    statusDisplay.textContent = "sahilkulria27";
});