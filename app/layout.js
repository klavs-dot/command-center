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

          // ═══ PIN LOCK ═══
          (function(){
            var PIN = '3159';
            var COOKIE_NAME = 'cc_auth';
            var SIX_MONTHS = 180 * 24 * 60 * 60 * 1000;

            function getCookie(name){
              var m = document.cookie.match(new RegExp('(^| )'+name+'=([^;]+)'));
              return m ? m[2] : null;
            }
            function setCookie(name, val, ms){
              var d = new Date(Date.now()+ms);
              document.cookie = name+'='+val+';expires='+d.toUTCString()+';path=/;SameSite=Lax';
            }

            if(getCookie(COOKIE_NAME) === 'ok') return; // jau autorizēts

            // Slēpjam saturu
            document.body.style.visibility = 'hidden';

            window.addEventListener('DOMContentLoaded', function(){
              document.body.style.visibility = 'hidden';
              var overlay = document.createElement('div');
              overlay.id = 'pin-overlay';
              overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:#0a0a0a;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:-apple-system,sans-serif';
              overlay.innerHTML = '<div style="text-align:center">'
                +'<div style="font-size:48px;margin-bottom:8px">🔒</div>'
                +'<div style="font-size:20px;color:#f5f5f7;font-weight:700;margin-bottom:4px">Command Center</div>'
                +'<div style="font-size:13px;color:rgba(255,255,255,0.4);margin-bottom:24px">Ievadi PIN kodu</div>'
                +'<input id="pin-input" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off" style="font-size:36px;text-align:center;width:160px;padding:12px;background:#1c1c1e;border:2px solid rgba(255,255,255,0.15);border-radius:12px;color:#f5f5f7;outline:none;letter-spacing:12px" />'
                +'<div id="pin-error" style="font-size:13px;color:#ff375f;margin-top:12px;height:20px"></div>'
                +'</div>';
              document.body.appendChild(overlay);

              var inp = document.getElementById('pin-input');
              inp.focus();
              inp.addEventListener('input', function(){
                if(inp.value.length === 4){
                  if(inp.value === PIN){
                    setCookie(COOKIE_NAME, 'ok', SIX_MONTHS);
                    overlay.style.opacity = '0';
                    overlay.style.transition = 'opacity 0.3s';
                    setTimeout(function(){
                      overlay.remove();
                      document.body.style.visibility = 'visible';
                    }, 300);
                  } else {
                    document.getElementById('pin-error').textContent = 'Nepareizs PIN kods';
                    inp.value = '';
                    inp.style.borderColor = '#ff375f';
                    setTimeout(function(){ inp.style.borderColor = 'rgba(255,255,255,0.15)'; }, 1000);
                  }
                }
              });
            });
          })();
        `}} />
      </head>
      <body style={{ margin: 0, padding: 0, overflow: 'hidden', background: '#0a0a0a' }}>
        {children}
      </body>
    </html>
  );
}

