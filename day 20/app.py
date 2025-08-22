from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import logging, asyncio, json
from pathlib import Path as PathLib
from uuid import uuid4

# Import config and services
import config
from services import llm

# AssemblyAI streaming imports
import assemblyai as aai
from assemblyai.streaming.v3 import (
    BeginEvent, StreamingClient, StreamingClientOptions,
    StreamingError, StreamingEvents, StreamingParameters,
    TerminationEvent, TurnEvent,
)

logging.basicConfig(level=logging.ERROR, format="")  

# FastAPI init
app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Chat history memory
chat_histories = {}

# Uploads folder
BASE_DIR = PathLib(__file__).resolve().parent
UPLOADS_DIR = BASE_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)


@app.get("/")
async def home(request: Request):
    """Serve main HTML page"""
    return templates.TemplateResponse("index.html", {"request": request})


@app.websocket("/ws")
async def websocket_audio_streaming(websocket: WebSocket):
    """
    Client se PCM audio chunks aayenge -> AssemblyAI ko bhejna h -> 
    Transcript milne ke baad LLM streaming response console me print karna h
    """
    await websocket.accept()
    file_id = uuid4().hex
    file_path = UPLOADS_DIR / f"streamed_{file_id}.pcm"

    # API key check
    if not config.ASSEMBLYAI_API_KEY:
        await websocket.send_text(json.dumps({"type": "error", "message": "AssemblyAI API key missing"}))
        await websocket.close()
        return

    # Queue for transcription messages
    transcription_queue = asyncio.Queue()

    # AssemblyAI client
    client = StreamingClient(
        StreamingClientOptions(api_key=config.ASSEMBLYAI_API_KEY, api_host="streaming.assemblyai.com")
    )

    # ---- Event Handlers ----
    def on_begin(self, event: BeginEvent):
        print(f"\n Session started: {event.id}")

    def on_turn(self, event: TurnEvent):
        transcript = event.transcript

        if event.end_of_turn:
            print(f"\n User: {transcript}")
            try:
                session_id = "default_session"
                history = chat_histories.get(session_id, [])
                llm_response = llm.stream_llm_response(transcript, history)
                print(f" Ai: {llm_response}\n")

                chat_histories[session_id] = history + [
                    {"role": "user", "parts": transcript},
                    {"role": "model", "parts": llm_response}
                ]
            except Exception as e:
                print(f"⚠️ LLM streaming error: {e}")

            # Client ko final transcript bhejna
            transcription_queue.put_nowait({
                "type": "transcription", "text": transcript, "is_final": True, "end_of_turn": True
            })
            transcription_queue.put_nowait({"type": "turn_end", "message": "User stopped talking"})

    def on_terminated(self, event: TerminationEvent):
        print(f"🔴 Session terminated (Processed {event.audio_duration_seconds} seconds)")

    def on_error(self, error: StreamingError):
        print(f"⚠️ AssemblyAI error: {error}")

    # Register handlers
    client.on(StreamingEvents.Begin, on_begin)
    client.on(StreamingEvents.Turn, on_turn)
    client.on(StreamingEvents.Termination, on_terminated)
    client.on(StreamingEvents.Error, on_error)

    # ---- Background task to send messages to client ----
    async def send_transcriptions():
        while True:
            try:
                msg = await transcription_queue.get()
                await websocket.send_text(json.dumps(msg))
                transcription_queue.task_done()
            except Exception:
                break

    sender_task = asyncio.create_task(send_transcriptions())

    # Connect to AssemblyAI
    try:
        client.connect(StreamingParameters(sample_rate=16000, format_turns=True))
        await websocket.send_text(json.dumps({"type": "status", "message": "Connected to transcription service"}))

        with open(file_path, "wb") as f:
            while True:
                msg = await websocket.receive()
                if "bytes" in msg:
                    pcm = msg["bytes"]
                    f.write(pcm)
                    client.stream(pcm)  # AssemblyAI ko bhejo
                elif msg.get("text") == "EOF":
                    break

    except WebSocketDisconnect:
        print("⚠️ Client disconnected")
    finally:
        sender_task.cancel()
        client.disconnect(terminate=True)
        await websocket.close()
        print(f"🔴 Session ended, file saved at {file_path}")