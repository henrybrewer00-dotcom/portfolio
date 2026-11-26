document.documentElement.classList.add("pre");
(function(){let done=false;const go=()=>{if(done)return;done=true;document.documentElement.classList.remove("pre")};requestAnimationFrame(()=>requestAnimationFrame(go));setTimeout(go,120)})();
