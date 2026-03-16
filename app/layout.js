// app/layout.js
export const metadata = { title: 'Command Center' };

export default function RootLayout({ children }) {
  // Ģenerējam bubble animācijas 7 e-pastiem (10s katrs = 70s cikls)
  const total = 7;
  const duration = 10; // sekundes katram
  const cycle = total * duration; // 70s

  let bubbleKeyframes = '';
  for (let i = 0; i < total; i++) {
    const startPct = ((i * duration) / cycle * 100).toFixed(2);
    const fadeInPct = ((i * duration + 0.5) / cycle * 100).toFixed(2);
    const fadeOutPct = (((i + 1) * duration - 0.5) / cycle * 100).toFixed(2);
    const endPct = (((i + 1) * duration) / cycle * 100).toFixed(2);
    bubbleKeyframes += `
      @keyframes showBubble${i} {
        0%, ${startPct}% { opacity: 0; transform: translateY(8px); }
        ${fadeInPct}% { opacity: 1; transform: translateY(0); }
        ${fadeOutPct}% { opacity: 1; transform: translateY(0); }
        ${endPct}%, 100% { opacity: 0; transform: translateY(-8px); }
      }
      .ai-bubble-${i} {
        animation: showBubble${i} ${cycle}s ease-in-out infinite;
      }
    `;
  }

  return (
    <html lang="lv">
      <head>
        <meta httpEquiv="refresh" content="60" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes liveBlink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
          @keyframes liveDot {
            0%, 100% { box-shadow: 0 0 0 0 rgba(48,209,88,0.6); }
            50% { box-shadow: 0 0 10px 5px rgba(48,209,88,0); }
          }
          @keyframes pulseRed {
            0%, 100% { background: #2c2c2e; }
            50% { background: rgba(255,55,95,0.1); }
          }
          @keyframes pulseOrange {
            0%, 100% { background: #2c2c2e; }
            50% { background: rgba(255,159,10,0.1); }
          }
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes slideInLeft {
            from { opacity: 0; transform: translateX(-8px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes countPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.12); }
          }
          @keyframes travelGlow {
            0%, 100% { opacity: 0.85; }
            50% { opacity: 1; }
          }
          @keyframes barGrow {
            from { transform: scaleY(0); }
            to { transform: scaleY(1); }
          }
          @keyframes liveNumber {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
          }
          @keyframes bubbleArrow {
            0%, 100% { transform: translateX(0); }
            50% { transform: translateX(3px); }
          }
          .live-badge { animation: liveBlink 2s ease-in-out infinite; }
          .live-dot { animation: liveDot 2s ease-in-out infinite; }
          .pulse-red { animation: pulseRed 3s ease-in-out infinite; border-radius: 25px; padding: 5px 12px; margin: 0 -12px; }
          .pulse-orange { animation: pulseOrange 3.5s ease-in-out infinite; border-radius: 25px; padding: 5px 12px; margin: 0 -12px; }
          .email-card { animation: fadeInUp 0.5s ease-out both; }
          .cal-item { animation: slideInLeft 0.4s ease-out both; }
          .count-badge { animation: countPulse 2s ease-in-out infinite; display: inline-block; }
          .travel-badge { animation: travelGlow 2.5s ease-in-out infinite; }
          .bar-grow { animation: barGrow 1s ease-out both; transform-origin: bottom; }
          .live-number { animation: liveNumber 3s ease-in-out infinite; }
          .bubble-arrow { animation: bubbleArrow 1.5s ease-in-out infinite; display: inline-block; }
          ${bubbleKeyframes}
        `}} />
      </head>
      <body style={{ margin: 0, padding: 0, overflow: 'hidden', background: '#1c1c1e' }}>
        {children}
      </body>
    </html>
  );
}
