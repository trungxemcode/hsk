# File: services/hsk_tutor.py
import json
import re
from typing import Optional
from core.chat_client import ChatGPTClient
from security.guardrail import HSKGuardrail
from projects.project_manager import HSKProjectManager
from personalization.memory_manager import HSKMemoryManager


class HSKTutorService:
    def __init__(self, chat_client: ChatGPTClient, guardrail: HSKGuardrail):
        self.client = chat_client
        self.guard = guardrail

    def _extract_json(self, text: str) -> dict:
        """Trích xuất JSON an toàn và kiểm tra cờ từ chối OUT_OF_SCOPE"""
        match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text or "")
        json_str = match.group(1) if match else (text or "")
        try:
            data = json.loads(json_str.strip())
            if isinstance(data, dict) and data.get("error") == "OUT_OF_SCOPE":
                raise ValueError("Yêu cầu của bạn nằm ngoài phạm vi học tiếng Trung HSK!")
            return data if isinstance(data, dict) else {"raw_response": text}
        except json.JSONDecodeError:
            return {"raw_response": text, "error": "Không thể phân tích định dạng JSON"}

    async def explain_vocabulary(
        self,
        user_id: str,
        word: str,
        hsk_level: int,
        memory_mgr: HSKMemoryManager,
        session_token: Optional[str] = None,
        model: str = "gpt-4o-mini"
    ) -> dict:
        is_valid, reason = self.guard.validate_input(word, task_type="vocab")
        if not is_valid:
            raise ValueError(reason)

        student_memory = memory_mgr.build_memory_prompt_block(user_id)

        system_instruction = f"""
        Bạn là giáo viên dạy tiếng Trung HSK chuyên nghiệp cho người Việt.
        {student_memory}
        Hãy phân tích từ vựng trong <student_input> ở trình độ HSK {hsk_level}.
        Nếu có thể, hãy đặt câu ví dụ kết hợp với từ vựng/ngữ pháp mà học viên đang yếu trong <student_memory_profile>.
        BẮT BUỘC chỉ trả về đúng định dạng JSON sau:
        {{
            "word": "từ vựng",
            "pinyin": "phiên âm",
            "han_viet": "âm Hán Việt",
            "meaning_vi": "nghĩa tiếng Việt chính xác",
            "grammar_usage": "cách dùng ngữ pháp ngắn gọn",
            "examples": [
                {{"zh": "Câu ví dụ cấp độ HSK {hsk_level}", "pinyin": "...", "vi": "..."}}
            ]
        }}
        """
        safe_prompt = self.guard.wrap_sandwich_prompt(word, system_instruction)
        res = await self.client.send_stateless_message(safe_prompt, model=model, session_token=session_token)
        return self._extract_json(res["reply"])

    async def grade_writing(
        self,
        user_id: str,
        topic: str,
        essay: str,
        hsk_level: int,
        memory_mgr: HSKMemoryManager,
        session_token: Optional[str] = None,
        model: str = "gpt-4o-mini"
    ) -> dict:
        is_valid, reason = self.guard.validate_input(essay, task_type="writing")
        if not is_valid:
            raise ValueError(reason)

        student_memory = memory_mgr.build_memory_prompt_block(user_id)

        system_instruction = f"""
        Chấm điểm bài viết tiếng Trung trình độ HSK {hsk_level}.
        Chủ đề / Từ khóa yêu cầu: "{topic}"
        {student_memory}
        
        BẮT BUỘC chỉ trả về JSON theo cấu trúc sau:
        {{
            "score": 85,
            "comment_vi": "Nhận xét tổng quan bằng tiếng Việt",
            "corrections": [
                {{"original": "câu sai", "corrected": "câu sửa lại", "reason": "giải thích lỗi"}}
            ],
            "upgraded_version": "Đoạn văn viết lại chuẩn HSK {hsk_level}",
            "memory_update": {{
                "detected_weak_vocab": "1 từ vựng học viên dùng sai trong bài (hoặc null)",
                "detected_weak_grammar": "1 cấu trúc ngữ pháp học viên viết sai (hoặc null)",
                "new_personal_fact": null
            }}
        }}
        """
        safe_prompt = self.guard.wrap_sandwich_prompt(essay, system_instruction)
        res = await self.client.send_stateless_message(safe_prompt, model=model, session_token=session_token)
        parsed = self._extract_json(res["reply"])

        # Tách phần memory_update để lưu ngầm vào hồ sơ học viên
        mem_update = parsed.pop("memory_update", None)
        if mem_update:
            memory_mgr.update_memory_from_ai_observation(user_id, mem_update)

        return parsed

    async def personalized_project_chat(
        self,
        user_id: str,
        project_id: str,
        question: str,
        project_mgr: HSKProjectManager,
        memory_mgr: HSKMemoryManager,
        session_token: Optional[str] = None,
        model: str = "gpt-4o-mini"
    ) -> dict:
        proj = project_mgr.projects.get(project_id)
        if not proj:
            raise ValueError("Dự án không tồn tại.")

        # 1. Kiểm tra câu hỏi tại Local Guardrail
        is_valid, reason = self.guard.validate_input(question, task_type="qa")
        if not is_valid:
            raise ValueError(reason)

        # 2. Lấy Hồ sơ cá nhân + 3 đoạn tài liệu liên quan nhất + 4 câu chat gần nhất
        student_memory = memory_mgr.build_memory_prompt_block(user_id)
        relevant_docs = project_mgr.retrieve_relevant_context(project_id, question, top_k=3)
        short_history = project_mgr.get_formatted_history(project_id)

        # 3. Đóng gói vào Sandwich Prompt kèm Piggyback Memory Update
        system_instruction = f"""
        Bạn là Gia sư HSK AI riêng của học viên trong Dự án "{proj.name}" (HSK {proj.hsk_level}).
        
        [HỒ SƠ CÁ NHÂN HÓA CỦA HỌC VIÊN]:
        {student_memory}

        [TRÍCH ĐOẠN TÀI LIỆU TRONG DỰ ÁN]:
        <project_documents>
        {relevant_docs}
        </project_documents>

        [HỘI THOẠI GẦN ĐÂY (Tối đa 4 lượt)]:
        <recent_chat>
        {short_history}
        </recent_chat>

        NHIỆM VỤ:
        1. Giải đáp câu hỏi trong <student_input> dựa ưu tiên vào <project_documents> và phù hợp với <student_memory_profile>.
        2. Khéo léo lồng ghép từ vựng/ngữ pháp học viên đang yếu vào câu ví dụ minh họa.
        3. Ghi nhận điểm yếu mới của học viên (nếu có) vào trường `memory_update`.

        BẮT BUỘC CHỈ TRẢ VỀ JSON HỢP LỆ THEO CẤU TRÚC:
        {{
            "answer_vi": "Câu trả lời chi tiết, cá nhân hóa bằng tiếng Việt",
            "cited_from_file": "Trích dẫn câu chữ Hán từ tài liệu dự án (nếu có)",
            "examples": [
                {{"zh": "Câu ví dụ", "pinyin": "...", "vi": "..."}}
            ],
            "memory_update": {{
                "detected_weak_vocab": "1 từ vựng chữ Hán học viên đang hỏi/yếu (hoặc null)",
                "detected_weak_grammar": "Điểm ngữ pháp học viên đang thắc mắc (hoặc null)",
                "new_personal_fact": "Ghi chú ngắn về mục tiêu/thói quen của học viên (hoặc null)"
            }}
        }}
        """
        safe_prompt = self.guard.wrap_sandwich_prompt(question, system_instruction)
        res = await self.client.send_stateless_message(safe_prompt, model=model, session_token=session_token)
        parsed_data = self._extract_json(res["reply"])

        # Lưu ngầm điểm yếu mới vào hồ sơ của học viên và xóa khỏi JSON trả về App
        mem_update = parsed_data.pop("memory_update", None)
        if mem_update:
            memory_mgr.update_memory_from_ai_observation(user_id, mem_update)

        # Lưu câu trả lời vào bộ nhớ trượt 4 câu của Project
        if "answer_vi" in parsed_data:
            project_mgr.add_chat_turn(project_id, question, parsed_data["answer_vi"])

        return parsed_data
