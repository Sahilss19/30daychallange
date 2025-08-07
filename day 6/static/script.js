const generateBtn = document.getElementById('generateBtn');
const textInput = document.getElementById('textInput');
const ttsPlayer = document.getElementById('ttsPlayer');

generateBtn.onclick = async () => {
    // (Yeh code waisa hi rahega)
    if (textInput.value.trim() === '') { return; }
    const formData = new FormData();
    formData.append('text', textInput.value);
    try {
        const response = await fetch('/tts', { method: 'POST', body: formData });
        const data = await response.json();
        if (response.ok && data.audio_url) {
            ttsPlayer.src = data.audio_url;
            ttsPlayer.hidden = false;
            ttsPlayer.play();
        } else { alert('TTS generation failed.'); }
    } catch (error) { alert('An error occurred.'); }
};

// --- Speech to Text Bot (Day 4, 5 & 6) ---
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusDiv = document.getElementById('status');
const transcriptionOutput = document.getElementById('transcriptionOutput');

let mediaRecorder;
let audioChunks = [];

// Start Recording Function
startBtn.onclick = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        
        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };
        
        // --- onstop event handler (Day 6 Update) ---
        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            
            // --- New Transcription Logic for Day 6 ---
            statusDiv.textContent = 'WAIT FOR FEW SECONDS BRO...';
            const formData = new FormData();
            formData.append("audio_file", audioBlob, "recording.wav");

            try {
                const response = await fetch("/transcribe/file", {
                    method: "POST",
                    body: formData,
                });
                const result = await response.json();

                if (response.ok) {
                    statusDiv.textContent = ' Transcription Complete!';
                    transcriptionOutput.textContent = result.transcription || "Could not understand audio.";
                    transcriptionOutput.style.fontStyle = 'normal';
                } else {
                    statusDiv.textContent = ` Transcription failed.`;
                    transcriptionOutput.textContent = result.error || "An unknown error occurred.";
                }
            } catch (error) {
                console.error("Transcription error:", error);
                statusDiv.textContent = ' Transcription failed. Could not connect to server.';
            }
            // --- End of New Transcription Logic ---

            audioChunks = [];
            stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorder.start();
        statusDiv.textContent = ' Recording...';
        transcriptionOutput.textContent = 'Your transcribed text will appear here...';
        transcriptionOutput.style.fontStyle = 'italic';
        startBtn.disabled = true;
        stopBtn.disabled = false;
        
    } catch (err) {
        statusDiv.textContent = 'Error: Could not access microphone.';
    }
};

// Stop Recording Function
stopBtn.onclick = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        statusDiv.textContent = '...Processing...';
        startBtn.disabled = false;
        stopBtn.disabled = true;
    }
};