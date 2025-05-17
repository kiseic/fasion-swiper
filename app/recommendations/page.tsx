"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ExternalLink, RefreshCw, Search, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Photo } from "@/types/pexels"
import LoadingSpinner from "@/components/loading-spinner"
import Image from "next/image"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"

export default function RecommendationsPage() {
  const [likedPhotos, setLikedPhotos] = useState<Photo[]>([])
  const [recommendations, setRecommendations] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [gender, setGender] = useState<string>("female")
  const [customPrompt, setCustomPrompt] = useState<string>("")
  const [showPromptInput, setShowPromptInput] = useState<boolean>(false)
  const router = useRouter()

  const fetchRecommendations = async (photos: Photo[], prompt?: string) => {
    try {
      setLoading(true)
      setError(null)

      console.log("Sending request to /api/recommend...")
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          likedPhotos: photos,
          gender: gender,
          customPrompt: prompt || "",
          useLocal: true, // ローカルイメージディレクトリを使用
        }),
      })

      if (!response.ok) {
        let errorMessage = `API error: ${response.status}`
        try {
          const errorData = await response.json()
          if (errorData && errorData.error) {
            errorMessage = errorData.error
          }
        } catch (e) {
          // Ignore JSON parsing errors
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()

      if (!data || !Array.isArray(data) || data.length === 0) {
        console.error("Invalid or empty recommendations response:", data)
        throw new Error("レコメンドが見つかりませんでした")
      }

      console.log(`Received ${data.length} recommendations`)
      setRecommendations(data)
      return true
    } catch (err) {
      console.error("Error fetching recommendations:", err)
      setError(`レコメンドの取得に失敗しました: ${err.message}`)
      return false
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const loadLikedPhotos = () => {
      try {
        // Get liked photos from localStorage
        const storedLikedPhotos = localStorage.getItem("likedPhotos")
        if (!storedLikedPhotos) {
          console.error("No liked photos found in localStorage")
          setError("お気に入りの写真が見つかりませんでした。トップページに戻ります。")
          setTimeout(() => router.push("/"), 2000)
          return null
        }

        // Get gender preference from localStorage
        const storedGender = localStorage.getItem("preferredGender")
        if (storedGender) {
          setGender(storedGender)
        }

        let parsedLikedPhotos
        try {
          parsedLikedPhotos = JSON.parse(storedLikedPhotos)
          if (!Array.isArray(parsedLikedPhotos) || parsedLikedPhotos.length === 0) {
            throw new Error("Invalid liked photos format")
          }
          console.log(`Found ${parsedLikedPhotos.length} liked photos in localStorage`)
        } catch (parseError) {
          console.error("Error parsing liked photos:", parseError)
          setError("お気に入りの写真の形式が無効です。トップページに戻ります。")
          setTimeout(() => router.push("/"), 2000)
          return null
        }

        setLikedPhotos(parsedLikedPhotos)
        return parsedLikedPhotos
      } catch (err) {
        console.error("Error loading liked photos:", err)
        setError(`お気に入りの写真の読み込みに失敗しました: ${err.message}`)
        return null
      }
    }

    const initPage = async () => {
      const photos = loadLikedPhotos()
      if (photos) {
        await fetchRecommendations(photos)
      }
    }

    initPage()
  }, [router])

  const handleRetry = async () => {
    if (likedPhotos.length > 0) {
      await fetchRecommendations(likedPhotos)
    }
  }

  const handleCustomPrompt = async () => {
    if (likedPhotos.length > 0 && customPrompt.trim()) {
      await fetchRecommendations(likedPhotos, customPrompt)
      setShowPromptInput(false)
    }
  }

  const handleStartOver = () => {
    localStorage.removeItem("likedPhotos")
    router.push("/")
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="relative">
          <LoadingSpinner />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-primary font-medium">AI</span>
          </div>
        </div>
        <p className="mt-6 text-lg font-medium">あなたにぴったりのコーデを探しています...</p>
        <p className="text-sm text-muted-foreground mt-2">AIがあなたの好みを分析中</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4 glass-card mx-4">
        <h2 className="text-xl font-bold mb-2">エラーが発生しました</h2>
        <p className="text-center mb-4 text-muted-foreground">{error}</p>
        <div className="flex gap-2">
          <Button onClick={handleRetry} className="rounded-full px-6 modern-button flex items-center gap-2">
            <RefreshCw size={16} />
            再試行
          </Button>
          <Button onClick={() => router.push("/")} variant="outline" className="rounded-full px-6">
            トップに戻る
          </Button>
        </div>
      </div>
    )
  }

  // Fallback to empty recommendations with a message if no recommendations are found
  if (recommendations.length === 0) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="w-full py-4 px-4 sm:px-6 backdrop-blur-sm bg-white/70 border-b">
          <div className="max-w-7xl mx-auto flex items-center">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500">
              レコメンド結果
            </h1>
          </div>
        </header>

        <div className="flex flex-col items-center justify-center flex-1 p-4 glass-card m-4">
          <p className="text-center mb-4 text-muted-foreground">
            おすすめのコーデが見つかりませんでした。別のコーデを選んでみましょう。
          </p>
          <Button onClick={handleStartOver} className="rounded-full px-6 modern-button">
            もう一度探す
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="w-full py-4 px-4 sm:px-6 backdrop-blur-sm bg-white/70 border-b">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500">
              あなたにおすすめのコーデ
            </h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1"
            onClick={() => setShowPromptInput(!showPromptInput)}
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">カスタム検索</span>
          </Button>
        </div>
      </header>

      {showPromptInput && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="w-full py-4 px-4 sm:px-6 border-b bg-muted/30"
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-2">
            <Textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="例: カジュアルでシンプルな春のコーデ、ストリートスタイル、など"
              className="stylish-input flex-1"
            />
            <Button onClick={handleCustomPrompt} className="rounded-full px-6 modern-button">
              <Sparkles className="mr-2 h-4 w-4" />
              検索
            </Button>
          </div>
        </motion.div>
      )}

      <div className="flex-1 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <section className="mb-8 fade-in">
            <h2 className="text-lg font-semibold mb-3 flex items-center">
              <Badge variant="outline" className="mr-2 rounded-full">
                5
              </Badge>
              あなたが選んだコーデ
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-4">
              {likedPhotos.slice(0, 5).map((photo, index) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="aspect-[2/3] rounded-lg overflow-hidden relative shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <Image
                    src={photo.src.medium || "/placeholder.svg?height=300&width=200"}
                    alt={`Photo by ${photo.photographer}`}
                    fill
                    className="object-cover"
                  />
                </motion.div>
              ))}
            </div>
          </section>

          <section className="flex-1 fade-in">
            <h2 className="text-lg font-semibold mb-3 flex items-center">
              <Badge variant="outline" className="mr-2 rounded-full">
                {recommendations.length}
              </Badge>
              おすすめのコーデ
              {customPrompt && (
                <Badge variant="secondary" className="ml-2 rounded-full">
                  カスタム検索
                </Badge>
              )}
            </h2>
            <div className="recommendation-cards">
              {recommendations.map((photo, index) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="recommendation-card"
                >
                  <a href={photo.url} target="_blank" rel="noopener noreferrer" className="block h-full relative">
                    <Image
                      src={photo.src.medium || "/placeholder.svg?height=300&width=200"}
                      alt={`Photo by ${photo.photographer}`}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-white text-sm font-medium truncate">{photo.photographer}</span>
                        <ExternalLink className="h-4 w-4 text-white" />
                      </div>
                      {photo.alt && <p className="text-white/80 text-xs mt-1 line-clamp-2">{photo.alt}</p>}
                    </div>
                  </a>
                </motion.div>
              ))}
            </div>
          </section>

          <footer className="mt-8">
            <Button onClick={handleStartOver} className="w-full rounded-full modern-button">
              もう一度探す
            </Button>
          </footer>
        </div>
      </div>
    </div>
  )
}
