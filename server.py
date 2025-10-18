
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import os, uvicorn

app = FastAPI(title="Momentum Tetris Demo — Vault Toast")
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def root():
    return HTMLResponse(open("static/index.html", encoding="utf-8").read())

@app.get("/api/health")
def health():
    return {"status": "ok", "app": "momentum-tetris-vault-toast", "version": "1.0.0"}

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=int(os.getenv("PORT", "8080")), reload=False)
