<p align="center">
  <img src="image/Silly AI .png" width="120" height="120" alt="Silly AI logo" />
</p>

<h1 align="center">🎭 Silly AI — Your Fun Voice Assistant</h1>

<p align="center">
  A quirky, PWA-ready voice assistant that listens, laughs, and replies with style.  
  <br/>Speak naturally, get witty responses, hear lifelike voice replies, and enjoy a playful UI.
</p>

<p align="center">
  <a href="https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white"><img src="https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white" alt="Python 3.10+" /></a>
  <a href="https://img.shields.io/badge/FastAPI-⚡-009688?logo=fastapi&logoColor=white"><img src="https://img.shields.io/badge/FastAPI-⚡-009688?logo=fastapi&logoColor=white" alt="FastAPI" /></a>
  <a href="https://img.shields.io/badge/PWA-Ready-5A0FC8?logo=pwa&logoColor=white"><img src="https://img.shields.io/badge/PWA-Ready-5A0FC8?logo=pwa&logoColor=white" alt="PWA Ready" /></a>
  <a href="https://img.shields.io/badge/License-MIT-blue"><img src="https://img.shields.io/badge/License-MIT-blue" alt="License" /></a>
</p>

---

## ✨ Highlights

- 🎤 **Conversational voice chat** with fun personality  
- 📝 **Text-only chat** for quick testing  
- 🔊 **Speech-to-text & lifelike voice replies**  
- 🎨 **Playful, animated UI** with smooth interactions  
- 📱 **Installable PWA** with offline caching  
- 🔐 **API key config** via `.env` or in-app settings  

<div align="center">
  <img src="image/main.png" alt="Silly AI screenshot" width="85%" style="border-radius: 12px;" />
  <br/>
</div>

---

## 🧭 Table of Contents

1. [Quickstart](#-quickstart)
2. [Environment & Config](#-environment--config)
3. [Architecture](#-architecture)
4. [Core Features](#-core-features)
5. [Project Structure](#-project-structure)
6. [Deployment](#-deployment)
7. [License](#-license)

---

## 🚀 Quickstart

### Prerequisites
- Python 3.10+  
- API keys for Speech-to-Text, LLM, and TTS  



python -m venv .venv
source .venv/bin/activate   # macOS/Linux
. .\.venv\Scripts\Activate.ps1  # Windows

# Install deps
pip install -r requirements.txt

# Add your keys to .env

<p align="center">
  <img src="image/Silly AI .png" width="120" height="120" alt="Silly AI logo" />
</p>

<h1 align="center">🎭 Silly AI — Your Fun Voice Assistant</h1>

<p align="center">
  A quirky, PWA-ready voice assistant that listens, laughs, and replies with style.  
  <br/>Speak naturally, get witty responses, hear lifelike voice replies, and enjoy a playful UI.
</p>

<p align="center">
  <a href="https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white"><img src="https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white" alt="Python 3.10+" /></a>
  <a href="https://img.shields.io/badge/FastAPI-⚡-009688?logo=fastapi&logoColor=white"><img src="https://img.shields.io/badge/FastAPI-⚡-009688?logo=fastapi&logoColor=white" alt="FastAPI" /></a>
  <a href="https://img.shields.io/badge/PWA-Ready-5A0FC8?logo=pwa&logoColor=white"><img src="https://img.shields.io/badge/PWA-Ready-5A0FC8?logo=pwa&logoColor=white" alt="PWA Ready" /></a>
  <a href="https://img.shields.io/badge/License-MIT-blue"><img src="https://img.shields.io/badge/License-MIT-blue" alt="License" /></a>
</p>

---

## ✨ Highlights

- 🎤 **Conversational voice chat** with fun personality  
- 📝 **Text-only chat** for quick testing  
- 🔊 **Speech-to-text & lifelike voice replies**  
- 🎨 **Playful, animated UI** with smooth interactions  
- 📱 **Installable PWA** with offline caching  
- 🔐 **API key config** via `.env` or in-app settings  

<div align="center">
  <img src="image/main.png" alt="Silly AI screenshot" width="85%" style="border-radius: 12px;" />
  <br/>
</div>

---

## 🧭 Table of Contents

1. [Quickstart](#-quickstart)
2. [Environment & Config](#-environment--config)
3. [Architecture](#-architecture)
4. [Core Features](#-core-features)
5. [Project Structure](#-project-structure)
6. [Deployment](#-deployment)
7. [License](#-license)

---

## 🚀 Quickstart

### Prerequisites
- Python 3.10+  
- API keys for Speech-to-Text, LLM, and TTS  



python -m venv .venv
source .venv/bin/activate   # macOS/Linux
. .\.venv\Scripts\Activate.ps1  # Windows

# Install deps
pip install -r requirements.txt

# Add your keys to .env

## 🔐 Environment & Config

Create a `.env` file inside `uploads/`:

```env
ASSEMBLYAI_API_KEY=your_key
GEMINI_API_KEY=your_key
MURF_API_KEY=your_key
SECRET_KEY=optional_secret_for_encryption

---

## 🏗 Architecture

```mermaid
sequenceDiagram
    participant User
    participant SillyAI_UI
    participant Express_Server
    participant AI_Model

    User->>SillyAI_UI: Speaks/Types input
    SillyAI_UI->>Express_Server: Sends request
    Express_Server->>AI_Model: Process input
    AI_Model-->>Express_Server: Returns response
    Express_Server-->>SillyAI_UI: Sends reply
    SillyAI_UI-->>User: Shows/Speaks output



## 🏗 Architecture

```mermaid
sequenceDiagram
    participant User
    participant SillyAI_UI
    participant Express_Server
    participant AI_Model

    User->>SillyAI_UI: Speaks/Types input
    SillyAI_UI->>Express_Server: Sends request
    Express_Server->>AI_Model: Process input
    AI_Model-->>Express_Server: Returns response
    Express_Server-->>SillyAI_UI: Sends reply
    SillyAI_UI-->>User: Shows/Speaks output

