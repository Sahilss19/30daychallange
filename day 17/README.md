🎤 AI Voice Agent – #30DaysOfVoiceAgents Challenge

An end-to-end AI-powered conversational voice bot built with FastAPI, AssemblyAI, Murf AI, and Google Gemini.

This bot can:

🎙 Listen to your voice

📝 Transcribe speech to text

🤖 Understand context using an LLM

🔊 Reply in natural-sounding speech

💬 Maintain conversation history

📅 Journey: Day 1 – Day 16
Day	Task	Key Outcome
1️⃣	Project Setup	FastAPI backend + HTML/JS frontend
2️⃣	REST TTS API	Murf text-to-speech endpoint working
3️⃣	Play TTS Audio	UI to send text → get speech playback
4️⃣	Echo Bot v1	Record & replay user voice (MediaRecorder API)
5️⃣	Send Audio to Server	Upload recorded audio to FastAPI
6️⃣	Server Transcription	AssemblyAI speech-to-text integration
7️⃣	Echo Bot v2	Murf AI speaks back what you said
8️⃣	LLM Integration	Google Gemini API connected
9️⃣	Full Pipeline	Voice → STT → LLM → TTS → Voice
🔟	Chat History	Session-based memory enabled
1️⃣1️⃣	Error Handling	Robust server & client fallbacks
1️⃣2️⃣	UI Revamp	Clean conversational UI & animated record button
1️⃣3️⃣	Documentation	Initial README & setup guide
1️⃣4️⃣	Refactor + GitHub	Services folder + schemas + logging
1️⃣5️⃣	WebSockets	Client-server messaging with /ws
1️⃣6️⃣	Streaming Audio	Real-time audio sent & saved via WebSocket
1️⃣7️⃣   WebSocket in UI HTML/JS frontend connects to /ws and exchanges live messages



🛠 Technologies

Backend: FastAPI (Python)

Frontend: HTML, CSS, JavaScript

STT: AssemblyAI

TTS: Murf AI

LLM: Google Gemini

Browser API: MediaRecorder API, WebSockets

🏗 Architecture Diagram
┌───────────────┐
│   User Voice  │
└───────┬───────┘
        │ 🎙
        ▼
┌────────────────────┐
│ STT (AssemblyAI)   │
│ Speech → Text      │
└─────────┬──────────┘
          │ 📝
          ▼
┌────────────────────┐
│ LLM (Google Gemini)│
│ Understand Context │
└─────────┬──────────┘
          │ 💡
          ▼
┌────────────────────┐
│ TTS (Murf AI)      │
│ Text → Speech      │
└─────────┬──────────┘
          │ 🔊
          ▼
┌────────────────────┐
│ Voice Response     │
└────────────────────┘

💬 Conversation history stored per session

✨ Features (till Day 16)

🎤 Record voice directly in the browser

📝 Accurate transcription with AssemblyAI

🤖 Context-aware LLM responses

🔊 Realistic Murf voice output

💬 Persistent chat history

⚡ WebSocket-based streaming pipeline

🛡 Error handling & resilience

📂 File Structure
/voice-agent/
├── app.py                # FastAPI entrypoint
├── .env                  # API keys
├── requirements.txt      
├── /services/            # STT, TTS, LLM integrations
├── /static/              # JS, CSS
│   └── script.js
├── /templates/           
│   └── index.html
├── /uploads/             # Temp audio files

⚙️ Setup & Run

1️⃣ Clone repo & install deps:

pip install -r requirements.txt


2️⃣ Add .env file:

MURF_API_KEY=your_murf_key
ASSEMBLYAI_API_KEY=your_assemblyai_key
GEMINI_API_KEY=your_gemini_key


3️⃣ Run server:

uvicorn app:app --reload


4️⃣ Open browser at:
👉 http://127.0.0.1:8000