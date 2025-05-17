"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Globe, HardDrive } from "lucide-react"
import { useState } from "react"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"

export default function Home() {
  const [sourceRatio, setSourceRatio] = useState<number[]>([30]) // Default 30% Pexels, 70% Local

  return (
    <main className="min-h-screen flex flex-col">
      {/* ヘッダー */}
      <header className="w-full py-6 px-4 sm:px-6 backdrop-blur-sm bg-white/70 border-b">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500">
            Fashion Swiper
          </h1>
          <span className="text-sm text-muted-foreground">Pexels Edition</span>
        </div>
      </header>

      {/* メインコンテンツ */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-md w-full space-y-8 fade-in">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight">あなたの好みのスタイルを見つけましょう</h2>
            <p className="mt-4 text-lg text-muted-foreground">まずは、見たいファッションの性別を選んでください</p>
          </div>

          {/* 画像ソース設定 */}
          <div className="mb-8 glass-card p-6 w-full max-w-md mx-auto mt-8">
            <h3 className="font-semibold mb-4 flex items-center justify-center">
              <Globe className="h-5 w-5 mr-2" />
              画像ソースの設定
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center">
                    <Globe className="h-4 w-4 mr-1" />
                    Pexels API
                  </span>
                  <span className="font-medium">{sourceRatio[0]}%</span>
                </div>
                <Slider
                  value={sourceRatio}
                  onValueChange={setSourceRatio}
                  max={100}
                  step={10}
                  className="w-full"
                />
                <div className="flex justify-between text-sm">
                  <span className="flex items-center">
                    <HardDrive className="h-4 w-4 mr-1" />
                    ローカル画像
                  </span>
                  <span className="font-medium">{100 - sourceRatio[0]}%</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {sourceRatio[0] === 0 
                  ? "ローカル画像のみ使用" 
                  : sourceRatio[0] === 100 
                  ? "Pexels APIのみ使用" 
                  : `Pexels ${sourceRatio[0]}% / ローカル ${100 - sourceRatio[0]}%`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mt-10">
            <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-0">
                <Link href={`/swipe?gender=male&ratio=${sourceRatio[0]}`} className="block">
                  <div className="relative aspect-[3/4] w-full">
                    <Image
                      src="/placeholder.svg?height=400&width=300"
                      alt="男性ファッション"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col items-center justify-end p-6">
                      <span className="text-white text-xl font-medium mb-3">メンズ</span>
                      <Button className="rounded-full px-6 modern-button">
                        選択 <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-0">
                <Link href={`/swipe?gender=female&ratio=${sourceRatio[0]}`} className="block">
                  <div className="relative aspect-[3/4] w-full">
                    <Image
                      src="/placeholder.svg?height=400&width=300"
                      alt="女性ファッション"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col items-center justify-end p-6">
                      <span className="text-white text-xl font-medium mb-3">レディース</span>
                      <Button className="rounded-full px-6 modern-button">
                        選択 <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* フッター */}
      <footer className="w-full py-4 px-4 sm:px-6 border-t text-center text-sm text-muted-foreground">
        <p>© 2025 Fashion Swiper. Powered by Pexels API.</p>
      </footer>
    </main>
  )
}
