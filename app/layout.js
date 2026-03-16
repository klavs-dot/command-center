// app/layout.js
export const metadata = {
  title: 'Command Center',
  description: 'Klāva Ašmaņa biznesa komandcentris',
};

export default function RootLayout({ children }) {
  return (
    <html lang="lv">
      <head>
        {/* Auto-refresh ik 5 minūtes — TV vienmēr rādīs svaigu info */}
        <meta httpEquiv="refresh" content="300" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ margin: 0, padding: 0, overflow: 'hidden', background: '#06060f' }}>
        {children}
      </body>
    </html>
  );
}
