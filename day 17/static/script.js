document.addEventListener("DOMContentLoaded", () => {
    // --- UI Elements ---
    const startBtn = document.getElementById("startBtn");
    const stopBtn = document.getElementById("stopBtn");
    const retryBtn = document.getElementById("retryBtn"); // Assuming this button is for reconnecting
    const status = document.getElementById("status");
    const connectionStatus = document.getElementById("connectionStatus");
    const transcriptionText = document.getElementById("transcriptionText");
    const spinner = document.querySelector(".spinner");

    // --- State Variables ---
    let mediaRecorder;
    let ws; // WebSocket connection

    // --- WebSocket Connection ---
    const setupWebSocket = () => {
        ws = new WebSocket("ws://127.0.0.1:8000/ws");

        ws.onopen = () => {
            console.log("WebSocket connected. Ready for transcription.");
            status.textContent = "Status: Connected ✅";
            connectionStatus.textContent = "Server connected ✅";
            spinner.style.display = "none";
            startBtn.style.display = "inline-block";
            stopBtn.style.display = "none";
            retryBtn.style.display = "none";
        };

        ws.onmessage = (event) => {
            // This handler is for real-time transcription messages from the server
            const message = event.data;
            if (message) {
                // Append partial transcripts and update final ones
                transcriptionText.textContent = message;
                console.log("Transcription: " + message);
            }
        };

        ws.onerror = (err) => {
            console.error("WebSocket error:", err);
            status.textContent = "Status: WebSocket connection failed ❌";
            connectionStatus.textContent = "Server disconnected 😞";
            spinner.style.display = "none";
            startBtn.style.display = "none";
            stopBtn.style.display = "none";
            retryBtn.style.display = "inline-block";
        };

        ws.onclose = () => {
            console.log("WebSocket disconnected.");
            status.textContent = "Status: Disconnected from server 😞";
            connectionStatus.textContent = "Server disconnected 😞";
            spinner.style.display = "none";
            startBtn.style.display = "none";
            stopBtn.style.display = "none";
            retryBtn.style.display = "inline-block";
        };
    };

    // --- Recording Logic ---
    const startRecording = async () => {
        if (!navigator.mediaDevices?.getUserMedia) {
            alert("Audio recording not supported in this browser.");
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            
            mediaRecorder.ondataavailable = (event) => {
                // Send audio chunks over the WebSocket
                if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
                    ws.send(event.data);
                }
            };

            mediaRecorder.onstart = () => {
                startBtn.style.display = "none";
                stopBtn.style.display = "inline-block";
                status.textContent = "Status: Transcribing... 🎙️";
                transcriptionText.textContent = "Transcribing... 🎙️";
                spinner.style.display = "inline";
            };

            mediaRecorder.onstop = () => {
                stream.getTracks().forEach(track => track.stop());
                stopBtn.style.display = "none";
                startBtn.style.display = "inline-block";
                status.textContent = "Status: Idle ⏳";
                spinner.style.display = "none";
                // Optionally send a message to the server to close the transcription session
                if (ws.readyState === WebSocket.OPEN) {
                    ws.close();
                }
            };
            
            mediaRecorder.start(100); // Start recording and send data every 100ms
        } catch (err) {
            console.error("Error accessing mic:", err);
            alert("Could not access microphone. Please check permissions.");
            status.textContent = "Status: Idle ⏳";
        }
    };

    // --- Event Listeners ---
    startBtn.addEventListener("click", startRecording);
    stopBtn.addEventListener("click", () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        }
    });
    retryBtn.addEventListener("click", () => {
        connectionStatus.textContent = "Reconnecting to server... 🔌";
        spinner.style.display = "inline";
        setupWebSocket();
    });
    
    // Initial setup when the page loads
    setupWebSocket();
});