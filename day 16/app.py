# main.py

from fastapi import FastAPI, Request, UploadFile, File, Path, WebSocket
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from dotenv import load_dotenv
import requests
import os
import assemblyai as aai
import google.generativeai as genai
from typing import Dict, List, Any
import logging
from starlette.websockets import WebSocketDisconnect

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from .env
load_dotenv()

app = FastAPI()

# --- Configure static files and HTML templates
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# --- Load API Keys
MURF_API_KEY = os.getenv("MURF_API_KEY")
ASSEMBLYAI_API_KEY = os.getenv("ASSEMBLYAI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# --- Configure third-party APIs
if ASSEMBLYAI_API_KEY:
    aai.settings.api_key = ASSEMBLYAI_API_KEY
else:
    logger.warning("ASSEMBLYAI_API_KEY not found in .env file.")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    logger.warning("GEMINI_API_KEY not found in .env file.")

# In-memory datastore for chat histories
chat_histories: Dict[str, List[Dict[str, Any]]] = {}

@app.get("/")
async def home(request: Request):
    """Serves the main HTML page for the application."""
    return templates.TemplateResponse("index.html", {"request": request})


# --- WebSocket Endpoint to receive and save binary audio ---
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    logger.info("🎤 New client connected for audio stream.")
    
    audio_file_path = "recorded_audio.webm"
    
    try:
        with open(audio_file_path, "wb") as audio_file:
            while True:
                data = await websocket.receive_bytes()
                audio_file.write(data)
    except WebSocketDisconnect:
        logger.info("🔴 Client disconnected.")
    except Exception as e:
        logger.error(f"⚠️ WebSocket error: {e}")
    finally:
        logger.info(f"✅ Audio stream saved to {audio_file_path}")


# --- Agent Chat Endpoint ---
@app.post("/agent/chat/{session_id}")
async def agent_chat(
    session_id: str = Path(..., description="The unique ID for the chat session."),
    audio_file: UploadFile = File(...)
):
    """
    Handles a full conversational turn for the agent:
    STT -> LLM -> TTS, with chat history.
    """
    fallback_audio_path = "static/fallback.mp3"

    if not (GEMINI_API_KEY and ASSEMBLYAI_API_KEY and MURF_API_KEY):
        return FileResponse(fallback_audio_path, media_type="audio/mpeg", headers={"X-Error": "true"})

    try:
        # --- STT (Speech to Text) ---
        transcriber = aai.Transcriber()
        transcript = transcriber.transcribe(audio_file.file)

        if transcript.status == aai.TranscriptStatus.error or not transcript.text:
            raise Exception(f"Transcription failed: {transcript.error or 'No speech detected'}")

        user_query_text = transcript.text

        # --- LLM ---
        session_history = chat_histories.get(session_id, [])
        model = genai.GenerativeModel("gemini-1.5-flash")
        chat = model.start_chat(history=session_history)

        response = chat.send_message(user_query_text)
        llm_response_text = response.text

        chat_histories[session_id] = chat.history

        # --- TTS (Murf AI) ---
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
            raise Exception("Murf API did not return an audio file.")

    except Exception as e:
        logger.error(f"❌ Error in agent_chat: {e}")
        return FileResponse(fallback_audio_path, media_type="audio/mpeg", headers={"X-Error": "true"})
