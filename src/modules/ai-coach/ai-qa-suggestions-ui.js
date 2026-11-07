/* Shared renderer for follow-up questions. */
(function(root){'use strict';
 function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
 function renderSuggestedQuestionsHtml(suggestions=[],isSending=false){if(!Array.isArray(suggestions)||!suggestions.length)return '';return `<div class="qa-suggestions-group" role="region" aria-label="Câu hỏi gợi ý tiếp theo"><div class="qa-suggestions-caption">Hỏi tiếp về phần này:</div><div class="qa-suggestions-stack">${suggestions.slice(0,3).map(s=>`<button type="button" class="qa-suggestion-row-btn" data-qa-suggestion-id="${escapeHtml(s.id)}" data-target-ai-message-id="${escapeHtml(s.targetAiMessageId)}"${isSending?' disabled aria-disabled="true"':''}>${escapeHtml(s.text)}<span aria-hidden="true"> →</span></button>`).join('')}</div></div>`;}
 root.HSKQaSuggestionsUI={renderSuggestedQuestionsHtml,escapeHtml};
})(typeof window==='object'?window:globalThis);
