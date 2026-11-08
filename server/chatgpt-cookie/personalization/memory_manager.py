# File: personalization/memory_manager.py
from dataclasses import dataclass, field
from typing import Dict, List


@dataclass
class StudentMemoryProfile:
    user_id: str
    hsk_level: int = 3
    learning_style: str = "Thích giải thích thông qua chiết tự chữ Hán và âm Hán Việt"
    weak_grammar_points: List[str] = field(default_factory=list)   # Giữ tối đa 5 chủ điểm ngữ pháp hay sai
    weak_vocabularies: List[str] = field(default_factory=list)     # Giữ tối đa 10 từ vựng hay quên
    personal_notes: List[str] = field(default_factory=list)        # Giữ tối đa 5 ghi chú tiến độ cá nhân

    def to_dict(self) -> dict:
        return {
            "user_id": self.user_id,
            "hsk_level": self.hsk_level,
            "learning_style": self.learning_style,
            "weak_grammar_points": list(self.weak_grammar_points),
            "weak_vocabularies": list(self.weak_vocabularies),
            "personal_notes": list(self.personal_notes),
        }


class HSKMemoryManager:
    def __init__(self):
        # Thực tế lưu vào bảng `student_profiles` trong Database
        self.profiles: Dict[str, StudentMemoryProfile] = {}

    def get_or_create_profile(self, user_id: str, default_hsk: int = 3) -> StudentMemoryProfile:
        if user_id not in self.profiles:
            self.profiles[user_id] = StudentMemoryProfile(user_id=user_id, hsk_level=default_hsk)
        return self.profiles[user_id]

    def update_custom_preference(self, user_id: str, hsk_level: int, learning_style: str):
        p = self.get_or_create_profile(user_id)
        p.hsk_level = max(1, min(6, int(hsk_level or 3)))
        p.learning_style = (learning_style or "")[:200]
        return p

    def build_memory_prompt_block(self, user_id: str) -> str:
        """Đóng gói hồ sơ cá nhân thành khối XML để tiêm vào System Prompt"""
        p = self.get_or_create_profile(user_id)
        weak_grammar = ", ".join(p.weak_grammar_points) if p.weak_grammar_points else "Chưa ghi nhận"
        weak_vocab = ", ".join(p.weak_vocabularies) if p.weak_vocabularies else "Chưa ghi nhận"
        notes = "; ".join(p.personal_notes) if p.personal_notes else "Chưa có"

        return f"""<student_memory_profile>
- Cấp độ hiện tại: HSK {p.hsk_level}
- Phong cách học ưa thích: {p.learning_style}
- Ngữ pháp đang yếu (Ưu tiên nhắc lại khi phù hợp): {weak_grammar}
- Từ vựng cần ôn (Khéo léo lồng ghép vào câu ví dụ): {weak_vocab}
- Ghi chú cá nhân: {notes}
</student_memory_profile>"""

    def update_memory_from_ai_observation(self, user_id: str, memory_update: dict):
        """Cập nhật tự động hồ sơ học viên từ quan sát ngầm của AI (Piggyback Extraction)"""
        if not memory_update or not isinstance(memory_update, dict):
            return

        p = self.get_or_create_profile(user_id)

        new_vocab = memory_update.get("detected_weak_vocab")
        if new_vocab and isinstance(new_vocab, str) and new_vocab not in p.weak_vocabularies:
            p.weak_vocabularies.append(new_vocab[:20])
            if len(p.weak_vocabularies) > 10:
                p.weak_vocabularies.pop(0)

        new_grammar = memory_update.get("detected_weak_grammar")
        if new_grammar and isinstance(new_grammar, str) and new_grammar not in p.weak_grammar_points:
            p.weak_grammar_points.append(new_grammar[:50])
            if len(p.weak_grammar_points) > 5:
                p.weak_grammar_points.pop(0)

        new_note = memory_update.get("new_personal_fact")
        if new_note and isinstance(new_note, str) and new_note not in p.personal_notes:
            p.personal_notes.append(new_note[:100])
            if len(p.personal_notes) > 5:
                p.personal_notes.pop(0)
