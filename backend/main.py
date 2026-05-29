import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), "controllers"))

from typing import List

from fastapi import FastAPI, HTTPException, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from controllers.setup import setup_database
from controllers.ingest import (
    run_folder_ingestion,
    list_knowledge_base_files,
    save_uploaded_files,
    SUPPORTED_EXTENSIONS,
)
from controllers.answer import query_and_answer
 
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

DB_PATH = "./database/chroma_db"
DATA_PATH = "./database/context"

class ChatRequest(BaseModel):
    question: str
    model: str = "llama3.2:latest"
    top_k: int = 3
 
 
class ChatResponse(BaseModel):
    answer: str
    success: bool
 
 
@app.post("/setup")
def setup():
    try:
        success = setup_database(db_path=DB_PATH)
        if success:
            return {"success": True, "message": "Database setup complete."}
        else:
            raise HTTPException(status_code=500, detail="Database setup failed.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 
 
@app.post("/ingest")
def ingest(force_rebuild: bool = Query(default=False)):
    try:
        result = run_folder_ingestion(
            folder_path=DATA_PATH,
            db_path=DB_PATH,
            force_rebuild=force_rebuild,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/knowledgebase/files")
def knowledgebase_files():
    try:
        files = list_knowledge_base_files(folder_path=DATA_PATH)
        return {"success": True, "files": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/knowledgebase/upload")
async def upload_knowledgebase_files(files: List[UploadFile] = File(...)):
    if not files:
        raise HTTPException(status_code=400, detail="No files provided.")
    try:
        uploads = []
        for upload in files:
            content = await upload.read()
            if not content:
                continue
            uploads.append((upload.filename or "unnamed", content))
        if not uploads:
            raise HTTPException(status_code=400, detail="All uploaded files were empty.")

        saved, errors = save_uploaded_files(DATA_PATH, uploads)
        if not saved and errors:
            raise HTTPException(status_code=400, detail="; ".join(errors))

        return {
            "success": True,
            "saved": saved,
            "errors": errors,
            "message": f"Uploaded {len(saved)} file(s) to knowledge base.",
            "allowed_extensions": sorted(SUPPORTED_EXTENSIONS),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 
 
@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    answer = query_and_answer(
        question=req.question,
        db_path=DB_PATH,
        n_results=req.top_k,
        model=req.model,
    )

    if answer is None:
        raise HTTPException(status_code=500, detail="Failed to generate answer.")

    return ChatResponse(answer=answer, success=True)
 
 
@app.get("/health")
def health():
    return {"status": "ok"}
 