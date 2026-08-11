import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { RetirementProvider } from '@/lib/retirement-context'
import { StepNav } from '@/components/step-nav'
import './globals.css'

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

export const metadata: Metadata = {
  title: '退休資產配置試算 | 算出你的退休缺口',
  description:
    '輸入預計退休年數與期望月所得，考慮通膨後算出需要累積的退休本金，再依現有資產配置估算退休當年的財富，並計算每月還需定期定額多少才能補足缺口。',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#0f5a52',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-Hant" className={`${geistSans.variable} ${geistMono.variable} bg-background`}>
      <body className="font-sans antialiased">
        <RetirementProvider>
          <StepNav />
          {children}
        </RetirementProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
