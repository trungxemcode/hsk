/* Expand FP16 weights/operations to FP32 in the worker. The compact downloaded
   ONNX remains on disk. This avoids unstable half-precision CPU inference. */
(function(root){'use strict';
function varint(n){const out=[];do{const v=n%128;n=Math.floor(n/128);out.push(v+(n?128:0));}while(n);return Uint8Array.from(out);}
function join(parts){return {parts,size:parts.reduce((n,p)=>n+(p.size??p.byteLength),0)};}
function delimited(n,p){return join([varint(n*8+2),varint(p.size??p.byteLength),p]);}
function scalar(n,v){return join([varint(n*8),varint(v)]);}
function fields(bytes){const out=[];let p=0;function read(){let v=0,factor=1,count=0;while(p<bytes.length&&count++<10){const b=bytes[p++];v+=(b&127)*factor;if(!(b&128))return v;factor*=128;}throw Error('Mô hình ONNX không hợp lệ.');}
 while(p<bytes.length){const start=p,tag=read(),n=Math.floor(tag/8),wire=tag%8;let value,data;if(wire===0)value=read();else if(wire===2){const length=read();if(length<0||p+length>bytes.length)throw Error('Mô hình ONNX thiếu dữ liệu.');data=bytes.subarray(p,p+length);p+=length;}else if(wire===1)p+=8;else if(wire===5)p+=4;else throw Error('Định dạng ONNX chưa được hỗ trợ.');if(p>bytes.length)throw Error('Mô hình ONNX thiếu dữ liệu.');out.push({n,wire,value,data,raw:bytes.subarray(start,p)});}return out;
}
const text=b=>new TextDecoder().decode(b),map=(bytes,fn)=>join(fields(bytes).map(f=>fn(f)||f.raw));
function halfTable(){const table=new Float32Array(65536);for(let i=0;i<65536;i++){const s=i&32768?-1:1,e=(i>>10)&31,m=i&1023;table[i]=s*(e===31?(m?NaN:Infinity):e?(1+m/1024)*2**(e-15):m*2**-24);}return table;}
function expand(input,metadata=new Uint8Array()){
 const table=halfTable();
 function tensor(bytes){const f=fields(bytes);if(f.find(v=>v.n===2)?.value!==10)return join([bytes]);if(!f.some(v=>v.n===9&&v.data))throw Error('Kiểu trọng số FP16 chưa được hỗ trợ.');return join(f.map(v=>{if(v.n===2)return scalar(2,1);if(v.n===9){const raw=v.data;if(raw.length%2)throw Error('Trọng số FP16 không hợp lệ.');const converted={size:raw.length*2,write(out,offset){const d=new DataView(out.buffer,out.byteOffset,out.byteLength);for(let i=0;i<raw.length;i+=2)d.setFloat32(offset+i*2,table[raw[i]|raw[i+1]<<8],true);}};return delimited(9,converted);}return v.raw;}));}
 const type=bytes=>map(bytes,f=>f.n===1&&f.data?delimited(1,map(f.data,v=>v.n===1&&v.value===10?scalar(1,1):null)):null);
 const info=bytes=>map(bytes,f=>f.n===2&&f.data?delimited(2,type(f.data)):null);
 function attribute(bytes,isCast){const list=fields(bytes),name=text(list.find(f=>f.n===1)?.data||new Uint8Array());return join(list.map(f=>{if(isCast&&name==='to'&&f.n===3&&f.value===10)return scalar(3,1);if((f.n===5||f.n===10)&&f.data)return delimited(f.n,tensor(f.data));if((f.n===6||f.n===11)&&f.data)return delimited(f.n,graph(f.data));return f.raw;}));}
 function node(bytes){const list=fields(bytes),cast=text(list.find(f=>f.n===4)?.data||new Uint8Array())==='Cast';return join(list.map(f=>f.n===5&&f.data?delimited(5,attribute(f.data,cast)):f.raw));}
 function graph(bytes){return map(bytes,f=>f.data?(f.n===1?delimited(1,node(f.data)):f.n===5?delimited(5,tensor(f.data)):[11,12,13].includes(f.n)?delimited(f.n,info(f.data)):null):null);}
 const model=join([map(input,f=>f.n===7&&f.data?delimited(7,graph(f.data)):null),metadata]);const output=new Uint8Array(model.size);let offset=0;
 function write(part){if(part.parts){for(const p of part.parts)write(p);}else if(part.size!==undefined&&part.write){part.write(output,offset);offset+=part.size;}else{output.set(part,offset);offset+=part.length;}}
 write(model);return output;
}
const api={expand};if(typeof module==='object'&&module.exports)module.exports=api;else root.HSKVoiceModel=api;
})(typeof self==='object'?self:globalThis);
