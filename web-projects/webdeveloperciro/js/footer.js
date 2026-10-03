(()=>{'use strict';const footer=document.querySelector('.site-footer'),notice=document.getElementById('cookieNotice');if(!footer||!notice)return;
let pending=0;
const measure=()=>{pending=0;const style=getComputedStyle(notice);const shown=!notice.hidden&&style.display!=='none'&&style.visibility!=='hidden'&&style.position==='fixed';const space=shown?Math.ceil(notice.getBoundingClientRect().height+32):0;footer.style.setProperty('--footer-notice-space',space+'px');};
const queue=()=>{if(!pending)pending=requestAnimationFrame(measure);};
if('ResizeObserver'in window)new ResizeObserver(queue).observe(notice);
if('MutationObserver'in window)new MutationObserver(queue).observe(notice,{attributes:true,attributeFilter:['hidden','style','class']});
addEventListener('resize',queue,{passive:true});addEventListener('pageshow',queue);measure();
})();
