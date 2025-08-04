from fastapi import FastAPI, Form, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from dotenv import load_dotenv
import requests
import os

load_dotenv()

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

MURF_API_KEY = os.getenv("MURF_API_KEY")

@app.get("/")
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/tts")
async def tts(text: str = Form(...)):
    # Check karein ki API key set hai ya nahi
    if not MURF_API_KEY:
        return JSONResponse(status_code=500, content={"error": "API key not configured."})

    # Murf API ka endpoint
    url = "https://api.murf.ai/v1/speech/generate"
    
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "api-key": MURF_API_KEY
    }

    # Murf API ke liye payload
    payload = {
        "text": text,
        "voiceId": "en-US-natalie",
        "format": "MP3",
        "sampleRate": 24000,
        "channelType": "STEREO"
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        
        if response.status_code == 200:
            response_data = response.json()
            audio_url = response_data.get("audioFile")
            
            if audio_url:
                return JSONResponse(content={"audio_url": audio_url})
            else:
                return JSONResponse(status_code=500, content={"error": "No audio URL in response"})
        else:
            return JSONResponse(status_code=500, content={"error": "TTS failed", "details": response.text})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": "Server error", "details": str(e)})