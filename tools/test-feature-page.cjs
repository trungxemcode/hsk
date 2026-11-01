const {JSDOM}=require('jsdom'),fs=require('node:fs'),assert=require('node:assert/strict');
const dom=new JSDOM('<main class="workspace"></main>',{runScripts:'outside-only'}),w=dom.window;
let desktop=false;w.matchMedia=()=>({get matches(){return desktop;},addEventListener(){}});
w.HSKStudio={navigate(route){w.document.body.dataset.studioHub=route;}};
w.eval(fs.readFileSync('src/modules/shell/feature-page.js','utf8'));
// DOM harnesses do not implement native dialog APIs. Loading unrelated tools must still work.
const cold=w.HSKFeaturePage('cold','cold');assert.equal(cold.open,false);
w.HTMLDialogElement.prototype.showModal=w.HTMLDialogElement.prototype.show=function(){this.open=true;};
w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
const phone=w.HSKFeaturePage('phone','phone');phone.showModal();assert.ok(phone.open);assert.equal(phone.parentElement,w.document.body);assert.equal(phone.className,'');phone.close();assert.equal(phone.open,false);
desktop=true;const pc=w.HSKFeaturePage('pc','writing');pc.showModal();assert.ok(pc.open);assert.equal(pc.parentElement,w.document.querySelector('main.workspace'));assert.equal(pc.getAttribute('role'),'region');assert.equal(w.document.body.dataset.studioHub,'writing');pc.close();assert.equal(pc.open,false);assert.equal(w.document.body.dataset.studioHub,'practice');
dom.window.close();console.log('PASS feature pages initialize without dialog APIs; phone modal and PC page lifecycle');
