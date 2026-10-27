import {bounded} from './groq-alignment.mjs';
// Header + concatenated independently playable M4A clips, uploaded privately by owner.
export async function loadRepairChunk(bucket,id,window,used=[]){
 const key='audio-chunks/'+id+'.bin';
 try{
  const first=await bucket.get(key,{range:{offset:0,length:4}});if(!first)return null;
  const size=first.size,bytes=await bounded(first.body,4);if(bytes.length!==4)return null;
  const length=new DataView(bytes.buffer,bytes.byteOffset,4).getUint32(0);if(length<1||length>16000)return null;
  const index=JSON.parse(new TextDecoder().decode(await bounded((await bucket.get(key,{range:{offset:4,length}})).body,16000)));
  if(index.version!==1||index.audioId!==id||!Array.isArray(index.chunks)||index.chunks.length>12)return null;
  const choices=index.chunks.map((c,i)=>({...c,index:i})).filter(c=>!used.includes(c.index)&&Number.isFinite(c.start)&&c.start>=0&&Number.isFinite(c.duration)&&c.duration>0&&c.duration<=61&&Number.isInteger(c.offset)&&c.offset>=0&&Number.isInteger(c.length)&&c.length>12&&c.length<=2*1024*1024&&4+length+c.offset+c.length<=size&&/^[a-f0-9]{64}$/.test(c.sha256||'')).map(c=>({...c,overlap:Math.min(window.end,c.start+c.duration)-Math.max(window.start,c.start)})).filter(c=>c.overlap>=.5).sort((a,b)=>b.overlap-a.overlap||Math.abs(a.start+a.duration/2-(window.start+window.end)/2)-Math.abs(b.start+b.duration/2-(window.start+window.end)/2));
  const clip=choices[0];return clip?{...clip,key,range:{offset:4+length+clip.offset,length:clip.length}}:null;
 }catch{return null;}
}
