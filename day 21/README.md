# 🎤 AI Voice Agent – #30DaysOfVoiceAgents Challenge

An **end-to-end AI-powered conversational voice bot** built with **FastAPI**, **AssemblyAI**, **Murf AI**, and **Google Gemini**.

This bot can:
- 🎙 Listen to your voice
- 📝 Transcribe speech to text
- 🤖 Understand context using an LLM
- 🔊 Reply in natural-sounding speech
- 💬 Maintain conversation history

---

## 📅 Journey: Day 1 – Day 13

| Day | Task | Key Outcome |
|-----|------|-------------|
| 1️⃣ | Project Setup | FastAPI + HTML/JS frontend |
| 2️⃣ | REST TTS API | Murf text-to-speech endpoint |
| 3️⃣ | Play TTS Audio | UI to play generated speech |
| 4️⃣ | Echo Bot v1 | Record & replay user voice |
| 5️⃣ | Send Audio to Server | Upload & save recordings |
| 6️⃣ | Server Transcription | AssemblyAI transcription |
| 7️⃣ | Echo Bot v2 | Murf voice for echo |
| 8️⃣ | LLM Integration | Google Gemini API |
| 9️⃣ | Full Pipeline | Voice → LLM → Voice |
| 🔟 | Chat History | Session-based memory |
| 1️⃣1️⃣ | Error Handling | Client & server resilience |
| 1️⃣2️⃣ | UI Revamp | Conversational UI & dynamic button |
| 1️⃣3️⃣ | Documentation | README + setup guide |
| 1️⃣4️⃣ |Refactor Code & GitHub |




---

## 🛠 Technologies
- **Backend**: FastAPI (Python)
- **Frontend**: HTML, CSS, JavaScript
- **STT**: [AssemblyAI](https://www.assemblyai.com/)
- **TTS**: [Murf AI](https://murf.ai/)
- **LLM**: [Google Gemini](https://ai.google.dev/)
- **Browser API**: MediaRecorder API

---

## 🏗 Architecture Diagram

```plaintext
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


✨ Features

🎤 Record voice directly in the browser

📝 Accurate transcription with AssemblyAI

🤖 Context-aware LLM responses

🔊 Realistic Murf voice output

💬 Persistent chat history

⚠ Error handling & fallback responses


==============================================================================================================================================================================

 File Structure
Ensure your project directory is organized as follows:

/my_project/
├── main.py
├── .env
├── requirements.txt
├── /static/
│   └── script.js
├── /templates/
│   └── index.html


==========================================================================================================================================================================

4.2. Install Dependencies
Activate your Python virtual environment and install the required packages:

Bash

pip install -r requirements.txt
The requirements.txt file should contain:

fastapi
uvicorn
python-dotenv
requests
assemblyai
google-generativeai
4.3. Set Environment Variables
Create and fill in your API keys in the .env file:

Code snippet

MURF_API_KEY="your_murf_api_key_here"
ASSEMBLYAI_API_KEY="your_assemblyai_api_key_here"
GEMINI_API_KEY="your_gemini_api_key_here"
4.4. Start the Server
From the project root directory, run the following command:

Bash

uvicorn main:app --reload
The application will be accessible at http://127.0.0.1:8000.