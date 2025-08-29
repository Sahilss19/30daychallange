# main.py
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import logging
import asyncio
import base64
import re

# Import services and config
import config
from services import stt, llm, tts

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

app = FastAPI()

# Mount static files for CSS/JS
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


@app.get("/")
async def home(request: Request):
    """Serves the main HTML page."""
    return templates.TemplateResponse("index.html", {"request": request})


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Handles WebSocket connection for real-time transcription and voice response."""
    await websocket.accept()
    logging.info("✅ WebSocket client connected.")

    loop = asyncio.get_event_loop()
    chat_history = []

    async def handle_transcript(text: str):
        """Processes the final transcript, gets LLM and TTS responses, and streams audio."""
        await websocket.send_json({"type": "final", "text": text})
        try:
            # 1. Call LLM (blocking → run in executor)
            if "search for" in text.lower() or "what is" in text.lower():
                full_response, updated_history = await loop.run_in_executor(
                    None, llm.get_web_response, text, chat_history
                )
            else:
                full_response, updated_history = await loop.run_in_executor(
                    None, llm.get_llm_response, text, chat_history
                )

            # Update history
            chat_history.clear()
            chat_history.extend(updated_history)

            # Send the full text response to the UI
            await websocket.send_json({"type": "assistant", "text": full_response})

            # 2. Split response into sentences for smoother playback
            sentences = re.split(r'(?<=[.?!])\s+', full_response.strip())

            # 3. Convert each sentence to speech
            for sentence in sentences:
                if sentence.strip():
                    audio_bytes = await loop.run_in_executor(None, tts.speak, sentence.strip())
                    if audio_bytes:
                        b64_audio = base64.b64encode(audio_bytes).decode("utf-8")
                        await websocket.send_json({"type": "audio", "b64": b64_audio})

        except Exception as e:
            logging.error(f"❌ Error in LLM/TTS pipeline: {e}")
            await websocket.send_json(
                {"type": "assistant", "text": "Sorry, I encountered an error."}
            )

    def on_final_transcript(text: str):
        """Callback when AssemblyAI returns a final transcript."""
        logging.info(f"🎤 Final transcript received: {text}")
        asyncio.run_coroutine_threadsafe(handle_transcript(text), loop)

    # Initialize AssemblyAI streaming
    transcriber = stt.AssemblyAIStreamingTranscriber(on_final_callback=on_final_transcript)

    try:
        while True:
            data = await websocket.receive_bytes()
            transcriber.stream_audio(data)

    except WebSocketDisconnect:
        logging.info("⚠️ WebSocket client disconnected.")

    except Exception as e:
        logging.error(f"❌ Unexpected WebSocket error: {e}")

    finally:
        transcriber.close()
        logging.info("🛑 Transcription resources released.")
