from fastapi import FastAPI, Request, UploadFile, File
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

# --- Static files (CSS/JS) and templates (HTML) ---
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# --- Configure Gemini API ---
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("Warning: GEMINI_API_KEY not found in .env file.")

# --- Home Route ---
@app.get("/")
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


# --- LLM Query: Audio -> Transcription -> Gemini -> Murf TTS ---
@app.post("/llm/query")
async def llm_query(audio_file: UploadFile = File(...)):
    if not (GEMINI_API_KEY and ASSEMBLYAI_API_KEY and MURF_API_KEY):
        return JSONResponse(status_code=500, content={"error": "One or more API keys are not configured."})

    try:
        # Step 1: Save uploaded audio temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            tmp.write(await audio_file.read())
            tmp_path = tmp.name

        # Step 2: Upload to AssemblyAI
        upload_url = "https://api.assemblyai.com/v2/upload"
        headers = {"authorization": ASSEMBLYAI_API_KEY}
        with open(tmp_path, "rb") as f:
            upload_response = requests.post(upload_url, headers=headers, data=f)
        os.remove(tmp_path)

        if upload_response.status_code != 200:
            return JSONResponse(status_code=500, content={"error": "AssemblyAI upload failed"})

        audio_url = upload_response.json().get("upload_url")

        # Step 3: Start transcription
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
            poll_response = requests.get(polling_url, headers={"authorization": ASSEMBLYAI_API_KEY})
            poll_data = poll_response.json()

            if poll_data["status"] == "completed":
                user_query_text = poll_data["text"]
                break
            elif poll_data["status"] == "error":
                return JSONResponse(status_code=500, content={"error": "Transcription failed"})

            time.sleep(2)

        if not user_query_text:
            return JSONResponse(status_code=400, content={"error": "No speech detected in the audio."})

        # Step 5: Send transcript to Gemini LLM
        model = genai.GenerativeModel('gemini-1.5-flash')
        llm_response = model.generate_content(user_query_text)
        llm_text = llm_response.text

        # Step 6: Send LLM output to Murf for TTS
        murf_url = "https://api.murf.ai/v1/speech/generate"
        murf_headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "api-key": MURF_API_KEY
        }
        murf_payload = {
            "text": llm_text,
            "voiceId": "en-US-natalie",
            "format": "MP3",
            "volume": "100%"
        }
        murf_response = requests.post(murf_url, headers=murf_headers, json=murf_payload)

        if murf_response.status_code != 200:
            return JSONResponse(status_code=500, content={"error": "Murf TTS failed"})

        murf_audio_url = murf_response.json().get("audioFile")

        if not murf_audio_url:
            return JSONResponse(status_code=500, content={"error": "Murf API did not return an audio file."})

        return JSONResponse(content={
            "audio_url": murf_audio_url,
            "transcript": user_query_text,
            "llm_response": llm_text
        })

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


# --- Echo Bot V2: Just repeat speech in Murf voice ---
@app.post("/tts/echo")
async def tts_echo(audio_file: UploadFile = File(...)):
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            tmp.write(await audio_file.read())
            tmp_path = tmp.name

        upload_url = "https://api.assemblyai.com/v2/upload"
        headers = {"authorization": ASSEMBLYAI_API_KEY}
        with open(tmp_path, "rb") as f:
            upload_response = requests.post(upload_url, headers=headers, data=f)
        os.remove(tmp_path)

        if upload_response.status_code != 200:
            return JSONResponse(status_code=500, content={"error": "AssemblyAI upload failed"})

        audio_url = upload_response.json().get("upload_url")

        transcript_req = {"audio_url": audio_url}
        headers["content-type"] = "application/json"
        transcript_response = requests.post(
            "https://api.assemblyai.com/v2/transcript", headers=headers, json=transcript_req
        )

        if transcript_response.status_code != 200:
            return JSONResponse(status_code=500, content={"error": "Transcription request failed"})

        transcript_id = transcript_response.json()["id"]

        polling_url = f"https://api.assemblyai.com/v2/transcript/{transcript_id}"
        while True:
            poll_response = requests.get(polling_url, headers={"authorization": ASSEMBLYAI_API_KEY})
            poll_data = poll_response.json()

            if poll_data["status"] == "completed":
                transcribed_text = poll_data["text"]
                break
            elif poll_data["status"] == "error":
                return JSONResponse(status_code=500, content={"error": "Transcription failed"})

            time.sleep(2)

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
