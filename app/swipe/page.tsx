import SwipeContainer from "@/components/swipe-container"

export default function SwipePage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* ヘッダー */}
      <header className="w-full py-4 px-4 sm:px-6 backdrop-blur-sm bg-white/70 border-b">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500">
            Fashion Swiper
          </h1>
          <span className="text-sm text-muted-foreground">スワイプして好みのスタイルを選択</span>
        </div>
      </header>

      {/* メインコンテンツ */}
      <div className="flex-1 flex items-center justify-center">
        <SwipeContainer />
      </div>

      {/* フッター */}
      <footer className="w-full py-3 px-4 sm:px-6 border-t text-center text-xs text-muted-foreground">
        <p>右スワイプでLIKE、左スワイプでSKIP。5枚のLIKEでレコメンドが表示されます。</p>
      </footer>
    </main>
  )
}
