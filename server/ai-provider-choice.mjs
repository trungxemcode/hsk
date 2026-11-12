// Hỏi đáp AI: nhà cung cấp mà học viên chọn trong ô chat. 'auto' giữ nguyên hành vi cũ của Worker.
export const AI_PROVIDER_CHOICES=new Set(['auto','system-gemini','system-chatgpt','personal']);
export const PERSONAL_PROVIDER_IDS=['openai','fosta','deepseek','claude','gemini','chatgpt-cookie','muse-cookie','custom'];

export function normalizeAiProviderChoice(value){
  if(value===undefined||value===null||value==='')return 'auto';
  if(typeof value!=='string')return null;
  if(AI_PROVIDER_CHOICES.has(value))return value;
  if(value.startsWith('personal:')){
    const prov=value.slice(9);
    if(PERSONAL_PROVIDER_IDS.includes(prov))return value;
  }
  return null;
}

// Trả về lý do không dùng được (tiếng Việt) hoặc null nếu lựa chọn khả dụng.
export function aiProviderChoiceError(choice,{personalEnabled=false,personalProviders=null,sharedCookieReady=false,geminiReady=false}={}){
  if(choice==='personal'&&!personalEnabled)return 'API riêng chưa được bật. Hãy bật hoặc nhập API/cookie trong Cài đặt.';
  if(choice.startsWith('personal:')){
    const prov=choice.slice(9);
    const provData=personalProviders?.[prov];
    const isReady=provData?Boolean(provData.enabled):personalEnabled;
    if(!isReady)return `Nhà cung cấp riêng ${prov} chưa được bật hoặc chưa cấu hình trong Cài đặt.`;
  }
  if(choice==='system-chatgpt'&&!sharedCookieReady)return 'ChatGPT của hệ thống chưa được admin cấu hình.';
  if(choice==='system-gemini'&&!geminiReady)return 'Gemini của hệ thống chưa sẵn sàng.';
  return null;
}

// Công khai cho client: chỉ trạng thái khả dụng, không có key/cookie.
export function describeAiProviders({geminiReady=false,sharedCookieReady=false,personal=null}={}){
  const configured=personal?.configured===true;
  const providers=personal?.providers&&typeof personal.providers==='object'?personal.providers:null;
  let sanitizedProviders=undefined;
  if(configured&&providers){
    sanitizedProviders={};
    for(const [pId,pData] of Object.entries(providers)){
      if(PERSONAL_PROVIDER_IDS.includes(pId)&&pData&&pData.configured){
        sanitizedProviders[pId]={
          configured:true,
          enabled:pData.enabled===true,
          provider:pId,
          model:typeof pData.model==='string'?pData.model.slice(0,100):null,
          ...(typeof pData.endpoint==='string'?{endpoint:pData.endpoint.slice(0,300)}:{}),
          ...(typeof pData.planType==='string'?{planType:pData.planType}:{}),
          ...(Array.isArray(pData.models)&&pData.models.length?{models:pData.models.slice(0,12)}:{})
        };
      }
    }
  }
  return {
    system:{gemini:{available:Boolean(geminiReady)},chatgpt:{available:Boolean(sharedCookieReady)}},
    personal:{
      configured,
      enabled:configured&&personal?.enabled===true,
      provider:configured&&PERSONAL_PROVIDER_IDS.includes(personal?.provider)?personal.provider:null,
      model:configured&&typeof personal?.model==='string'?personal.model.slice(0,100):null,
      ...(configured&&typeof personal?.planType==='string'?{planType:personal.planType}:{}),
      ...(configured&&Array.isArray(personal?.models)&&personal.models.length?{models:personal.models.slice(0,12)}:{}),
      ...(configured&&sanitizedProviders?{providers:sanitizedProviders}:{})
    }
  };
}
