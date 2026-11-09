# File: main.py
import os
from secrets import compare_digest
from typing import Optional
from fastapi import FastAPI, HTTPException, Header, UploadFile, File
from pydantic import BaseModel
from core.session_manager import ChatGPTSessionManager, ChatGPTUpstreamError
from core.chat_client import ChatGPTClient
from security.guardrail import HSKGuardrail
from projects.document_parser import HSKDocumentParser
from projects.project_manager import HSKProjectManager
from personalization.memory_manager import HSKMemoryManager
from services.hsk_tutor import HSKTutorService

app = FastAPI(title="HSK AI Backend (Cookie + Guardrail + RAG + Personalization)")
bridge_app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)

# Lấy Cookie từ biến môi trường
SESSION_COOKIE = os.getenv("CHATGPT_SESSION_TOKEN", "YOUR_SESSION_TOKEN_HERE")

# Khởi tạo các Singleton Modules
session_mgr = ChatGPTSessionManager(SESSION_COOKIE)
chat_client = ChatGPTClient(session_mgr)
guardrail = HSKGuardrail()
project_mgr = HSKProjectManager()
memory_mgr = HSKMemoryManager()
hsk_service = HSKTutorService(chat_client, guardrail)


# --- Schemas ---
class VocabRequest(BaseModel):
    word: str
    hsk_level: int = 3
    model: str = "gpt-4o-mini"


class WritingRequest(BaseModel):
    topic: str
    essay: str
    hsk_level: int = 4
    model: str = "gpt-4o-mini"


class ProfileUpdateRequest(BaseModel):
    hsk_level: int = 4
    learning_style: str = "Giải thích ngắn gọn, kèm chiết tự chữ Hán và âm Hán Việt"


class CreateProjectRequest(BaseModel):
    project_id: str
    name: str
    hsk_level: int = 4


class ProjectChatRequest(BaseModel):
    project_id: str
    question: str
    model: str = "gpt-4o-mini"


class StatelessBridgeRequest(BaseModel):
    prompt: str
    model: str = "gpt-4o-mini"
    system_instruction: Optional[str] = None
    validate_task: Optional[str] = None


def _extract_session_override(authorization: Optional[str], x_chatgpt_session_token: Optional[str]) -> Optional[str]:
    if x_chatgpt_session_token and x_chatgpt_session_token.strip():
        return x_chatgpt_session_token.strip()
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
        if token:
            return token
    return None


# --- Endpoints ---

@app.get("/api/hsk/profile")
async def get_student_profile(x_user_id: str = Header(default="student_01")):
    """Xem hồ sơ cá nhân hóa (các từ vựng & ngữ pháp AI đã ghi nhận học viên đang yếu)"""
    return memory_mgr.get_or_create_profile(x_user_id).to_dict()


@app.put("/api/hsk/profile")
async def update_student_profile(
    req: ProfileUpdateRequest, x_user_id: str = Header(default="student_01")
):
    """Cho phép học viên cài đặt Custom Instructions riêng"""
    return memory_mgr.update_custom_preference(x_user_id, req.hsk_level, req.learning_style).to_dict()


@app.post("/api/hsk/vocab")
async def analyze_vocab(
    req: VocabRequest,
    x_user_id: str = Header(default="student_01"),
    authorization: Optional[str] = Header(default=None),
    x_chatgpt_session_token: Optional[str] = Header(default=None)
):
    allowed, msg = guardrail.check_rate_limit(f"vocab_{x_user_id}", cooldown_seconds=5)
    if not allowed:
        raise HTTPException(status_code=429, detail=msg)
    try:
        override = _extract_session_override(authorization, x_chatgpt_session_token)
        return await hsk_service.explain_vocabulary(
            x_user_id, req.word, req.hsk_level, memory_mgr, session_token=override, model=req.model
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/hsk/grade-writing")
async def grade_essay(
    req: WritingRequest,
    x_user_id: str = Header(default="student_01"),
    authorization: Optional[str] = Header(default=None),
    x_chatgpt_session_token: Optional[str] = Header(default=None)
):
    allowed, msg = guardrail.check_rate_limit(f"write_{x_user_id}", cooldown_seconds=10)
    if not allowed:
        raise HTTPException(status_code=429, detail=msg)
    try:
        override = _extract_session_override(authorization, x_chatgpt_session_token)
        return await hsk_service.grade_writing(
            x_user_id, req.topic, req.essay, req.hsk_level, memory_mgr, session_token=override, model=req.model
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/hsk/projects/create")
async def create_project(req: CreateProjectRequest):
    proj = project_mgr.create_project(req.project_id, req.name, req.hsk_level)
    return {"status": "success", "project_id": proj.project_id, "name": proj.name}


@app.post("/api/hsk/projects/{project_id}/upload")
async def upload_file_to_project(
    project_id: str,
    file: UploadFile = File(...),
    x_user_id: str = Header(default="student_01")
):
    allowed, msg = guardrail.check_rate_limit(f"upload_{x_user_id}", cooldown_seconds=15)
    if not allowed:
        raise HTTPException(status_code=429, detail=msg)
    try:
        file_bytes = await file.read()
        raw_text = HSKDocumentParser.extract_text(file_bytes, file.filename)

        # Kiểm duyệt mật độ chữ Hán và mã độc trong File
        is_valid, reason = guardrail.validate_document(raw_text)
        if not is_valid:
            raise HTTPException(status_code=400, detail=reason)

        chunks = HSKDocumentParser.chunk_text(raw_text)
        project_mgr.add_document_chunks(project_id, chunks)
        return {
            "status": "success",
            "filename": file.filename,
            "total_chunks_indexed": len(chunks)
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))


@app.post("/api/hsk/projects/chat")
async def chat_with_project(
    req: ProjectChatRequest,
    x_user_id: str = Header(default="student_01"),
    authorization: Optional[str] = Header(default=None),
    x_chatgpt_session_token: Optional[str] = Header(default=None)
):
    allowed, msg = guardrail.check_rate_limit(f"chat_{x_user_id}", cooldown_seconds=8)
    if not allowed:
        raise HTTPException(status_code=429, detail=msg)
    try:
        override = _extract_session_override(authorization, x_chatgpt_session_token)
        return await hsk_service.personalized_project_chat(
            x_user_id, req.project_id, req.question, project_mgr, memory_mgr,
            session_token=override, model=req.model
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/hsk/bridge")
@bridge_app.post("/api/hsk/bridge")
async def stateless_cookie_bridge(
    req: StatelessBridgeRequest,
    x_hsk_bridge_key: str = Header(default=""),
    x_chatgpt_session_token: str = Header(default="")
):
    key = os.getenv("CHATGPT_COOKIE_BRIDGE_KEY", "")
    if not key or not compare_digest(key.encode(), x_hsk_bridge_key.encode()):
        raise HTTPException(status_code=401, detail="Bridge authentication failed.")
    if not x_chatgpt_session_token.strip():
        raise HTTPException(status_code=400, detail="Thiếu cookie ChatGPT.")
    if req.validate_task:
        is_valid, reason = guardrail.validate_input(req.prompt, task_type=req.validate_task)
        if not is_valid:
            raise HTTPException(status_code=400, detail=reason)
    prompt = (
        guardrail.wrap_sandwich_prompt(req.prompt, req.system_instruction)
        if req.system_instruction
        else req.prompt
    )
    try:
        return await chat_client.send_stateless_message(
            prompt, model=req.model, session_token=x_chatgpt_session_token
        )
    except ChatGPTUpstreamError as exc:
        # A tunnel can replace origin 502 responses and discard the diagnostic body.
        raise HTTPException(
            status_code=429 if exc.status == 429 else 424,
            detail={"stage": exc.stage, "status": exc.status, "challenge": exc.challenge}
        ) from exc
    except ValueError:
        raise HTTPException(status_code=400, detail="Dữ liệu phiên ChatGPT không hợp lệ.")
    except Exception:
        raise HTTPException(status_code=502, detail="Bridge chưa nhận được phản hồi ChatGPT.")


@app.post("/api/hsk/session-info")
@bridge_app.post("/api/hsk/session-info")
async def cookie_session_info(
    x_hsk_bridge_key: str = Header(default=""),
    x_chatgpt_session_token: str = Header(default="")
):
    key = os.getenv("CHATGPT_COOKIE_BRIDGE_KEY", "")
    if not key or not compare_digest(key.encode(), x_hsk_bridge_key.encode()):
        raise HTTPException(status_code=401, detail="Bridge authentication failed.")
    token = x_chatgpt_session_token.strip()
    if not token:
        raise HTTPException(status_code=400, detail="Thiếu cookie ChatGPT.")
    try:
        mgr = chat_client._get_session_manager(token)
        return await mgr.get_account_info()
    except ValueError:
        raise HTTPException(status_code=400, detail="Dữ liệu phiên ChatGPT không hợp lệ.")
    except Exception:
        raise HTTPException(status_code=502, detail="Chưa kiểm tra được phiên ChatGPT.")
