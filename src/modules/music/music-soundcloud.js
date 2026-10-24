/* Official SoundCloud Widget adapter; normalizes async position getters to the lesson player. */
(()=>{
 'use strict';
 let loading;
 async function ready(){
  if(window.SC?.Widget)return;
  if(!loading)loading=new Promise((resolve,reject)=>{
   const script=document.createElement('script');script.src='https://w.soundcloud.com/player/api.js';
   const timer=setTimeout(()=>reject(Error('SoundCloud chưa sẵn sàng. Kiểm tra mạng và thử lại.')),12000);
   script.onload=()=>{clearTimeout(timer);if(window.SC?.Widget)resolve();else reject(Error('Không tải được trình phát SoundCloud.'));};
   script.onerror=()=>{clearTimeout(timer);reject(Error('Không tải được trình phát SoundCloud.'));};document.head.append(script);
  }).catch(e=>{loading=null;throw e;});
  return loading;
 }
 async function mount(source,container,{isCurrent,onReady,onTick,onError,onStateChange=()=>{}}){
  const link=window.HSKMusicCore.parseLink(source.url),frame=document.createElement('iframe');frame.src=link.embedUrl;frame.title='Trình phát SoundCloud';frame.allow='autoplay';frame.height='166';frame.width='100%';container.replaceChildren(frame);
  await ready();if(!isCurrent()){frame.remove();return null;}
  const widget=SC.Widget(frame),events=SC.Widget.Events;let position=0,duration=0,state=2,destroyed=false;
  const adapter={officialWidget:true,getMetadata:fn=>widget.getCurrentSound?.(data=>{if(active())fn(data);}),getDuration:()=>duration,getCurrentTime:()=>position,getPlayerState:()=>state,seekTo:t=>{position=t;widget.seekTo(t*1000);},playVideo:()=>widget.play(),pauseVideo:()=>widget.pause(),destroy(){destroyed=true;for(const name of Object.values(events))widget.unbind(name);frame.remove();},getAvailablePlaybackRates:()=>[1]};
  const active=()=>!destroyed&&isCurrent();
  widget.bind(events.READY,()=>{if(active()){widget.getDuration?.(ms=>{if(active()){duration=Number(ms)/1000||0;onTick();}});onReady(adapter);}});
  widget.bind(events.PLAY,()=>{if(active()){state=1;onStateChange(state);}});
  widget.bind(events.PAUSE,()=>{if(active()){state=2;onStateChange(state);}});
  widget.bind(events.FINISH,()=>{if(active()){state=0;onStateChange(state);}});
  const progress=e=>{if(active()){position=Number(e.currentPosition||0)/1000;onTick();}};
  widget.bind(events.PLAY_PROGRESS,progress);widget.bind(events.SEEK,progress);
  widget.bind(events.ERROR,()=>{if(active()){state=2;onError('Bài SoundCloud không phát được hoặc không cho phép nhúng.');}});
  return adapter;
 }
 window.HSKMusicSoundCloud={mount};
})();
