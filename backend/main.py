import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

import rag

# Load environment variables
load_dotenv()

app = FastAPI(title="Obsidian AI Assistant API")

# Enable CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    sources: list[str] = []

class SetupRequest(BaseModel):
    vault_path: str
    openai_api_key: str

@app.get("/")
def read_root():
    return {"status": "Obsidian AI Backend is running."}

@app.post("/api/setup")
def setup_vault(request: SetupRequest):
    """
    Endpoint to receive the OpenAI API key and Obsidian vault path from the frontend.
    It will initialize the RAG system and begin ingesting notes.
    """
    try:
        # In a real app, you shouldn't just set env vars like this globally
        # for multiple users, but for a local personal assistant it's perfectly fine
        os.environ["OPENAI_API_KEY"] = request.openai_api_key
        
        # Initialize the vector DB
        success = rag.initialize_vault(request.vault_path)
        
        if success:
            return {"status": "success", "message": f"Successfully indexed vault at {request.vault_path}"}
        else:
            raise HTTPException(status_code=500, detail="Failed to index vault.")

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/chat", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest):
    """
    Endpoint to process a user's chat message using the RAG system.
    """
    if "OPENAI_API_KEY" not in os.environ:
         raise HTTPException(status_code=401, detail="OpenAI API key not set. Please setup the vault first.")
         
    try:
        answer, source_docs = rag.generate_answer(request.message)
        return ChatResponse(response=answer, sources=source_docs)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating answer: {str(e)}")

# To run: uvicorn main:app --reload
