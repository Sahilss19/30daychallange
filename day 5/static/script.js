// TEXT TO SPEECH (Day 3) ---------------------
const generateBtn = document.getElementById('generateBtn');
const textInput = document.getElementById('textInput');
const ttsPlayer = document.getElementById('ttsPlayer');

generateBtn.onclick = async () => {
    // Agar textbox khali hai, toh alert show karo
    if (textInput.value.trim() === '') {
        alert('Please enter some text.');
        return;
    }

    // Text ko formData mein daal rahe hain
    const formData = new FormData();
    formData.append('text', textInput.value);

    try {
        // /tts API call kar rahe hain POST method se
        const response = await fetch('/tts', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        // Agar response OK mila aur audio URL aayi, toh play karo
        if (response.ok && data.audio_url) {
            ttsPlayer.src = data.audio_url;
            ttsPlayer.hidden = false;
            ttsPlayer.play();
        } else {
            alert('TTS generation failed.');
        }
    } catch (error) {
        alert('TTS error aaya.');
        console.error(error);
    }
};



// ECHO BOT (Day 4 & 5) -----------------------
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const echoPlayer = document.getElementById('echoPlayer');
const statusDiv = document.getElementById('status');

let mediaRecorder;       
let audioChunks = [];     

startBtn.onclick = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunks = [];

        mediaRecorder = new MediaRecorder(stream);

        // Jab bhi kuch audio data aaye, usse chunks mein store karo
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const audioUrl = URL.createObjectURL(audioBlob);

            echoPlayer.src = audioUrl;
            echoPlayer.hidden = false;
            echoPlayer.play();

            statusDiv.textContent = 'Uploading recording...';
            statusDiv.style.color = 'cyan';

            const formData = new FormData();
            formData.append('audio_file', audioBlob, 'recording.wav');

            try {
                const response = await fetch('/upload-audio', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (response.ok) {
                    statusDiv.textContent = `Uploaded: ${result.filename} (${(result.size_bytes / 1024).toFixed(1)} KB)`;
                    statusDiv.style.color = 'lightgreen';
                } else {
                    statusDiv.textContent = `Upload failed: ${result.error}`;
                    statusDiv.style.color = 'orange';
                }

            } catch (error) {
                console.error('Upload error:', error);
                statusDiv.textContent = 'Server se connect nahi ho paaya.';
                statusDiv.style.color = 'orange';
            }

            audioChunks = [];
            stream.getTracks().forEach(track => track.stop());

            startBtn.disabled = false;
            stopBtn.disabled = true;
        };

        // Ab recording chalu karo
        mediaRecorder.start();

        statusDiv.textContent = 'Recording...';
        statusDiv.style.color = 'red';
        startBtn.disabled = true;
        stopBtn.disabled = false;
        echoPlayer.hidden = true;

    } catch (err) {
        console.error(err);
        statusDiv.textContent = 'Mic access deny ho gaya.';
        statusDiv.style.color = 'orange';
    }
};


// Recording stop karne wala function
stopBtn.onclick = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        statusDiv.textContent = 'Processing audio...';
        statusDiv.style.color = 'lightblue';
        startBtn.disabled = false;
        stopBtn.disabled = true;
    }
};
