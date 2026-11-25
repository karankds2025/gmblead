import './globals.css';

export const metadata = {
  title: 'LeadRadar Pro — Local Business Intelligence & Web Outreach Engine',
  description: 'Discover local businesses on Google Maps, find unserved clients without websites, and launch automated WhatsApp & Email pitches.',
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
      </head>
      <body className="antialiased min-h-screen bg-[#FDFBF7] text-[#2C221E]">
        {children}
      </body>
    </html>
  );
}
