# 🎙️ Day 05: Server-Side Audio Processing

Welcome to **Day 5** of the #30DaysOfVoiceAgents challenge! Today, we're bridging the gap between the client and server by implementing a crucial feature: uploading recorded audio from the browser directly to our Python backend for processing and storage.

This update adds a new layer of functionality to our Echo Bot, turning it into a more robust application capable of handling user-generated audio data.



---

## ✨ Key Features

- **Client-to-Server Audio Upload:** The Echo Bot now uploads the recorded audio file to the server as soon as the recording stops.
- **New Backend Endpoint (`/upload-audio`):** A dedicated FastAPI endpoint to receive, process, and save incoming audio files.
- **Server-Side File Storage:** Uploaded audio is securely saved in a dedicated `/uploads` directory on the server.
- **Real-Time UI Status:** The user interface provides instant feedback on the upload status, showing messages like "Uploading..." and "Upload Complete!".
- **Voice Selection & Rate Control:** The advanced features from Day 4, such as voice selection and adjustable speaking rate for TTS, are still available.
- **Secure API Key Management:** API keys continue to be protected using a `.env` file.

---

## 🛠️ Tech Stack

- **Backend:** Python, FastAPI, Uvicorn
- **API Communication:** `requests`
- **Environment Management:** `python-dotenv`
- **Frontend:** HTML5, CSS3, JavaScript (`MediaRecorder` API)
- **Voice API:** Murf AI (Text-to-Speech)

---

## 🚀 Getting Started

Follow these steps to set up and run the enhanced project:

### 1. Prerequisites

- Python 3.8+ installed
- Murf AI account and API key

### 2. Clone the Repository

```bash
git clone [https://github.com/SajanKrSingh/30-days-of-voice-agents.git](https://github.com/SajanKrSingh/30-days-of-voice-agents.git)
cd 30-days-of-voice-agents/day-05
```

### 3. Create a Virtual Environment

```bash
python -m venv venv
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate
```

### 4. Install Dependencies

```bash
pip install -r requirements.txt
```

### 5. Set Up Environment Variables

Create a `.env` file in the `day-05/` directory and add your Murf API key:

```env
MURF_API_KEY="your_actual_murf_api_key_goes_here"
```

---

## ▶️ Run the Application

Start the server:

```bash
uvicorn main:app --reload
```

Visit:
`http://127.0.0.1:8000`

---

## 🧪 How to Use

The application now has two main functions:

**A. Text to Speech:**

1.  Enter your text in the input field.
2.  Select your preferred voice and adjust the speaking rate.
3.  Click **Generate Voice** to listen to the generated speech.

**B. Echo Bot (Audio Upload):**

1.  Navigate to the "Echo Bot" section on the page.
2.  Click **Start Recording** (you may need to grant microphone permission).
3.  Speak a message and then click **Stop Recording**.
4.  Watch the status message as your recording is uploaded to the server.
