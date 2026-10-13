(function(){'use strict';
const dock=document.getElementById('mobileDock'),root=document.documentElement;
function size(){const height=dock.getBoundingClientRect().height;if(height>0)root.style.setProperty('--mobile-dock-height',height+'px');}
size();if(window.ResizeObserver)new ResizeObserver(size).observe(dock);window.addEventListener('resize',size,{passive:true});
})();
