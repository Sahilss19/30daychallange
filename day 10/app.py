# main.py

from fastapi import FastAPI, Form, Request, UploadFile, File, Path
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from dotenv import load_dotenv
import requests
import os
import assemblyai as aai
import google.generativeai as genai
from typing import Dict, List, Any

load_dotenv()

app = FastAPI()

# Static files aur templates ko configure karna
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

MURF_API_KEY = os.getenv("MURF_API_KEY")
ASSEMBLYAI_API_KEY = os.getenv("ASSEMBLYAI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if ASSEMBLYAI_API_KEY:
    aai.settings.api_key = ASSEMBLYAI_API_KEY
else:
    print("Warning: ASSEMBLYAI_API_KEY .env file me nahi mila.")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("Warning: GEMINI_API_KEY .env file me nahi mila.")

# Memory me chat histories store karne ka system.
# Key = session_id, Value = chat history list jo Gemini API use karega
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
    if not (GEMINI_API_KEY and ASSEMBLYAI_API_KEY and MURF_API_KEY):
        return JSONResponse(status_code=500, content={"error": "Ek ya zyada API keys configure nahi hain."})

    try:
        # Step 1: Audio ko text me convert karna (Speech-to-Text) using AssemblyAI SDK
        # SDK manual upload/polling se zyada reliable hota hai
        transcriber = aai.Transcriber()
        transcript = transcriber.transcribe(audio_file.file)

        if transcript.status == aai.TranscriptStatus.error:
            return JSONResponse(status_code=500, content={"error": f"Transcription fail hui: {transcript.error}"})

        user_query_text = transcript.text
        if not user_query_text:
            return JSONResponse(status_code=400, content={"error": "Audio me koi speech detect nahi hui."})
        
        # Step 2: Purani chat history nikalna aur Gemini LLM se reply lena
        session_history = chat_histories.get(session_id, [])
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Purani history ke sath chat start karna taki conversation continuous rahe
        chat = model.start_chat(history=session_history)
        response = chat.send_message(user_query_text)
        llm_response_text = response.text

        # Step 3: Chat history ko update karna
        # chat object ki history me user ka naya message aur model ka reply dono hote hain
        chat_histories[session_id] = chat.history

        # Step 4: LLM ka text response Murf AI se speech me convert karna
        murf_voice_id = "en-IN-priya"  # Isse koi aur valid Murf voice ID se change kar sakte ho
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
            return JSONResponse(status_code=500, content={"error": "Murf API ne koi audio file return nahi ki."})

    except Exception as e:
        print(f"Error aayi: {e}")
        return JSONResponse(status_code=500, content={"error": f"Kuch unexpected error aayi: {str(e)}"})
