 My AI Voice Assistant - Building with #BuildwithMurf and #30DaysofVoiceAgents!


Hey everyone! 👋 I'm excited to share my latest project: a simple yet powerful AI voice assistant! This project is part of the #BuildwithMurf and #30DaysofVoiceAgents challenge, and it's been an incredible learning experience.

✨ What It Does
Talk to AI! 🎙️ Speak into your microphone and have a natural conversation.

Remembers Your Chat! The assistant keeps track of your previous messages.

Handles Errors Like a Pro! 💪 Built with robust error handling, so no crashes if an AI service hiccups. You'll get a friendly message instead.

Clean & Simple Interface! 📱 A user-friendly chat design with an animated microphone button.

🛠️ Built Using
Backend (Brain): Python with FastAPI

Frontend (Looks & Feels): HTML , CSS , JavaScript 

Speech-to-Text: AssemblyAI 

AI Model: Google Gemini 

Text-to-Speech: Murf AI 

Get it Running Locally!
Want to try it out? Here’s how:

Grab the Code: Make sure you have all the project files (main.py, .env, requirements.txt, static/, templates/).

Install Tools: Open your terminal in the project folder and run:
pip install -r requirements.txt

Add Your Secret Keys: Fill in your API keys in the .env file:

MURF_API_KEY="your_murf_api_key_here"
ASSEMBLYAI_API_KEY="your_assemblyai_api_key_here"
GEMINI_API_KEY="your_gemini_api_key_here"

Fire Up the Server: Run this command in your terminal:
uvicorn main:app --reload

Open in Your Browser: Go to http://127.0.0.1:8000 and start chatting!

I'll be sharing more about my journey and specific features soon! Stay tuned! 😉

#AI #VoiceAssistant #Python #FastAPI #JavaScript #MachineLearning #MurfAI #30DaysOfVoiceAgents #BuildWithMurf #India