# File: projects/project_manager.py
import math
import re
from typing import Dict, List

try:
    from rank_bm25 import BM25Okapi
except ImportError:  # pragma: no cover - built-in BM25Okapi fallback when rank_bm25 is not installed
    class BM25Okapi:
        def __init__(self, corpus: List[List[str]], k1: float = 1.5, b: float = 0.75):
            self.k1 = k1
            self.b = b
            self.corpus_size = len(corpus)
            self.avgdl = sum(len(doc) for doc in corpus) / self.corpus_size if self.corpus_size else 0.0
            self.doc_freqs: List[Dict[str, int]] = []
            self.idf: Dict[str, float] = {}
            df: Dict[str, int] = {}
            for doc in corpus:
                frequencies: Dict[str, int] = {}
                for token in doc:
                    frequencies[token] = frequencies.get(token, 0) + 1
                self.doc_freqs.append(frequencies)
                for token in frequencies:
                    df[token] = df.get(token, 0) + 1
            for token, freq in df.items():
                self.idf[token] = math.log(1.0 + (self.corpus_size - freq + 0.5) / (freq + 0.5))

        def get_scores(self, query: List[str]) -> List[float]:
            scores = [0.0] * self.corpus_size
            for q in query:
                q_idf = self.idf.get(q, 0.0)
                if q_idf == 0.0:
                    continue
                for idx, doc_freq in enumerate(self.doc_freqs):
                    freq = doc_freq.get(q, 0)
                    if freq == 0:
                        continue
                    dl = sum(doc_freq.values())
                    denom = freq + self.k1 * (1 - self.b + self.b * dl / (self.avgdl or 1.0))
                    scores[idx] += q_idf * (freq * (self.k1 + 1)) / denom
            return scores

        def get_top_n(self, query: List[str], documents: List[str], n: int = 3) -> List[str]:
            scores = self.get_scores(query)
            ranked = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:n]
            return [documents[i] for i in ranked]


class ProjectData:
    def __init__(self, project_id: str, name: str, hsk_level: int):
        self.project_id = project_id
        self.name = name
        self.hsk_level = hsk_level
        self.chunks: List[str] = []
        self.bm25: BM25Okapi = None
        # Sliding Window: Chỉ giữ tối đa 4 lượt hỏi-đáp gần nhất
        self.recent_history: List[Dict[str, str]] = []


class HSKProjectManager:
    def __init__(self):
        # Lưu ý: Trong môi trường Production, thay Dict này bằng bảng trong PostgreSQL/MongoDB
        self.projects: Dict[str, ProjectData] = {}

    def _tokenize_mixed_zh_vi(self, text: str) -> List[str]:
        """
        Bộ tách từ lai (Hybrid Tokenizer) cho cả tiếng Trung và tiếng Việt:
        - Tách từ tiếng Việt/Pinyin theo từ đơn
        - Tách từng chữ Hán (Unigram) và cụm 2 chữ Hán liên tiếp (Bigram)
        """
        text_lower = (text or "").lower()
        latin_words = re.findall(
            r'[a-zA-Zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ0-9]+',
            text_lower
        )
        zh_chars = re.findall(r'[\u4e00-\u9fff]', text_lower)
        zh_bigrams = [zh_chars[i] + zh_chars[i + 1] for i in range(len(zh_chars) - 1)]
        return latin_words + zh_chars + zh_bigrams

    def create_project(self, project_id: str, name: str, hsk_level: int) -> ProjectData:
        proj = ProjectData(project_id, name, hsk_level)
        self.projects[project_id] = proj
        return proj

    def add_document_chunks(self, project_id: str, new_chunks: List[str]):
        proj = self.projects.get(project_id)
        if not proj:
            raise ValueError("Không tìm thấy Dự án!")

        if len(proj.chunks) + len(new_chunks) > 150:
            raise ValueError("Dự án đã đạt giới hạn tối đa (150 đoạn tài liệu).")

        proj.chunks.extend(new_chunks)
        tokenized_corpus = [self._tokenize_mixed_zh_vi(c) for c in proj.chunks]
        proj.bm25 = BM25Okapi(tokenized_corpus)

    def retrieve_relevant_context(self, project_id: str, query: str, top_k: int = 3) -> str:
        """Trích xuất đúng top_k đoạn văn bản liên quan nhất với câu hỏi"""
        proj = self.projects.get(project_id)
        if not proj or not proj.chunks or not proj.bm25:
            return "Chưa có tài liệu đính kèm trong dự án này."

        tokenized_query = self._tokenize_mixed_zh_vi(query)
        top_chunks = proj.bm25.get_top_n(tokenized_query, proj.chunks, n=top_k)
        return "\n---\n".join(top_chunks)

    def add_chat_turn(self, project_id: str, user_q: str, ai_ans: str):
        """Lưu lịch sử hội thoại ngắn gọn và tự động cắt bỏ các lượt cũ hơn 4 câu"""
        proj = self.projects.get(project_id)
        if proj:
            proj.recent_history.append({
                "user": (user_q or "")[:150],
                "ai": (ai_ans or "")[:250]
            })
            if len(proj.recent_history) > 4:
                proj.recent_history.pop(0)

    def get_formatted_history(self, project_id: str) -> str:
        proj = self.projects.get(project_id)
        if not proj or not proj.recent_history:
            return "Chưa có lịch sử trò chuyện trước đó."
        return "\n".join(
            [f"- Học viên: {t['user']}\n- Gia sư HSK: {t['ai']}" for t in proj.recent_history]
        )
