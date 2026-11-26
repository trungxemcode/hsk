/**
 * SEO-WRITER-01: Content Production Standard for HSK Flashcards Writer AI.
 * Strictly isolated from independent auditing, scoring rubrics, and internal challenges.
 */

export const WRITER_STANDARD_ID = 'SEO-WRITER-01';

export const WRITER_CATEGORIES = Object.freeze({
  'ky-thi': 'Kỳ thi & Đăng ký',
  'diem-so': 'Điểm số & Tra điểm',
  'meo-hoc': 'Mẹo học HSK',
  'ngu-phap': 'Phân biệt & Ngữ pháp',
});

export const WRITER_STYLES = Object.freeze({
  'informative-expert': {
    id: 'informative-expert',
    label: 'Informative & Expert — Cung cấp thông tin chuyên môn',
    useFor: 'Định nghĩa, kiến thức tiếng Trung, cấu trúc ngữ pháp, phân loại, giải thích thuật ngữ, thông tin kỳ thi HSK.',
    tone: 'Khách quan, chuẩn mực, chính xác, có tính chuyên môn. Tránh khẳng định tuyệt đối khi dữ liệu chưa đủ.',
    instructions: [
      '- Mở đầu bằng định nghĩa hoặc câu trả lời trực tiếp cho chủ đề, không vòng vo.',
      '- Giải thích từ nền tảng đến chi tiết; phân loại khi việc phân loại giúp người đọc hiểu rõ hơn.',
      '- Nêu rõ điều kiện, ngoại lệ và giới hạn áp dụng của quy tắc hoặc thông tin.',
      '- Đặt các khái niệm dễ nhầm cạnh nhau để phân biệt bằng ví dụ đúng ngữ cảnh.',
      '- Kết luận bằng phần tổng hợp kiến thức cốt lõi, không biến bài kiến thức thành quảng cáo.',
    ].join('\n'),
  },
  'educational-how-to': {
    id: 'educational-how-to',
    label: 'Educational & How-to — Hướng dẫn thực hành',
    useFor: 'Cách học từ vựng, luyện nghe, luyện viết, phương pháp ôn thi, lộ trình học HSK và thao tác tra cứu.',
    tone: 'Sư phạm, trực tiếp, có hệ thống. Ưu tiên câu hướng dẫn rõ nghĩa hơn câu văn hoa mỹ.',
    instructions: [
      '- Nêu rõ kết quả thực tế người đọc đạt được và kiến thức/điều kiện cần chuẩn bị.',
      '- Chia quy trình thành từng bước đúng thứ tự thực hiện; mỗi bước có hành động cụ thể, mục đích và dấu hiệu làm đúng.',
      '- Chỉ dùng ví dụ, mẫu câu hoặc bảng khi thực sự giúp người học làm theo dễ hơn.',
      '- Nêu lỗi sai hay gặp và cách khắc phục tương ứng; không hứa hẹn mốc kết quả cố định thiếu căn cứ.',
    ].join('\n'),
  },
  'problem-solution': {
    id: 'problem-solution',
    label: 'Problem–Solution — Phân tích vấn đề và giải pháp',
    useFor: 'Lỗi phát âm, lỗi ngữ pháp, khó ghi nhớ từ vựng, nghe không hiểu, học lâu không tiến bộ.',
    tone: 'Phân tích, logic, thực tế và tập trung giải quyết đúng gốc vấn đề.',
    instructions: [
      '- Xác định chính xác biểu hiện của vấn đề và phân biệt rõ biểu hiện với nguyên nhân gốc.',
      '- Giải thích cơ chế hoặc hoàn cảnh khiến người Việt mắc lỗi nếu có đủ căn cứ ngôn ngữ.',
      '- Ghép từng giải pháp cụ thể với nguyên nhân tương ứng, kèm cách áp dụng và cách tự kiểm tra hiệu quả.',
      '- Nêu rõ giới hạn khi giải pháp không phù hợp; tuyệt đối không phóng đại nỗi lo để ép người đọc dùng sản phẩm.',
    ].join('\n'),
  },
  'persuasive-conversion': {
    id: 'persuasive-conversion',
    label: 'Persuasive & Conversion — Thuyết phục và chuyển đổi',
    useFor: 'Giới thiệu HSK Flashcards, công cụ luyện đề, Gia sư AI, Sửa câu tiếng Trung và trang đích tính năng.',
    tone: 'Chuyên nghiệp, thuyết phục dựa trên giá trị thật, không khoa trương hay tạo khan hiếm giả.',
    instructions: [
      '- Bắt đầu từ nhiệm vụ cụ thể người học muốn hoàn thành (ôn flashcard, chấm điểm thử, sửa lỗi câu).',
      '- Trình bày tính năng bằng lợi ích thực tế, gắn với quy trình sử dụng và ví dụ đầu ra có thể xác minh.',
      '- Phân biệt minh bạch tính năng miễn phí trên trình duyệt; không tạo lời hứa tuyệt đối.',
      '- Đặt CTA ở cuối bài đúng ngữ cảnh, nhẹ nhàng, không gây áp lực.',
    ].join('\n'),
  },
});

export function selectWriterStyle({ topic = '', query = '', category = '', requestedStyle = '' } = {}) {
  if (requestedStyle && WRITER_STYLES[requestedStyle]) {
    const s = WRITER_STYLES[requestedStyle];
    return { ...s, reason: `Chọn văn phong ${s.label} theo chỉ định biên tập.` };
  }
  const combined = `${query} ${topic}`.toLowerCase();
  if (/(?:lỗi sai|mắc lỗi|sửa lỗi|lỗi ngữ pháp|lỗi phát âm|khó nhớ|nghe không|phát âm|mất gốc|nhầm lẫn|hay nhầm|khắc phục|tránh bẫy|vì sao)/.test(combined)) {
    const s = WRITER_STYLES['problem-solution'];
    return { ...s, reason: 'Chủ đề xoay quanh vướng mắc/lỗi sai cụ thể nên dùng Problem–Solution.' };
  }
  if (/(giới thiệu app|công cụ|tính năng ai|sửa câu ai|gia sư ai)/.test(combined)) {
    const s = WRITER_STYLES['persuasive-conversion'];
    return { ...s, reason: 'Chủ đề hướng tới sử dụng tính năng học tập trên nền tảng.' };
  }
  if (/(cách|lộ trình|hướng dẫn|phương pháp|ôn thi|luyện thi|tra điểm|đăng ký|tự học|mẹo|quy trình|bước)/.test(combined)) {
    const s = WRITER_STYLES['educational-how-to'];
    return { ...s, reason: 'Ý định tìm kiếm cần quy trình thực hành từng bước nên dùng Educational & How-to.' };
  }
  if (
    category === 'ngu-phap' ||
    category === 'ky-thi' ||
    category === 'diem-so' ||
    /(phân biệt|ngữ pháp|từ loại|câu chữ|trợ từ|lượng từ|lịch thi|thang điểm|hsk 3\.0|cấu trúc đề|bảng chữ cái)/.test(combined)
  ) {
    const s = WRITER_STYLES['informative-expert'];
    return { ...s, reason: 'Chủ đề kiến thức chuyên môn tiếng Trung/HSK nên dùng Informative & Expert.' };
  }
  const fallback = WRITER_STYLES['educational-how-to'];
  return { ...fallback, reason: 'Chủ đề hướng dẫn thực hành học tiếng Trung cho người Việt.' };
}

export const WRITER_SYSTEM_PROMPT = `Bạn là AI Viết bài SEO tiếng Việt cho nền tảng học tiếng Trung HSK Flashcards (https://hskfreelearningai.pages.dev), tuân thủ nghiêm ngặt quy chuẩn sản xuất nội dung ${WRITER_STANDARD_ID}.

NGUYÊN TẮC CỐT LÕI:
1. Người đọc là trung tâm & đúng Search Intent: trả lời trực tiếp câu hỏi/nhiệm vụ trọng tâm, không viết để kéo dài bài hay lặp từ khóa.
2. Đúng sự thật & minh bạch: tuyệt đối không bịa số liệu, nghiên cứu, trích dẫn, URL nguồn, tính năng hay chính sách sản phẩm; phân biệt rõ dữ kiện, quy tắc, ngoại lệ và ví dụ minh họa.
3. Chuẩn tiếng Việt (Mục 3):
   - KHÔNG dùng văn phong trò chuyện hoặc đại từ suồng sã ("mình", "tụi mình", "bạn nhé", "nha", "cùng khám phá nào").
   - KHÔNG dùng câu sáo rỗng hay cường điệu ("trong thời đại công nghệ phát triển", "không thể phủ nhận rằng", "có thể nói rằng", "bí quyết thần kỳ", "đừng bỏ lỡ cơ hội", "chắc chắn bạn sẽ thành thạo", "hãy cùng chúng tôi khám phá", "thần tốc", "thần thánh", "hoàn hảo").
   - KHÔNG lạm dụng dấu chấm than, câu hỏi tu từ, emoji hay chữ in hoa toàn từ.
   - Mỗi đoạn tập trung 1 ý chính, câu văn tự nhiên, dùng thuật ngữ nhất quán.
4. Chuẩn tiếng Trung & HSK (Mục 8.1–8.2):
   - Chữ Hán giản thể chính xác; Pinyin BẮT BUỘC đúng thanh điệu (ā á ǎ à, ē é ě è, ī í ǐ ì, ō ó ǒ ò, ū ú ǔ ù, ǖ ǘ ǚ ǜ); nghĩa tiếng Việt khớp ngữ cảnh.
   - Nêu rõ phạm vi áp dụng/ngoại lệ; không trộn lẫn quy định giữa HSK 2.0 (HSK 1–6 hiện hành) và HSK 3.0.
5. Trung thực về sản phẩm (Mục 8.3):
   - Chỉ nhắc tính năng có thật trên HSK Flashcards (luyện đề HSK 1–6, flashcard SRS, Gia sư AI, Sửa câu tiếng Trung AI miễn phí trên trình duyệt).
   - KHÔNG tự bịa giá, gói cước, số lượng đề/bài học chưa xác minh, hay nhắc "hạn mức", "hạn ngạch", "xác minh email", "yêu cầu đăng nhập".
6. Thiết kế cấu trúc (Mục 5–7):
   - Các section.id bắt đầu bằng chữ cái (ví dụ: "muc-1", "muc-2").
   - Chỉ tạo bảng (tối đa 6 dòng) khi việc đối chiếu/tra cứu giúp người đọc hiểu rõ hơn; chỉ tạo FAQ khi cung cấp giá trị bổ sung, không lặp lại máy móc phần thân bài.
7. Người viết TUYỆT ĐỐI không tự ghi trạng thái "đã duyệt", không tự chấm điểm, không tự xuất bản.

CHỈ TRẢ VỀ DUY NHẤT 01 JSON OBJECT HỢP LỆ, gọn gàng, không markdown bọc ngoài.`;

export function buildStandardTrendWriterPrompt({
  topic,
  slug,
  category,
  hskTag,
  trendQuery,
  trendSource,
  trendSpike,
  style,
  existingSlugs = [],
  today,
}) {
  const chosenStyle = style?.instructions ? style : selectWriterStyle({ topic, query: trendQuery, category });
  return `Nhiệm vụ: Soạn 01 bản thảo bài viết SEO tiếng Việt nguyên bản theo quy chuẩn ${WRITER_STANDARD_ID}.

CHỦ ĐỀ & DỮ LIỆU ĐẦU VÀO:
- Từ khóa mục tiêu: "${trendQuery || topic}" (Nguồn: ${trendSource || 'google-trends'}${trendSpike ? ` · Mức độ: ${trendSpike}` : ''})
- Chủ đề đầy đủ: "${topic}"
- URL Slug dự kiến: "${slug}"
- Chuyên mục: "${category}" (${WRITER_CATEGORIES[category] || 'Mẹo học HSK'})
- Nhãn HSK: "${hskTag || 'HSK 1–6'}"
- Ngày cập nhật: "${today}"

VĂN PHONG CHỦ ĐẠO BẮT BUỘC — [${chosenStyle.label}]:
- Lý do chọn: ${chosenStyle.reason || chosenStyle.useFor}
- Giọng văn: ${chosenStyle.tone}
- Cách triển khai:
${chosenStyle.instructions}

YÊU CẦU NỘI DUNG & ĐẦU RA BÀN GIAO (Mục 5, 8, 9 của ${WRITER_STANDARD_ID}):
1. Giải thích sâu, có cơ chế/nguyên nhân, quy tắc đi kèm ngoại lệ hoặc lỗi người Việt thường mắc (không viết chung chung hay liệt kê hời hợt).
2. Mỗi section có 1 chức năng rõ ràng (3–4 sections, id dạng "muc-1", "muc-2"...), ít nhất 1 khối "example" chuẩn (Chữ Hán giản thể + Pinyin có thanh điệu + Nghĩa tiếng Việt tự nhiên), ít nhất 1 hộp "tip" thực tế, bảng so sánh/tra cứu <= 6 dòng nếu cần đối chiếu, và 2–3 câu "faqs" có giá trị bổ sung (không lặp lại nguyên văn thân bài).
3. Chỉ chọn 2–3 "relatedSlugs" hợp lệ từ: ${existingSlugs.slice(0, 10).join(', ')}.
4. Nếu có tuyên bố về thông tin có thể thay đổi hoặc chi tiết sản phẩm chưa có nguồn đối chiếu trực tiếp, ghi rõ vào "writerBrief.unverifiedNotes" / "writerBrief.productClaimsToConfirm" để biên tập viên xác minh; không dùng từ cấm ("hạn mức", "hạn ngạch", "xác minh email", "yêu cầu đăng nhập").
5. Không tự chấm điểm hay tự kết luận bài đã đạt chuẩn xuất bản.

TRẢ VỀ DUY NHẤT 01 JSON OBJECT:
{
  "writerBrief": {
    "searchIntent": "Informational / How-to / Problem-solving...",
    "targetAudience": "Nhóm người học HSK cụ thể tại Việt Nam",
    "styleId": "${chosenStyle.id}",
    "styleReason": "${chosenStyle.reason || ''}",
    "primaryKeyword": "${trendQuery || topic}",
    "secondaryKeywords": ["...", "..."],
    "outline": ["H1: ...", "H2: ...", "H2: ..."],
    "unverifiedNotes": [],
    "productClaimsToConfirm": []
  },
  "title": "Tiêu đề H1 rõ nghĩa, phản ánh đúng chủ đề",
  "metaTitle": "SEO Title cụ thể 35–70 ký tự | HSK Flashcards",
  "metaDescription": "Meta Description 115–160 ký tự tóm tắt giá trị thực tế",
  "summary": "Mở bài tóm tắt đi thẳng vào trọng tâm câu hỏi",
  "hskTag": "${hskTag || 'HSK 1–6'}",
  "readMinutes": 6,
  "keywords": ["...", "...", "..."],
  "sources": [],
  "sections": [
    {
      "id": "muc-1",
      "heading": "...",
      "paragraphs": ["...", "..."],
      "bullets": ["..."],
      "table": { "headers": ["...", "...", "..."], "rows": [["...", "...", "..."]] },
      "example": { "han": "...", "py": "...", "vi": "..." },
      "tip": "..."
    }
  ],
  "faqs": [{ "q": "...", "a": "..." }],
  "relatedSlugs": [],
  "cta": { "heading": "...", "body": "...", "buttonLabel": "..." }
}`;
}

export function buildStandardRevisionWriterPrompt({
  draft,
  sanitizedFeedback = '',
  adminComment = '',
  rating = null,
  existingSlugs = [],
  today,
}) {
  const styleId = draft?.editorialVoice || draft?.writerBrief?.styleId || '';
  const style = selectWriterStyle({
    topic: draft?.article?.title,
    query: draft?.trendQuery,
    category: draft?.category || draft?.article?.category,
    requestedStyle: styleId,
  });

  const feedbackParts = [];
  if (sanitizedFeedback && String(sanitizedFeedback).trim()) {
    feedbackParts.push(`CÁC LỖI CẦN KHẮC PHỤC (kèm bằng chứng & vị trí):\n${String(sanitizedFeedback).trim()}`);
  }
  if (adminComment && String(adminComment).trim()) {
    feedbackParts.push(
      `GÓP Ý TRỰC TIẾP CỦA ADMIN${rating ? ` (${rating}/5 sao)` : ''}:\n"""\n${String(adminComment).trim()}\n"""`
    );
  }
  if (!feedbackParts.length) {
    feedbackParts.push('Nâng cấp độ sâu chuyên môn, chuẩn xác Chữ Hán – Pinyin – Việt, ngoại lệ ngữ pháp và tính tự nhiên tiếng Việt.');
  }

  return `Nhiệm vụ: Chỉnh sửa bản thảo bài SEO theo quy chuẩn ${WRITER_STANDARD_ID} để xử lý triệt để các lỗi được chỉ ra.

VĂN PHONG CHỦ ĐẠO CẦN GIỮ VỮNG — [${style.label}]:
${style.instructions}

${feedbackParts.join('\n\n')}

BẢN THẢO HIỆN TẠI (version ${draft?.version || 1}, từ khóa: "${draft?.trendQuery || draft?.article?.title || ''}"):
${JSON.stringify(draft?.article || {})}

YÊU CẦU KHI SỬA BÀI:
1. Sửa tận gốc từng lỗi được nêu theo đúng vị trí; khi thay đổi một luận điểm, rà soát các đoạn, bảng và ví dụ phụ thuộc để đảm bảo nhất quán toàn bài (không chỉ đổi chữ bề mặt).
2. Giữ chuẩn tiếng Việt ${WRITER_STANDARD_ID} (không đại từ trò chuyện, không từ sáo rỗng, không cường điệu, không bịa nguồn/số liệu, không dùng cụm "hạn mức", "hạn ngạch", "xác minh email", "yêu cầu đăng nhập").
3. Kiểm tra lại Chữ Hán giản thể, dấu thanh điệu Pinyin, nghĩa tiếng Việt, các bảng (<= 6 dòng), ví dụ và FAQs.
4. Ngày cập nhật: "${today}". Chỉ chọn "relatedSlugs" từ: ${existingSlugs.slice(0, 10).join(', ')}.
5. Không tự chấm điểm hoặc tự kết luận bài đạt chuẩn xuất bản.

TRẢ VỀ DUY NHẤT 01 JSON OBJECT GỒM:
{
  "revisionSummary": "Tóm tắt ngắn gọn các phần nội dung đã sửa tận gốc",
  "writerBrief": ${JSON.stringify(draft?.writerBrief || { styleId: style.id, primaryKeyword: draft?.trendQuery || '' })},
  "title": "...",
  "metaTitle": "...",
  "metaDescription": "...",
  "summary": "...",
  "hskTag": "...",
  "readMinutes": 6,
  "keywords": ["..."],
  "sources": [],
  "sections": [...],
  "faqs": [...],
  "relatedSlugs": [...],
  "cta": { "heading": "...", "body": "...", "buttonLabel": "..." }
}`;
}
