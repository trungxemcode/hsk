(function(){'use strict';
const dock=document.getElementById('mobileDock'),root=document.documentElement;
function size(){const height=dock.getBoundingClientRect().height;if(height>0)root.style.setProperty('--mobile-dock-height',height+'px');}
size();if(window.ResizeObserver){const observer=new ResizeObserver(size);
// Padding and safe-area changes resize the BORDER box without resizing content.
try{observer.observe(dock,{box:'border-box'});}catch{observer.observe(dock);}
}window.addEventListener('resize',size,{passive:true});
})();
