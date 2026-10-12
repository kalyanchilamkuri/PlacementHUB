import type { Metadata, Viewport } from 'next';
import { Marcellus, Archivo, JetBrains_Mono } from 'next/font/google';
import { INSTITUTE, SITE_URL } from '@/lib/site';
import './globals.css';

const marcellus = Marcellus({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-marcellus',
  display: 'swap',
});

const archivo = Archivo({
  subsets: ['latin'],
  variable: '--font-archivo',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono-code',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `Training & Placement Cell | ${INSTITUTE.shortName}`,
    template: `%s | ${INSTITUTE.shortName} Placements`,
  },
  description:
    'The Training & Placement portal for the Indian Institute of Information Technology, Lucknow. Sign-in required.',
  // A closed portal holding student records has no business in a search index.
  robots: { index: false, follow: false },
  openGraph: {
    type: 'website',
    siteName: `${INSTITUTE.shortName} Training & Placement Cell`,
    locale: 'en_IN',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f3f7fa' },
    { media: '(prefers-color-scheme: dark)', color: '#04131e' },
  ],
};

/** Resolves the theme before first paint so the page never flashes the wrong one. */
const themeBoot = `(function(){try{var s=localStorage.getItem('iiitl-theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.dataset.theme=(s==='light'||s==='dark')?s:(d?'dark':'light')}catch(e){document.documentElement.dataset.theme='light'}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // data-scroll-behavior is what Next 16 wants when html carries
    // scroll-behavior; without it, route transitions animate the scroll too.
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${marcellus.variable} ${archivo.variable} ${mono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-blue focus:px-4 focus:py-2 focus:text-on-blue"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
