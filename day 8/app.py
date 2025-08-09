from fastapi import FastAPI, Request, UploadFile, File, Form
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from dotenv import load_dotenv
import requests
import os
import time
import tempfile
import google.generativeai as genai  

# --- Load environment variables from .env ---
load_dotenv()
MURF_API_KEY = os.getenv("MURF_API_KEY")
ASSEMBLYAI_API_KEY = os.getenv("ASSEMBLYAI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

app = FastAPI()

# --- Static files (CSS/JS) aur templates (HTML) mount karna ---
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")




#gemini api ko configure -------------------------------------------------------------
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("Warning: GEMINI_API_KEY not found in .env file.")

# --- Home Route ---
@app.get("/")
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


# --- NEW: LLM Query Endpoint ---
@app.post("/llm/query")
async def llm_query(text: str = Form(...)):
    """
    Takes user input text and returns a Gemini API-generated response.
    """
    if not GEMINI_API_KEY:
        return JSONResponse(status_code=500, content={"error": "Gemini API key not configured."})

    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(text)
        return JSONResponse(content={"response": response.text})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


# --- Echo Bot V2: Speech to Text + Murf Voice Generation ---
@app.post("/tts/echo")
async def tts_echo(audio_file: UploadFile = File(...)):
    try:
        # Step 1: Audio file ko temporary file mein save karo
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            tmp.write(await audio_file.read())
            tmp_path = tmp.name

        # Step 2: Upload to AssemblyAI
        upload_url = "https://api.assemblyai.com/v2/upload"
        headers = {"authorization": ASSEMBLYAI_API_KEY}
        with open(tmp_path, "rb") as f:
            upload_response = requests.post(upload_url, headers=headers, data=f)

        os.remove(tmp_path)  # delete temp file after upload

        if upload_response.status_code != 200:
            return JSONResponse(status_code=500, content={"error": "AssemblyAI upload failed"})

        audio_url = upload_response.json().get("upload_url")

        # Step 3: Send for transcription
        transcript_req = {"audio_url": audio_url}
        headers["content-type"] = "application/json"
        transcript_response = requests.post(
            "https://api.assemblyai.com/v2/transcript", headers=headers, json=transcript_req
        )

        if transcript_response.status_code != 200:
            return JSONResponse(status_code=500, content={"error": "Transcription request failed"})

        transcript_id = transcript_response.json()["id"]

        # Step 4: Poll until transcription is complete
        polling_url = f"https://api.assemblyai.com/v2/transcript/{transcript_id}"
        while True:
            poll_response = requests.get(polling_url, headers=headers)
            poll_data = poll_response.json()

            if poll_data["status"] == "completed":
                transcribed_text = poll_data["text"]
                break
            elif poll_data["status"] == "error":
                return JSONResponse(status_code=500, content={"error": "Transcription failed"})

            time.sleep(2)  # Wait 2 seconds before next poll

        # Step 5: Murf AI TTS
        murf_url = "https://api.murf.ai/v1/speech/generate"
        murf_headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "api-key": MURF_API_KEY
        }
        murf_payload = {
            "text": transcribed_text,
            "voiceId": "en-IN-priya",
            "format": "MP3"
        }

        murf_response = requests.post(murf_url, headers=murf_headers, json=murf_payload)

        if murf_response.status_code != 200:
            return JSONResponse(status_code=500, content={"error": "Murf TTS failed"})

        murf_audio_url = murf_response.json().get("audioFile")

        return {
            "audio_url": murf_audio_url,
            "transcript": transcribed_text
        }

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
