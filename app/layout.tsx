import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Verball — Referências verbais de branding',
  description:
    'As melhores referências em redação publicitária, branding verbal, manifestos, campanhas e email. Em português, inglês e espanhol.',
  openGraph: {
    title: 'Verball',
    description: 'Arquivo curado de referências verbais de branding.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="bg-bg text-ink font-sans min-h-screen">{children}</body>
    </html>
  )
}
