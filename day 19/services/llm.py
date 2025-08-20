import google.generativeai as genai
import os
from typing import List, Dict

# Gemini API key load karo
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("⚠️ Warning: GEMINI_API_KEY not found in .env file.")


def get_llm_response(user_text: str, history: List[Dict]) -> str:
    """
    Simple non-streaming response from Gemini.
    """
    if not user_text.strip():
        return "⚠️ Error: Empty input, please say something."

    model = genai.GenerativeModel("gemini-1.5-flash")
    chat = model.start_chat(history=history)
    response = chat.send_message(user_text)

    return response.text.strip()


def stream_llm_response(user_text: str, history: List[Dict]) -> str:
    """
    Streaming response from Gemini (returns full text at the end).
    """
    if not user_text.strip():
        return "⚠️ Error: Empty input, please say something."

    model = genai.GenerativeModel("gemini-1.5-flash")
    chat = model.start_chat(history=history)

    response_stream = chat.send_message(user_text, stream=True)

    full_response = ""
    for chunk in response_stream:
        if chunk.text:
            full_response += chunk.text
    return full_response.strip()
