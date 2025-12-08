'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// ヘッダーコンポーネント
export const Header = () => {
  const pathname = usePathname()

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-3 py-3 sm:px-4 sm:py-4">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-xl sm:text-2xl font-bold text-gray-800"
          >
            Noa 予約
          </Link>
          <nav className="flex gap-2 sm:gap-6">
            <Link
              href="/"
              className={
                pathname === '/'
                  ? 'text-blue-600 font-bold border-b-2 border-blue-600 pb-2 text-sm sm:text-base tab-link'
                  : 'text-gray-600 hover:text-gray-900 font-medium text-sm sm:text-base tab-link'
              }
            >
              <span className="sm:hidden">予約</span>
              <span className="hidden sm:inline">予約登録</span>
            </Link>
            <Link
              href="/reservations"
              className={
                pathname === '/reservations'
                  ? 'text-blue-600 font-bold border-b-2 border-blue-600 pb-2 text-sm sm:text-base tab-link'
                  : 'text-gray-600 hover:text-gray-900 font-medium text-sm sm:text-base tab-link'
              }
            >
              <span className="sm:hidden">一覧</span>
              <span className="hidden sm:inline">予約一覧</span>
            </Link>
            <Link
              href="/staff"
              className={
                pathname === '/staff'
                  ? 'text-blue-600 font-bold border-b-2 border-blue-600 pb-2 text-sm sm:text-base tab-link'
                  : 'text-gray-600 hover:text-gray-900 font-medium text-sm sm:text-base tab-link'
              }
            >
              <span className="sm:hidden">管理</span>
              <span className="hidden sm:inline">スタッフ管理</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
