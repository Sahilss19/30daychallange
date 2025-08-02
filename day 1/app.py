from fastapi import FastAPI
from fastapi.responses import FileResponse

app = FastAPI()

@app.get("/")
async def read_index():
    return FileResponse("index.html")

@app.get("/script.js")
async def read_script():
    
    return FileResponse("script.js")