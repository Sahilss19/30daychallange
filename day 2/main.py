from fastapi import FastAPI, Request, Form
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from dotenv import load_dotenv
import os
import requests

# Load .env
load_dotenv()

MURF_API_KEY = os.getenv("ap2_91e9d492-0896-4b30-bf95-f472bbf47384")  # add this key in your .env

app = FastAPI()

# Serve static files (script.js)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Template HTML (index.html)
templates = Jinja2Templates(directory="templates")


@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.post("/tts")
async def tts(text: str = Form(...)):
    """
    This should call Murf's /generate API and return audio_url.
    """
    url = "https://api.murf.ai/v1/speech/generate"
    headers = {
        "accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": f"Bearer {MURF_API_KEY}"
    }
    payload = {
        "text": text,
        "voice": "en-US-wavenet-D",  # Replace with your desired voice
        "format": "mp3"
    }

    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        result = response.json()
        audio_url = result.get("audio_url")
        if audio_url:
            return {"audio_url": audio_url}
        else:
            return JSONResponse(content={"error": "Audio URL not found"}, status_code=500)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
