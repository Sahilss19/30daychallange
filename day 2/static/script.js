async function generateTTS() {
  const text = document.getElementById('textInput').value;

  if (!text.trim()) {
    alert("Please enter some text.");
    return;
  }

  const formData = new FormData();
  formData.append('text', text);

  try {
    const response = await fetch('/tts', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (data.audio_url) {
      const audioPlayer = document.getElementById('audioPlayer');
      audioPlayer.src = data.audio_url;
      audioPlayer.hidden = false;
      audioPlayer.play();
    } else {
      alert('TTS generation failed.');
      console.error(data);
    }
  } catch (error) {
    alert("Error reaching the server.");
    console.error(error);
  }
}
