# File: projects/document_parser.py
import io
import re
from typing import List

try:
    import fitz  # PyMuPDF
except ImportError:  # pragma: no cover
    fitz = None

try:
    import docx
except ImportError:  # pragma: no cover
    docx = None


class HSKDocumentParser:
    @staticmethod
    def extract_text(file_bytes: bytes, filename: str) -> str:
        ext = (filename or "").lower().split(".")[-1]
        text = ""

        if ext == "pdf":
            if fitz is None:
                raise RuntimeError("Thư viện PyMuPDF (fitz) chưa được cài đặt.")
            with fitz.open(stream=file_bytes, filetype="pdf") as doc:
                # Giới hạn đọc tối đa 30 trang mỗi file để bảo vệ RAM server
                for page_num in range(min(len(doc), 30)):
                    text += doc[page_num].get_text("text") + "\n"
        elif ext == "docx":
            if docx is None:
                raise RuntimeError("Thư viện python-docx chưa được cài đặt.")
            doc = docx.Document(io.BytesIO(file_bytes))
            text = "\n".join([para.text for para in doc.paragraphs])
        elif ext == "txt":
            text = file_bytes.decode("utf-8", errors="ignore")
        else:
            raise ValueError("Chỉ hỗ trợ định dạng file .pdf, .docx hoặc .txt")

        return text.strip()

    @staticmethod
    def chunk_text(text: str, chunk_size: int = 400, overlap: int = 50) -> List[str]:
        """Cắt tài liệu thành các đoạn ~400 ký tự, gối đầu 50 ký tự"""
        clean_text = re.sub(r'\n{3,}', '\n\n', text or "")
        chunks = []
        start = 0
        text_len = len(clean_text)
        step = max(1, chunk_size - overlap)

        while start < text_len:
            end = start + chunk_size
            chunks.append(clean_text[start:end].strip())
            start += step

        return [c for c in chunks if c]
