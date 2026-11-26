/**
 * SEO-AUDITOR-01: Independent Two-Round Audit & 100-Point Scoring Protocol.
 * INTERNAL / EVALUATOR-ONLY. Never expose challenge lists, internal prompts,
 * or scoring thresholds to Writer AI prompts.
 */

export const AUDIT_PROTOCOL_ID = 'SEO-AUDITOR-01';

export const AUDIT_RUBRIC = Object.freeze([
  { code: 'A', name: 'Đáp ứng Search Intent và nhiệm vụ người đọc', max: 14 },
  { code: 'B', name: 'Độ chính xác và kiểm chứng dữ kiện', max: 16 },
  { code: 'C', name: 'Độ sâu, độ đầy đủ và tính giải quyết vấn đề', max: 14 },
  { code: 'D', name: 'Tính nguyên bản và giá trị thông tin riêng', max: 12 },
  { code: 'E', name: 'Chất lượng lập luận và bằng chứng', max: 10 },
  { code: 'F', name: 'SEO On-page và mức độ phù hợp ngữ nghĩa', max: 10 },
  { code: 'G', name: 'Logic cấu trúc và khả năng đọc', max: 8 },
  { code: 'H', name: 'Tuân thủ văn phong được chỉ định', max: 7 },
  { code: 'I', name: 'Tính ứng dụng và trải nghiệm người đọc', max: 5 },
  { code: 'J', name: 'Minh bạch, nhất quán và kiểm soát tuyên bố', max: 4 },
]);

export const HARD_FAIL_CODES = Object.freeze({
  'HF-01': 'Sao chép có chủ đích hoặc che giấu nội dung sao chép',
  'HF-02': 'Bịa nguồn, nghiên cứu, số liệu hoặc trích dẫn',
  'HF-03': 'Sai kiến thức trọng yếu có thể gây hiểu sai đáng kể',
  'HF-04': 'Tuyên bố sai về giá, quyền truy cập, miễn phí hoặc tính năng sản phẩm',
  'HF-05': 'Nội dung cố ý gây hiểu lầm về chứng chỉ, kỳ thi hoặc điều kiện quan trọng',
  'HF-06': 'Nội dung không đáp ứng chủ đề hoặc Search Intent cốt lõi',
  'HF-07': 'Dẫn nguồn giả, URL giả hoặc nguồn không hỗ trợ phát biểu nhưng trình bày như bằng chứng',
});

export const INTERNAL_CHALLENGE_BANK = Object.freeze({
  '5.1': {
    id: '5.1',
    group: 'Độ sâu ngữ nghĩa',
    name: 'Phép thử thay thế chủ đề',
    promptHint: 'Ẩn từ khóa chính trong các đoạn văn để kiểm tra xem đoạn đó có thể dán sang chủ đề khác mà vẫn giữ nguyên không (nếu chung chung -> trừ D và C).',
  },
  '5.2': {
    id: '5.2',
    group: 'Xác minh nguồn',
    name: 'Phép thử truy ngược bằng chứng',
    promptHint: 'Chọn 1 kết luận hoặc số liệu quan trọng và truy ngược: dữ kiện/nguồn nào xác nhận, điều kiện giới hạn nào bị bỏ qua (thiếu căn cứ -> không cho tối đa B và E).',
  },
  '5.3': {
    id: '5.3',
    group: 'Ngoại lệ chuyên môn',
    name: 'Phép thử ngoại lệ tiếng Trung / HSK',
    promptHint: 'Kiểm tra trường hợp biên: từ đa nghĩa, biến điệu thanh điệu (một/bù/thanh 3), văn nói vs văn viết, ngoại lệ quy tắc ngữ pháp hay khác biệt HSK 2.0/3.0.',
  },
  '5.4': {
    id: '5.4',
    group: 'Nhất quán nội bộ',
    name: 'Phép thử nhất quán nội bộ',
    promptHint: 'Đối chiếu định nghĩa mở bài với kết luận, số liệu giữa bảng và đoạn văn, tên thuật ngữ giữa các phần.',
  },
  '5.5': {
    id: '5.5',
    group: 'Độ sâu ngữ nghĩa',
    name: 'Phép thử giá trị của ví dụ',
    promptHint: 'Xóa tạm từng ví dụ khỏi bài: ví dụ có minh họa đúng quy tắc, chuẩn Chữ Hán – Pinyin – Việt và đủ ngữ cảnh hay chỉ là ví dụ sáo rỗng?',
  },
  '5.6': {
    id: '5.6',
    group: 'Khả năng áp dụng',
    name: 'Phép thử tính khả thi của hướng dẫn',
    promptHint: 'Mô phỏng người mới làm theo từng bước xem có bước nào thiếu điều kiện, thiếu thao tác hoặc không thể thực hiện không.',
  },
  '5.7': {
    id: '5.7',
    group: 'Tuyên bố sản phẩm',
    name: 'Phép thử tuyên bố sản phẩm',
    promptHint: 'Kiểm tra mọi tuyên bố về HSK Flashcards (tính năng, miễn phí, AI, không có nguồn nội bộ phải gắn UNVERIFIED_PRODUCT_CLAIM).',
  },
  '5.8': {
    id: '5.8',
    group: 'Xác minh nguồn',
    name: 'Phép thử thời điểm & phiên bản',
    promptHint: 'Kiểm tra mốc thời gian hiệu lực, năm thi HSK, phiên bản HSK 2.0 vs 3.0 để tránh đưa thông tin hết hạn như hiện tại.',
  },
  '5.9': {
    id: '5.9',
    group: 'Khả năng áp dụng',
    name: 'Phép thử ý định tìm kiếm đối nghịch',
    promptHint: 'Nếu người tìm kiếm thực sự muốn hoàn thành nhiệm vụ, phần nào của bài còn thiếu khiến họ phải rời đi tìm câu trả lời cốt lõi ở nơi khác?',
  },
  '5.10': {
    id: '5.10',
    group: 'Độ sâu ngữ nghĩa',
    name: 'Phép thử đoạn văn có thể loại bỏ',
    promptHint: 'Đánh dấu các đoạn lặp lại tiêu đề, chuyển ý sáo rỗng, tóm tắt lặp mở bài hoặc quảng cáo chen ngang không tạo thêm thông tin.',
  },
});

export function selectRoundChallenges(round = 1, { category = '', query = '' } = {}) {
  const combined = `${category} ${query}`.toLowerCase();
  if (Number(round) === 1) {
    const ids = ['5.1', '5.3', '5.5'];
    if (category === 'ky-thi' || category === 'diem-so' || /(lịch thi|hsk 3\.0|điểm|2026|2027)/.test(combined)) {
      ids.push('5.8');
    }
    return ids.map((id) => INTERNAL_CHALLENGE_BANK[id]);
  }
  const ids = ['5.2', '5.4', '5.9', '5.10'];
  if (category === 'meo-hoc' || category === 'diem-so' || /(cách|lộ trình|hướng dẫn|tra điểm)/.test(combined)) {
    ids.push('5.6');
  } else {
    ids.push('5.7');
  }
  return ids.map((id) => INTERNAL_CHALLENGE_BANK[id]);
}

export const AUDITOR_SYSTEM_PROMPT = `Bạn là AI Kiểm duyệt độc lập thực thi nghiêm ngặt ${AUDIT_PROTOCOL_ID} (INTERNAL / EVALUATOR-ONLY) cho dự án Trung -- App học HSK.

NGUYÊN TẮC BẮT BUỘC:
1. Độc lập tuyệt đối (Mục 1): Không tin lời tự đánh giá hay dàn ý tự khen của người viết; mọi điểm số và lỗi PHẢI gắn vị trí cụ thể trong bài và lý do kiểm chứng được.
2. Chống chấm điểm dễ dãi (Mục 10): Không cộng điểm vì bài dài, nhiều tiêu đề/bảng hay lặp từ khóa; không đánh đồng "không sai rõ ràng" với "đã được xác minh"; không bỏ qua đoạn yếu vì mở bài/kết luận hay.
3. Khóa đề bài & Search Intent độc lập (Mục 3.1): Tự xác định lại Search Intent thật từ từ khóa mục tiêu, không để tiêu đề bài viết dẫn dắt sai.
4. Kiểm tra riêng tiếng Trung & HSK (Mục 6): Soát từng chữ Hán giản thể, dấu thanh điệu Pinyin, từ loại, ngữ cảnh, sự tự nhiên bản xứ, nhầm lẫn giản thể/phồn thể, tuyệt đối hóa quy tắc và phiên bản HSK 2.0 vs 3.0.
5. Kiểm tra tuyên bố sản phẩm (Mục 7): Tuyên bố chưa có bằng chứng xác minh phải đánh dấu UNVERIFIED_PRODUCT_CLAIM; không trừ điểm vô lý cho URL nội bộ nếu chưa được cung cấp dữ liệu kỹ thuật (ghi NOT ASSESSABLE khi thiếu dữ liệu).
6. Cơ chế 2 vòng (Mục 2):
   - Ở Vòng 1: chỉ đánh giá sơ bộ; TUYỆT ĐỐI không cấp APPROVED.
   - Ở Vòng 2: đọc lại toàn bài như bản thảo mới, không mặc định lỗi vòng 1 đã được sửa đúng, kiểm tra độc lập bằng bộ thử thách mới.

Chỉ trả về DUY NHẤT 01 JSON OBJECT hợp lệ (không markdown bọc ngoài).`;

export function buildAuditorPrompt({
  round = 1,
  reviewerLabel = 'AI Kiểm duyệt độc lập',
  reviewerRole = 'Kiểm duyệt chất lượng SEO & tiếng Trung HSK',
  article,
  writerBrief = null,
  trendQuery = '',
  category = '',
}) {
  const effectiveRound = Number(round) === 2 ? 2 : 1;
  const challenges = selectRoundChallenges(effectiveRound, { category: category || article?.category, query: trendQuery });
  const roundRule =
    effectiveRound === 1
      ? 'ĐÂY LÀ VÒNG 1 (Kiểm duyệt sơ bộ): KHÔNG được phê duyệt xuất bản; phát hiện triệt để lỗi bằng bằng chứng cụ thể.'
      : 'ĐÂY LÀ VÒNG 2 (Kiểm duyệt độc lập sau chỉnh sửa): Đọc lại toàn bộ bản thảo như bài mới, xác minh xem lỗi đã sửa tận gốc chưa và kiểm tra theo bộ thử thách Vòng 2.';

  const rubricText = AUDIT_RUBRIC.map((c) => `- ${c.code} (tối đa ${c.max}): ${c.name}`).join('\n');
  const challengeText = challenges.map((ch) => `- [${ch.id}] ${ch.name} (${ch.group}): ${ch.promptHint}`).join('\n');
  const declaredStyle = writerBrief?.styleId || article?.editorialVoice || 'chưa khai báo';

  return `Vai trò: ${reviewerLabel} — ${reviewerRole} (${AUDIT_PROTOCOL_ID} · Vòng ${effectiveRound}/2).
${roundRule}

ĐỀ BÀI CẦN KHÓA ĐỘC LẬP:
- Từ khóa/chủ đề mục tiêu: "${trendQuery || article?.title || ''}"
- Chuyên mục: "${category || article?.category || 'meo-hoc'}"
- Văn phong được khai báo: "${declaredStyle}"
${writerBrief?.unverifiedNotes?.length ? `- Lưu ý người viết gửi kèm cần kiểm chứng: ${JSON.stringify(writerBrief.unverifiedNotes)}` : ''}

THANG ĐIỂM 100 ĐỘC LẬP (A..J — chấm độc lập từng hạng mục kèm bằng chứng):
${rubricText}

BỘ THỬ THÁCH NỘI BỘ BẮT BUỘC CHO VÒNG ${effectiveRound} (chỉ kiểm tra nội bộ, ghi vào challengeResults):
${challengeText}

KIỂM TRA HARD FAIL (HF-01..HF-07) & ĐIỂM TRẦN:
- HF-01: Sao chép/che giấu | HF-02: Bịa nguồn/số liệu | HF-03: Sai kiến thức trọng yếu (chữ Hán/Pinyin/ngữ pháp sai nặng) | HF-04: Tuyên bố sai tính năng/miễn phí/giá | HF-05: Gây hiểu lầm kỳ thi/chứng chỉ HSK | HF-06: Lệch Search Intent cốt lõi | HF-07: Dẫn nguồn giả/URL giả.
- Không phạt vì dùng văn phong không trò chuyện nếu đúng chuẩn chuyên môn; ngược lại hãy trừ điểm H và B nếu có câu sáo rỗng, xưng hô "mình/bạn nhé/nha" hoặc khẳng định khoa trương thiếu căn cứ.

BẢN THẢO BÀI VIẾT CẦN KIỂM DUYỆT:
${JSON.stringify(article)}

QUY TẮC ĐỊNH DẠNG ĐỂ KHÔNG CẮT NGANG JSON: Giữ mỗi trường "evidence" và "finding" cô đọng (tối đa 15 từ), chỉ ghi tối đa 4 lỗi quan trọng nhất trong "errors", và tuyệt đối không viết chữ ngoài JSON.

TRẢ VỀ DUY NHẤT 01 JSON OBJECT:
{
  "lockedIntent": "Search Intent độc lập đã xác định",
  "targetAudience": "Đối tượng người học thật sự",
  "scores": {
    "A": { "score": 12, "evidence": "Lý do 1 câu gắn vị trí bài" },
    "B": { "score": 14, "evidence": "..." },
    "C": { "score": 12, "evidence": "..." },
    "D": { "score": 10, "evidence": "..." },
    "E": { "score": 8, "evidence": "..." },
    "F": { "score": 8, "evidence": "..." },
    "G": { "score": 7, "evidence": "..." },
    "H": { "score": 6, "evidence": "..." },
    "I": { "score": 4, "evidence": "..." },
    "J": { "score": 3, "evidence": "..." }
  },
  "hardFails": [{ "code": "HF-03", "location": "muc-1", "reason": "chỉ ghi nếu thực sự vi phạm, bình thường để []" }],
  "seriousUnintentionalError": false,
  "wrongSearchIntent": false,
  "unverifiedCriticalClaims": [],
  "challengeResults": [
    { "id": "5.x", "group": "...", "result": "Pass", "finding": "Phát hiện cụ thể 1 câu" }
  ],
  "errors": [
    {
      "code": "ERR-01",
      "severity": "Critical | Major | Minor",
      "location": "Heading/đoạn/ví dụ cụ thể",
      "excerpt": "Trích đoạn ngắn lỗi",
      "reason": "Vì sao sai / thiếu",
      "evidence": "Bằng chứng hoặc đối chiếu",
      "fix": "Hành động sửa cụ thể",
      "affectedCategories": ["B"]
    }
  ],
  "strengths": ["Điểm mạnh 1"],
  "summary": "Nhận xét tổng quan 1-2 câu"
}`;
}

export function classifyAuditBand(score) {
  if (score >= 95) return 'Exceptional';
  if (score >= 90) return 'Strong';
  if (score >= 85) return 'Acceptable';
  if (score >= 80) return 'Borderline';
  if (score >= 70) return 'Weak';
  if (score >= 50) return 'Poor';
  return 'Unacceptable';
}

export function computeAuditScoreAndVerdict(rawReport, { round = 1 } = {}) {
  const effectiveRound = Number(round) === 2 ? 2 : 1;
  const rawScores = rawReport?.scores;
  const hasDetailedRubric = Boolean(rawScores && typeof rawScores === 'object' && AUDIT_RUBRIC.some((c) => rawScores[c.code] !== undefined));

  const categoryBreakdown = {};
  const below60Categories = [];
  let rawTotal = 0;

  if (hasDetailedRubric) {
    for (const cat of AUDIT_RUBRIC) {
      const entry = rawScores[cat.code];
      const rawVal = typeof entry === 'number' ? entry : Number(entry?.score);
      const safeVal = Number.isFinite(rawVal) ? Math.max(0, Math.min(cat.max, Math.round(rawVal))) : Math.floor(cat.max * 0.7);
      const pct = safeVal / cat.max;
      if (pct < 0.6) below60Categories.push(cat.code);
      rawTotal += safeVal;
      categoryBreakdown[cat.code] = {
        code: cat.code,
        name: cat.name,
        max: cat.max,
        score: safeVal,
        evidence: String(entry?.evidence || '').trim(),
      };
    }
  } else {
    const legacyScore = Number(rawReport?.score);
    rawTotal = Number.isFinite(legacyScore) ? Math.max(0, Math.min(100, Math.round(legacyScore))) : 75;
  }

  const hardFails = Array.isArray(rawReport?.hardFails)
    ? rawReport.hardFails
        .filter((hf) => hf && String(hf.code || '').trim())
        .map((hf) => ({
          code: String(hf.code).trim().toUpperCase(),
          label: HARD_FAIL_CODES[String(hf.code).trim().toUpperCase()] || 'Lỗi vi phạm nghiêm trọng',
          location: String(hf.location || '').trim(),
          reason: String(hf.reason || '').trim(),
        }))
    : [];

  const seriousUnintentionalError = Boolean(rawReport?.seriousUnintentionalError);
  const wrongSearchIntent = Boolean(rawReport?.wrongSearchIntent);
  const unverifiedCriticalClaims = Array.isArray(rawReport?.unverifiedCriticalClaims)
    ? rawReport.unverifiedCriticalClaims.map((x) => String(x || '').trim()).filter(Boolean)
    : [];

  let finalScore = rawTotal;
  const appliedCaps = [];
  if (seriousUnintentionalError && finalScore > 59) {
    finalScore = 59;
    appliedCaps.push('Trần 59 do có lỗi sai nghiêm trọng');
  }
  if (wrongSearchIntent && finalScore > 69) {
    finalScore = 69;
    appliedCaps.push('Trần 69 do sai lệch Search Intent căn bản');
  }

  const errors = Array.isArray(rawReport?.errors)
    ? rawReport.errors
        .filter((e) => e && (e.reason || e.fix))
        .map((e, idx) => ({
          code: String(e.code || `ERR-${String(idx + 1).padStart(2, '0')}`).trim(),
          severity: /^(critical|major|minor)$/i.test(String(e.severity || ''))
            ? String(e.severity).charAt(0).toUpperCase() + String(e.severity).slice(1).toLowerCase()
            : 'Major',
          location: String(e.location || '').trim() || 'Toàn bài',
          excerpt: String(e.excerpt || '').trim(),
          reason: String(e.reason || '').trim(),
          evidence: String(e.evidence || '').trim(),
          fix: String(e.fix || '').trim(),
          affectedCategories: Array.isArray(e.affectedCategories) ? e.affectedCategories : [],
        }))
    : [];

  const challengeResults = Array.isArray(rawReport?.challengeResults)
    ? rawReport.challengeResults.map((ch) => ({
        id: String(ch?.id || '').trim(),
        group: String(ch?.group || '').trim(),
        result: String(ch?.result || 'Pass').trim(),
        finding: String(ch?.finding || '').trim(),
      }))
    : [];

  const strengths = Array.isArray(rawReport?.strengths) ? rawReport.strengths.map((x) => String(x || '').trim()).filter(Boolean) : [];
  const legacyMustFix = Array.isArray(rawReport?.mustFix) ? rawReport.mustFix.map((x) => String(x || '').trim()).filter(Boolean) : [];
  const legacyIssues = Array.isArray(rawReport?.issues) ? rawReport.issues.map((x) => String(x || '').trim()).filter(Boolean) : [];

  const mustFix = [
    ...hardFails.map((hf) => `[${hf.code}] ${hf.location ? `${hf.location}: ` : ''}${hf.reason || hf.label}`),
    ...errors
      .filter((e) => e.severity === 'Critical' || e.severity === 'Major')
      .map((e) => `[${e.code} · ${e.location}] ${e.reason}${e.fix ? ` -> Cách sửa: ${e.fix}` : ''}`),
    ...unverifiedCriticalClaims.map((c) => `[Cần xác minh/loại bỏ tuyên bố chưa có nguồn] ${c}`),
    ...legacyMustFix,
  ];
  const issues = [
    ...errors
      .filter((e) => e.severity === 'Minor')
      .map((e) => `[${e.code} · ${e.location}] ${e.reason}${e.fix ? ` -> ${e.fix}` : ''}`),
    ...legacyIssues,
  ];

  let auditVerdict = 'REVISION_REQUIRED';
  const meetsApprovalThreshold =
    finalScore >= 85 &&
    hardFails.length === 0 &&
    below60Categories.length === 0 &&
    unverifiedCriticalClaims.length === 0;

  if (hardFails.length > 0) {
    auditVerdict = 'REJECTED';
  } else if (effectiveRound === 1) {
    // Mục 2 SEO-AUDITOR-01: Vòng 1 TUYỆT ĐỐI không cấp APPROVED
    if (meetsApprovalThreshold && String(rawReport?.verdict || '').toLowerCase() !== 'revise') {
      auditVerdict = 'PROVISIONAL_PASS';
    } else if (finalScore < 70 && !hasDetailedRubric && String(rawReport?.verdict || '').toLowerCase() === 'revise') {
      auditVerdict = 'REVISION_REQUIRED';
    } else if (finalScore < 70 && hasDetailedRubric) {
      auditVerdict = 'REJECTED';
    } else {
      auditVerdict = 'REVISION_REQUIRED';
    }
  } else {
    if (meetsApprovalThreshold && String(rawReport?.verdict || '').toLowerCase() !== 'revise') {
      auditVerdict = 'APPROVED';
    } else if (finalScore < 70 && hasDetailedRubric) {
      auditVerdict = 'REJECTED';
    } else {
      auditVerdict = 'REVISION_REQUIRED';
    }
  }

  const verdict = auditVerdict === 'APPROVED' || auditVerdict === 'PROVISIONAL_PASS' ? 'pass' : 'revise';
  const band = classifyAuditBand(finalScore);

  return {
    round: effectiveRound,
    protocol: AUDIT_PROTOCOL_ID,
    score: finalScore,
    rawTotal,
    band,
    auditVerdict,
    verdict,
    lockedIntent: String(rawReport?.lockedIntent || '').trim(),
    targetAudience: String(rawReport?.targetAudience || '').trim(),
    categoryBreakdown: hasDetailedRubric ? categoryBreakdown : null,
    below60Categories,
    hardFails,
    appliedCaps,
    unverifiedCriticalClaims,
    challengeResults,
    errors,
    strengths,
    issues,
    mustFix,
    summary: String(rawReport?.summary || '').trim() || (verdict === 'pass' ? 'Đạt chuẩn kiểm duyệt độc lập.' : 'Cần chỉnh sửa theo bằng chứng đã nêu.'),
  };
}

/**
 * Role Isolation Firewall (SEO-AUDITOR-01 Section 13):
 * Filters audit results before passing to the Writer AI.
 * Keeps ONLY category scores + evidence-backed errors & concrete fixes.
 * Strips challenge bank IDs, internal challenge results, and scoring thresholds.
 */
export function sanitizeAuditFeedbackForWriter(auditResult) {
  if (!auditResult || auditResult.status === 'error' || auditResult.status === 'skipped') {
    return '';
  }

  const lines = [];
  if (auditResult.categoryBreakdown) {
    const scoreLine = AUDIT_RUBRIC.map((cat) => {
      const b = auditResult.categoryBreakdown[cat.code];
      return b ? `${cat.code}: ${b.score}/${cat.max}` : '';
    })
      .filter(Boolean)
      .join(' · ');
    if (scoreLine) lines.push(`Điểm từng hạng mục: ${scoreLine}`);
  } else if (typeof auditResult.score === 'number') {
    lines.push(`Điểm đánh giá: ${auditResult.score}/100`);
  }

  if (auditResult.summary) {
    lines.push(`Nhận xét tổng quan: ${auditResult.summary}`);
  }

  if (Array.isArray(auditResult.errors) && auditResult.errors.length) {
    lines.push('Danh sách lỗi có bằng chứng cần khắc phục:');
    for (const err of auditResult.errors) {
      lines.push(
        `- [${err.severity}] Vị trí: ${err.location}${err.excerpt ? ` ("${err.excerpt}")` : ''} | Lỗi: ${err.reason}${err.fix ? ` | Yêu cầu sửa: ${err.fix}` : ''}`
      );
    }
  } else if (Array.isArray(auditResult.mustFix) && auditResult.mustFix.length) {
    lines.push('Các điểm bắt buộc sửa:');
    for (const item of auditResult.mustFix) {
      lines.push(`- ${item}`);
    }
  }

  if (Array.isArray(auditResult.issues) && auditResult.issues.length && !(auditResult.errors && auditResult.errors.length)) {
    for (const iss of auditResult.issues) {
      lines.push(`- ${iss}`);
    }
  }

  if (Array.isArray(auditResult.unverifiedCriticalClaims) && auditResult.unverifiedCriticalClaims.length) {
    lines.push('Tuyên bố chưa có nguồn xác minh cần viết lại thận trọng hoặc bỏ:');
    for (const claim of auditResult.unverifiedCriticalClaims) {
      lines.push(`- ${claim}`);
    }
  }

  return lines.join('\n').trim();
}
