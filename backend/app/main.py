# ==========================================
# File: backend/app/main.py
# ==========================================


from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.services.rag_services import get_nexus_engine # ensure name matches your file
from app.routers import auth, chat, files
import os
# This runs exactly once when you start the server
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🧠 Nexus is warming up... (Downloading/Loading Models)")
    try:
        get_nexus_engine() # This triggers the first-time setup
        print("✅ Nexus Brain is Online and Ready.")
    except Exception as e:
        print(f"❌ Failed to warm up Nexus: {e}")
    yield

app = FastAPI(title="Project Nexus", lifespan=lifespan)

origins = [
    "http://localhost:5173",
    "https://nexus-nexus-mu.vercel.app", # You'll update this after Vercel deploy
]

# CORS
app.add_middleware(
    CORSMiddleware,
    # Use EXACTLY what is in your browser address bar
    allow_origins=origins, 
    allow_credentials=True, # Required for cookies
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(files.router)

@app.get("/")
def home():
    return {"status": "Online"}