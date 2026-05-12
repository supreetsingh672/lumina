from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import meta, summarize, chat, timestamp, playlist, synthesize

app = FastAPI(title="Lumina API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(meta.router, prefix="/api")
app.include_router(summarize.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(timestamp.router, prefix="/api")
app.include_router(playlist.router, prefix="/api")
app.include_router(synthesize.router, prefix="/api")


@app.get("/")
def root():
    return {"status": "ok", "service": "Lumina API"}


@app.get("/health")
def health():
    return {"status": "healthy"}
