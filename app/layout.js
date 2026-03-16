export const metadata = {
  title: 'Command Center',
  description: 'Biznesa komandcentris',
};

export default function RootLayout({ children }) {
  return (
    <html lang="lv">
      <head>
        <meta httpEquiv="refresh" content="60" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ margin: 0, padding: 0, overflow: 'hidden', background: '#1c1c1e' }}>
        {children}
      </body>
    </html>
  );
}
