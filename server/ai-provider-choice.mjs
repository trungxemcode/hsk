// Hỏi đáp AI: nhà cung cấp mà học viên chọn trong ô chat. 'auto' giữ nguyên hành vi cũ của Worker.
export const AI_PROVIDER_CHOICES=new Set(['auto','system-gemini','system-chatgpt','personal']);
export const PERSONAL_PROVIDER_IDS=['openai','fosta','deepseek','claude','gemini','chatgpt-cookie','muse-cookie'];

export function normalizeAiProviderChoice(value){
  if(value===undefined||value===null||value==='')return 'auto';
  return typeof value==='string'&&AI_PROVIDER_CHOICES.has(value)?value:null;
}

// Trả về lý do không dùng được (tiếng Việt) hoặc null nếu lựa chọn khả dụng.
export function aiProviderChoiceError(choice,{personalEnabled=false,sharedCookieReady=false,geminiReady=false}={}){
  if(choice==='personal'&&!personalEnabled)return 'API riêng chưa được bật. Hãy bật hoặc nhập API/cookie trong Cài đặt.';
  if(choice==='system-chatgpt'&&!sharedCookieReady)return 'ChatGPT của hệ thống chưa được admin cấu hình.';
  if(choice==='system-gemini'&&!geminiReady)return 'Gemini của hệ thống chưa sẵn sàng.';
  return null;
}

// Công khai cho client: chỉ trạng thái khả dụng, không có key/cookie.
export function describeAiProviders({geminiReady=false,sharedCookieReady=false,personal=null}={}){
  const configured=personal?.configured===true;
  return {
    system:{gemini:{available:Boolean(geminiReady)},chatgpt:{available:Boolean(sharedCookieReady)}},
    personal:{
      configured,
      enabled:configured&&personal?.enabled===true,
      provider:configured&&PERSONAL_PROVIDER_IDS.includes(personal?.provider)?personal.provider:null,
      model:configured&&typeof personal?.model==='string'?personal.model.slice(0,100):null,...(configured&&typeof personal?.planType==='string'?{planType:personal.planType}:{}),...(configured&&Array.isArray(personal?.models)&&personal.models.length?{models:personal.models.slice(0,12)}:{})
    }
  };
}
