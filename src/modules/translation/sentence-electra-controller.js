(() => {
  'use strict';
  const workerUrl=new URL('./sentence-onnx-worker.js',document.currentScript.src);
  window.HSKSentenceElectraTrial=function({panel,draft,onSuggestions}){
    const pick=panel.querySelector('.sentence-electra-pick');
    const input=panel.querySelector('.sentence-electra-file');
    const run=panel.querySelector('.sentence-electra-run');
    const stop=panel.querySelector('.sentence-electra-stop');
    const status=panel.querySelector('.sentence-electra-status');
    let worker=null,ready=false,timeout,snapshot='',revision=0;

    function release(message){
      clearTimeout(timeout);
      worker?.terminate();
      worker=null;ready=false;revision++;
      pick.disabled=false;run.hidden=true;stop.hidden=true;
      onSuggestions([]);
      status.textContent=message;
    }
    function request(data,limit){
      clearTimeout(timeout);
      timeout=setTimeout(()=>release('Model 103 MB xử lý quá lâu trên thiết bị này.'),limit);
      worker.postMessage(data);
    }
    function check(){
      if(!ready||run.disabled)return;
      snapshot=draft.value;
      if(!/\p{Script=Han}/u.test(snapshot)){status.textContent='Nhập đoạn tiếng Trung cần thử.';return;}
      run.disabled=true;
      status.textContent='Đang kiểm tra trên thiết bị…';
      request({type:'detect',text:snapshot,revision},45000);
    }

    pick.addEventListener('click',()=>input.click());
    input.addEventListener('change',()=>{
      const file=input.files[0];input.value='';
      if(!file)return;
      release('Đang nạp model 103 MB…');
      if(file.size!==103137607){status.textContent='Hãy chọn gói HSK_ELECTRA_INT8_Experimental.hskmodel.';return;}
      try { worker=new Worker(workerUrl); }
      catch { release('Thiết bị chưa mở được model thử nghiệm.');return; }
      pick.disabled=true;stop.hidden=false;
      worker.onerror=()=>release('Không chạy được model 103 MB trên thiết bị này.');
      worker.onmessage=({data})=>{
        clearTimeout(timeout);
        if(data.type==='error'){release('Không nạp hoặc chạy được model 103 MB. Kiểm tra gói đã tải.');return;}
        if(data.type==='detector-ready'){
          ready=true;run.hidden=false;run.disabled=false;
          status.textContent='Model 103 MB đã nạp.';
          check();
        }
        if(data.type==='detector-result'){
          run.disabled=false;
          if(data.revision!==revision||snapshot!==draft.value){
            status.textContent='Văn bản đã đổi. Bấm Chạy lại để kiểm tra.';
            return;
          }
          onSuggestions(data.suggestions);
          status.textContent='Model 103 MB · '+data.suggestions.length+' vị trí nghi vấn · '+data.elapsed+' ms';
        }
      };
      request({type:'load-detector',file},90000);
    });
    run.addEventListener('click',check);
    stop.addEventListener('click',()=>release('Đã dừng model 103 MB và giải phóng Worker.'));
    return {
      invalidate(){revision++;onSuggestions([]);},
      pause(){if(worker)release('Model 103 MB đã dừng khi rời trình sửa câu.');}
    };
  };
})();
