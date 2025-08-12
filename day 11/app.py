# main.py

from fastapi import FastAPI, Form, Request, UploadFile, File, Path, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from dotenv import load_dotenv
import requests
import os
import assemblyai as aai
import google.generativeai as genai
from typing import Dict, List, Any

# Load environment variables from .env
load_dotenv()

app = FastAPI()

# --- Static files aur templates ko configure karna
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# --- API Keys
MURF_API_KEY = os.getenv("MURF_API_KEY")
ASSEMBLYAI_API_KEY = os.getenv("ASSEMBLYAI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# --- Configure APIs
if ASSEMBLYAI_API_KEY:
    aai.settings.api_key = ASSEMBLYAI_API_KEY
else:
    print("Warning: ASSEMBLYAI_API_KEY .env file me nahi mila.")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("Warning: GEMINI_API_KEY .env file me nahi mila.")

# Memory me chat histories store karne ka system.
chat_histories: Dict[str, List[Dict[str, Any]]] = {}


@app.get("/")
async def home(request: Request):
    """Main HTML page serve karne ka kaam."""
    return templates.TemplateResponse("index.html", {"request": request})


@app.post("/agent/chat/{session_id}")
async def agent_chat(
    session_id: str = Path(..., description="Chat session ka unique ID."),
    audio_file: UploadFile = File(...)
):
    """
    Ye function ek conversation turn handle karta hai.
    Steps: STT -> History me add karo -> LLM -> History update karo -> TTS
    """
    # Path for the fallback audio file
    fallback_audio_path = "static/fallback.mp3"

    if not (GEMINI_API_KEY and ASSEMBLYAI_API_KEY and MURF_API_KEY):
        return FileResponse(fallback_audio_path, media_type="audio/mpeg", headers={"X-Error": "true"})

    try:
        # Step 1: Audio ko text me convert karna (Speech-to-Text) using AssemblyAI SDK
        # Agar ye step fail hota hai, to error catch hoga.
        transcriber = aai.Transcriber()
        transcript = transcriber.transcribe(audio_file.file)

        if transcript.status == aai.TranscriptStatus.error or not transcript.text:
            raise Exception(f"Transcription fail hui: {transcript.error or 'No speech detected'}")

        user_query_text = transcript.text
      
        # Step 2: Purani chat history nikalna aur Gemini LLM se reply lena
        # Agar Gemini se error aati hai, to yaha catch hoga.
        session_history = chat_histories.get(session_id, [])
        model = genai.GenerativeModel('gemini-1.5-flash')
      
        chat = model.start_chat(history=session_history)
        response = chat.send_message(user_query_text)
        llm_response_text = response.text

        # Step 3: Chat history ko update karna
        chat_histories[session_id] = chat.history

        # Step 4: LLM ka text response Murf AI se speech me convert karna
        # Agar Murf se error aati hai, to yaha catch hoga.
        murf_voice_id = "en-IN-priya"
        url = "https://api.murf.ai/v1/speech/generate"
        headers = {"Content-Type": "application/json", "api-key": MURF_API_KEY}
        payload = {
            "text": llm_response_text,
            "voiceId": murf_voice_id,
            "format": "MP3",
            "volume": "100%"
        }

        murf_response = requests.post(url, json=payload, headers=headers)
        murf_response.raise_for_status()
        response_data = murf_response.json()
        audio_url = response_data.get("audioFile")

        if audio_url:
            return JSONResponse(content={
                "audio_url": audio_url,
                "user_query_text": user_query_text,
                "llm_response_text": llm_response_text
            })
        else:
            raise Exception("Murf API ne koi audio file return nahi ki.")

    except Exception as e:
        # Agar upar ke kisi bhi step me error aati hai, to yeh block chalta hai
        print(f"Error aayi: {e}")
        return FileResponse(fallback_audio_path, media_type="audio/mpeg", headers={"X-Error": "true"})