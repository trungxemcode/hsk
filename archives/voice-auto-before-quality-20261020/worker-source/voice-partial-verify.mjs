// Conservative recovery: independent double audio transcription, without showing expected words to the model.
// A mismatch, ambiguity, merged utterance, or provider error MUST NOT be saved as READY.
function hskVoiceNormalizeTranscript(value){
 if(typeof value!=='string')return '';
 return value.normalize('NFKC').replace(/[\s\p{P}\p{S}]/gu,'').trim();
}
export function hskVoiceMapTranscripts(expected,transcripts){
 if(!Array.isArray(expected)||!Array.isArray(transcripts)||expected.length!==transcripts.length+1)return null;
 const words=expected.map(hskVoiceNormalizeTranscript),heard=transcripts.map(hskVoiceNormalizeTranscript);
 if(words.some(x=>!x)||heard.some(x=>!x))return null;
 const matches=[];let last=-1;
 for(const spoken of heard){
  const indices=words.flatMap((word,i)=>word===spoken?[i]:[]);
  // Repeated words or homophone ambiguity cannot be assigned safely.
  if(indices.length!==1||indices[0]<=last)return null;
  last=indices[0];matches.push(last);
 }
 return matches.length===heard.length?matches:null;
}
export async function hskVoiceVerifyPartial(input, provider, signal, model = "gemini-3.5-flash-lite", classifyFailure) {
  const { items, clips } = input || {};
  if (!Array.isArray(items) || !Array.isArray(clips) || items.length < 2 || items.length > 6 || clips.length !== items.length - 1 || items.some((x) => typeof x !== "string" || !x.trim() || Array.from(x).length > 55 || /[<>\u0000-\u001f]/.test(x)) || clips.some((c) => typeof c !== "string" || c.length < 64 || c.length > 35e4 || c.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(c)) || clips.reduce((n, c) => n + c.length, 0) > 65e4) {
    return { status: 400, result: { ok: false, error: "invalid_verification_request" } };
  }
  const instructions = "Transcribe each supplied Mandarin Chinese WAV independently and exactly, in its spoken Chinese characters. Do not infer context, guess missing audio, or combine clips. If unsure, return an empty string for that clip. Respond with a JSON object containing only transcripts: an array with one string per numbered clip.";
  const parts = [{ text: instructions }];
  clips.forEach((clip, i) => {
    parts.push({ text: "Clip " + (i + 1) + ":" }, { inlineData: { mimeType: "audio/wav", data: clip } });
  });
  const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent";
  let first;
  for (let pass = 0; pass < 2; pass++) {
    let response;
    try {
      response = await provider(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: { responseMimeType: "application/json", temperature: 0, maxOutputTokens: 1024, .../^gemini-3[.-]/.test(model) ? { thinkingConfig: { thinkingLevel: "minimal" } } : {} }
      }), signal });
    } catch {
      return { status: 503, result: { ok: false, error: "batch_verification_unavailable" } };
    }
    if (!response.ok) {
      const failure = classifyFailure ? await classifyFailure(response) : { upstreamStatus: response.status, error: "asr_provider_unavailable", retryAfter: 60, retryable: true, providerAttempts: 1 };
      return { status: response.status === 429 ? 429 : 503, result: { ok: false, error: "batch_verification_unavailable",
        model, upstreamStatus: failure.upstreamStatus, providerReason: failure.error.replace(/^tts_/, "asr_"),
        retryAfter: failure.retryAfter, retryable: failure.retryable, providerAttempts: failure.providerAttempts } };
    }
    let data;
    try {
      data = await response.json();
    } catch {
      return { status: 503, result: { ok: false, error: "batch_verification_unavailable" } };
    }
    if (data?.candidates?.[0]?.finishReason !== "STOP") return { status: 422, result: { ok: false, error: "batch_verification_uncertain" } };
    let decoded;
    try {
      decoded = JSON.parse(data.candidates[0].content.parts.filter((p) => p.text).map((p) => p.text).join(""));
    } catch {
      return { status: 422, result: { ok: false, error: "batch_verification_uncertain" } };
    }
    if (!decoded || !Array.isArray(decoded.transcripts) || decoded.transcripts.length !== clips.length || decoded.transcripts.some((t) => typeof t !== "string")) {
      return { status: 422, result: { ok: false, error: "batch_verification_uncertain" } };
    }
    const current = decoded.transcripts.map(hskVoiceNormalizeTranscript);
    const mapped = hskVoiceMapTranscripts(items, current);
    if (!mapped) return { status: 422, result: { ok: false, error: "batch_verification_uncertain" } };
    if (first && JSON.stringify(first.mapped) !== JSON.stringify(mapped)) return { status: 422, result: { ok: false, error: "batch_verification_uncertain" } };
    if (first && JSON.stringify(first.current) !== JSON.stringify(current)) return { status: 422, result: { ok: false, error: "batch_verification_uncertain" } };
    first = { mapped, current };
  }
  return { status: 200, result: { ok: true, indices: first.mapped, verification: "double_asr_exact" } };
}
