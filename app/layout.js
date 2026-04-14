// app/layout.js
export const metadata = { title: 'Command Center' };

export default function RootLayout({ children }) {
  return (
    <html lang="lv">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes liveBlink{0%,100%{opacity:1}50%{opacity:0.3}}
          @keyframes liveDot{0%,100%{box-shadow:0 0 0 0 rgba(48,209,88,0.6)}50%{box-shadow:0 0 10px 5px rgba(48,209,88,0)}}
          @keyframes pulseRed{0%,100%{background:transparent}50%{background:rgba(255,55,95,0.08)}}
          @keyframes pulseOrange{0%,100%{background:transparent}50%{background:rgba(255,159,10,0.08)}}
          @keyframes slideInLeft{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
          .live-badge{animation:liveBlink 2s ease-in-out infinite}
          .live-dot{animation:liveDot 2s ease-in-out infinite}
          .pulse-red{animation:pulseRed 3s ease-in-out infinite;border-radius:6px}
          .pulse-orange{animation:pulseOrange 3.5s ease-in-out infinite;border-radius:6px}
          .cal-item{animation:slideInLeft 0.4s ease-out both}
          #fs-btn:hover{background:rgba(255,255,255,0.15)!important}
        `}} />
        <script dangerouslySetInnerHTML={{ __html: `
          // Pulkstenis katru sekundi
          setInterval(function(){
            var el = document.getElementById('clock');
            if(el){
              el.textContent = new Date().toLocaleString('lv-LV',{timeZone:'Europe/Riga',hour:'2-digit',minute:'2-digit',hour12:false});
            }
          }, 1000);

          // Smart refresh — fetch jauno lapu un swap DOM, saglabā fullscreen
          setInterval(function(){
            fetch(location.href)
              .then(function(r){ return r.text(); })
              .then(function(html){
                var parser = new DOMParser();
                var doc = parser.parseFromString(html, 'text/html');
                var newBody = doc.querySelector('body');
                if(newBody){
                  document.body.innerHTML = newBody.innerHTML;
                }
              })
              .catch(function(e){ console.log('Refresh error:', e); });
          }, 60000);

          // Full Screen poga
          document.addEventListener('click', function(e){
            var btn = e.target.closest('#fs-btn');
            if(!btn) return;
            if(!document.fullscreenElement && !document.webkitFullscreenElement){
              var el = document.documentElement;
              if(el.requestFullscreen) el.requestFullscreen().catch(function(){});
              else if(el.webkitRequestFullscreen) el.webkitRequestFullscreen();
            } else {
              if(document.exitFullscreen) document.exitFullscreen();
              else if(document.webkitExitFullscreen) document.webkitExitFullscreen();
            }
          });
          document.addEventListener('fullscreenchange', function(){
            var btn = document.getElementById('fs-btn');
            if(btn) btn.textContent = document.fullscreenElement ? '✕ Exit' : '⛶ Full Screen';
          });
          document.addEventListener('webkitfullscreenchange', function(){
            var btn = document.getElementById('fs-btn');
            if(btn) btn.textContent = (document.webkitFullscreenElement) ? '✕ Exit' : '⛶ Full Screen';
          });
        `}} />
      </head>
      <body style={{ margin: 0, padding: 0, overflow: 'hidden', background: '#0a0a0a' }}>
        {children}
      </body>
    </html>
  );
}
