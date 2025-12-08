// フッターコンポーネント
export const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6 text-center">
        <p className="text-sm text-gray-500">
          © {currentYear} Noa 予約管理システム
        </p>
      </div>
    </footer>
  )
}
