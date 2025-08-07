from fastapi import FastAPI, Form, Request, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from dotenv import load_dotenv
import requests
import os
import shutil
import assemblyai as aai # AssemblyAI ko import karein

# .env file se environment variables load karein
load_dotenv()

app = FastAPI()

# Static aur template directories ko mount karein
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# API Keys ko load karein
MURF_API_KEY = os.getenv("MURF_API_KEY")
ASSEMBLYAI_API_KEY = os.getenv("ASSEMBLYAI_API_KEY")

# AssemblyAI ko configure karein
aai.settings.api_key = ASSEMBLYAI_API_KEY


@app.get("/")
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# --- Day 2/3: Text to Speech Endpoint ---
@app.post("/tts")
async def tts(text: str = Form(...)):
    # (Yeh code waisa hi rahega)
    if not MURF_API_KEY:
        return JSONResponse(status_code=500, content={"error": "Murf API key not configured."})
    url = "https://api.murf.ai/v1/speech/generate"
    headers = {"Accept": "application/json", "Content-Type": "application/json", "api-key": MURF_API_KEY}
    payload = {"text": text, "voiceId": "en-US-natalie", "format": "MP3"}
    try:
        response = requests.post(url, json=payload, headers=headers)
        if response.status_code == 200:
            return JSONResponse(content={"audio_url": response.json().get("audioFile")})
        else:
            return JSONResponse(status_code=500, content={"error": "TTS failed", "details": response.text})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": "Server error", "details": str(e)})

# --- Day 6: New Audio Transcription Endpoint ---
@app.post("/transcribe/file")
async def transcribe_file(audio_file: UploadFile = File(...)):
    """
    Receives an audio file, transcribes it using AssemblyAI,
    and returns the transcription text.
    """
    if not ASSEMBLYAI_API_KEY:
        return JSONResponse(status_code=500, content={"error": "AssemblyAI API key not configured."})

    try:
        #directly use AssemblyAI's Transcriber
        transcriber = aai.Transcriber()
        transcript = transcriber.transcribe(audio_file.file)

        if transcript.status == aai.TranscriptStatus.error:
            return JSONResponse(status_code=500, content={"error": transcript.error})
        else:
            return JSONResponse(content={"transcription": transcript.text})

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": "Transcription failed", "details": str(e)})