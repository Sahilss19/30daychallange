from fastapi import FastAPI, Form, Request, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from dotenv import load_dotenv
import requests
import os
import shutil

# .env file se environment variables load karein
load_dotenv()

app = FastAPI()

# Static aur template directories ko mount karein
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# 'uploads' folder banayein agar yeh maujood nahi hai
UPLOADS_DIR = "uploads"
os.makedirs(UPLOADS_DIR, exist_ok=True)


# Murf API Key ko load karein
MURF_API_KEY = os.getenv("MURF_API_KEY")

@app.get("/")
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# --- Day 2/3: Text to Speech Endpoint ---
@app.post("/tts")
async def tts(text: str = Form(...)):
    if not MURF_API_KEY:
        return JSONResponse(status_code=500, content={"error": "API key not configured."})
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

# --- Day 5: New Audio Upload Endpoint ---.
@app.post("/upload-audio")
async def upload_audio(audio_file: UploadFile = File(...)):
    """
    Receives an audio file from the client, saves it to the 'uploads' directory,
    and returns file metadata.
    """
    file_path = os.path.join(UPLOADS_DIR, audio_file.filename)
    
    try:
        # File ko server par save karega
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(audio_file.file, buffer)

        # File ka size pata karega
        file_size = os.path.getsize(file_path)

        # Success response bhejega
        return JSONResponse(
            status_code=200,
            content={
                "message": "File uploaded successfully!",
                "filename": audio_file.filename,
                "content_type": audio_file.content_type,
                "size_bytes": file_size,
            },
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": "Could not save file", "details": str(e)},
        )
