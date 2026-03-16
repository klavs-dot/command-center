// app/layout.js
export const metadata = { title: 'Command Center' };

export default function RootLayout({ children }) {
  return (
    <html lang="lv">
      <head>
        <meta httpEquiv="refresh" content="300" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes liveBlink{0%,100%{opacity:1}50%{opacity:0.3}}
          @keyframes liveDot{0%,100%{box-shadow:0 0 0 0 rgba(48,209,88,0.6)}50%{box-shadow:0 0 10px 5px rgba(48,209,88,0)}}
          @keyframes pulseRed{0%,100%{background:#2c2c2e}50%{background:rgba(255,55,95,0.1)}}
          @keyframes pulseOrange{0%,100%{background:#2c2c2e}50%{background:rgba(255,159,10,0.1)}}
          @keyframes fadeInUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
          @keyframes slideInLeft{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
          @keyframes countPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}
          @keyframes travelGlow{0%,100%{opacity:0.85}50%{opacity:1}}
          @keyframes arrowBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
          .live-badge{animation:liveBlink 2s ease-in-out infinite}
          .live-dot{animation:liveDot 2s ease-in-out infinite}
          .pulse-red{animation:pulseRed 3s ease-in-out infinite;border-radius:25px;padding:5px 12px;margin:0 -12px}
          .pulse-orange{animation:pulseOrange 3.5s ease-in-out infinite;border-radius:25px;padding:5px 12px;margin:0 -12px}
          .email-card{animation:fadeInUp 0.5s ease-out both}
          .cal-item{animation:slideInLeft 0.4s ease-out both}
          .count-badge{animation:countPulse 2s ease-in-out infinite;display:inline-block}
          .travel-badge{animation:travelGlow 2.5s ease-in-out infinite}
          .arrow-bounce{animation:arrowBounce 1.5s ease-in-out infinite;display:inline-block}
        `}} />
        <script dangerouslySetInnerHTML={{ __html: `
          setInterval(function(){
            var el = document.getElementById('clock');
            if(el){
              var now = new Date().toLocaleString('lv-LV',{timeZone:'Europe/Riga',hour:'2-digit',minute:'2-digit',hour12:false});
              el.textContent = now;
            }
          }, 60000);
        `}} />
      </head>
      <body style={{ margin: 0, padding: 0, overflow: 'hidden', background: '#1c1c1e' }}>
        {children}
      </body>
    </html>
  );
}
