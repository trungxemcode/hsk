// Shared GAS timestamp dependency for isolated module VM tests; production code is unchanged.
const vm=require('node:vm');
function install(c){if(c&&!c.hskVNTime_)c.hskVNTime_=function(value){const d=new Date(value||Date.now());if(!Number.isFinite(d.getTime()))return '';return new Date(d.getTime()+25200000).toISOString().replace('Z','+07:00');};return c;}
const create=vm.createContext,run=vm.runInNewContext;
vm.createContext=function(c,...rest){return create.call(this,install(c),...rest);};
vm.runInNewContext=function(code,c,...rest){return run.call(this,code,install(c),...rest);};
