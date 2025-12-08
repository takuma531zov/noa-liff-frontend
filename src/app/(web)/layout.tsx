import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'

// Web用レイアウト（スタッフ用UIを含む）
export default function WebLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
