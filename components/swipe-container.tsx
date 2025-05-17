"use client"

import { useState, useEffect, useRef, createRef } from "react"
import TinderCard from "react-tinder-card"
import { Button } from "@/components/ui/button"
import { Heart, X, RefreshCw, Info } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import type { Photo } from "@/types/pexels"
import LoadingSpinner from "./loading-spinner"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"

export default function SwipeContainer() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [likedPhotos, setLikedPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deckEmpty, setDeckEmpty] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const currentIndexRef = useRef(0)
  const router = useRouter()
  const searchParams = useSearchParams()
  const gender = searchParams.get("gender") || "female"

  const childRefs = useRef<any[]>([])

  useEffect(() => {
    // Initialize refs array when photos change
    if (photos.length > 0) {
      childRefs.current = Array(photos.length)
        .fill(0)
        .map((_, i) => childRefs.current[i] || createRef())
    }
  }, [photos])

  useEffect(() => {
    // Store gender preference in localStorage for later use
    localStorage.setItem("preferredGender", gender)
    fetchPhotos()
  }, [gender])

  const fetchPhotos = async () => {
    try {
      setLoading(true)
      // ローカルイメージディレクトリから画像を取得
      const response = await fetch(`/api/photos?gender=${gender}&useLocal=true`)

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      // Check if data is valid and has photos
      if (!data || !Array.isArray(data) || data.length === 0) {
        console.error("Invalid or empty response from API:", data)
        throw new Error("No photos received from API")
      }

      console.log(`Received ${data.length} photos from API`)
      setPhotos(data)
      setCurrentIndex(data.length - 1)
      currentIndexRef.current = data.length - 1
    } catch (err) {
      console.error("Error fetching photos:", err)
      setError(`写真の読み込みに失敗しました: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const swiped = (direction: string, photo: Photo, index: number) => {
    if (direction === "right") {
      setLikedPhotos((prev) => {
        const newLikedPhotos = [...prev, photo]

        // If we have 5 liked photos, navigate to recommendations
        if (newLikedPhotos.length === 5) {
          localStorage.setItem("likedPhotos", JSON.stringify(newLikedPhotos))
          router.push("/recommendations")
        }

        return newLikedPhotos
      })
    }

    setCurrentIndex(index - 1)
    currentIndexRef.current = index - 1

    if (index === 0) {
      setDeckEmpty(true)
    }
  }

  const outOfFrame = (idx: number) => {
    // handle the case when all cards are swiped
    if (idx === 0) {
      setDeckEmpty(true)
    }
  }

  const swipe = (dir: string) => {
    if (currentIndex < 0) return
    childRefs.current[currentIndex]?.swipe(dir)
  }

  const handleReset = () => {
    setLikedPhotos([])
    setDeckEmpty(false)
    fetchPhotos()
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="relative">
          <LoadingSpinner />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-primary font-medium">Loading</span>
          </div>
        </div>
        <p className="mt-6 text-lg font-medium">写真を読み込み中...</p>
        <p className="text-sm text-muted-foreground mt-2">あなたにぴったりのコーデを探しています</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4 glass-card mx-4">
        <div className="text-destructive mb-6">
          <X size={48} className="mx-auto" />
        </div>
        <h2 className="text-2xl font-bold mb-3">エラーが発生しました</h2>
        <p className="text-center mb-6 text-muted-foreground">{error}</p>
        <Button onClick={fetchPhotos} className="rounded-full px-6 modern-button">
          再試行 <RefreshCw className="ml-2 h-4 w-4" />
        </Button>
      </div>
    )
  }

  if (deckEmpty) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center h-screen p-4 text-center glass-card mx-4"
      >
        <h2 className="text-2xl font-bold mb-4">
          {likedPhotos.length < 5 ? "写真がなくなりました" : "おめでとうございます！"}
        </h2>

        {likedPhotos.length < 5 ? (
          <>
            <p className="mb-6 text-muted-foreground">
              あと{5 - likedPhotos.length}枚のLIKEが必要です。もう一度試してみましょう！
            </p>
            <Button onClick={handleReset} className="rounded-full px-6 modern-button flex items-center gap-2">
              <RefreshCw size={16} />
              もう一度
            </Button>
          </>
        ) : (
          <>
            <p className="mb-6 text-muted-foreground">5枚のコーデを選びました！レコメンドを見てみましょう。</p>
            <Button onClick={() => router.push("/recommendations")} className="rounded-full px-6 modern-button">
              レコメンドを見る
            </Button>
          </>
        )}
      </motion.div>
    )
  }

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto pt-4 px-4 fade-in">
      <div className="w-full mb-6">
        <div className="flex justify-between items-center mb-2">
          <Badge variant="outline" className="px-3 py-1 rounded-full">
            LIKE: {likedPhotos.length}/5
          </Badge>
          <Badge variant="outline" className="px-3 py-1 rounded-full">
            残り: {currentIndex + 1}
          </Badge>
        </div>
        <Progress value={(likedPhotos.length / 5) * 100} className="h-2 rounded-full" />
      </div>

      <div className="swipe-container">
        <AnimatePresence>
          {photos.map((photo, index) => (
            <TinderCard
              ref={(el) => (childRefs.current[index] = el)}
              key={photo.id}
              onSwipe={(dir) => swiped(dir, photo, index)}
              onCardLeftScreen={() => outOfFrame(index)}
              preventSwipe={["up", "down"]}
              className="swipe-card"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="swipe-card"
                style={{
                  backgroundImage: `url(${photo.src.large})`,
                }}
              >
                <div className="card-content">
                  <h3 className="text-lg font-semibold truncate">Photo by {photo.photographer}</h3>
                  {photo.alt && <p className="text-sm text-white/80 mt-1 line-clamp-2">{photo.alt}</p>}
                </div>
              </motion.div>
            </TinderCard>
          ))}
        </AnimatePresence>
      </div>

      <div className="swipe-buttons mt-8">
        <Button
          onClick={() => swipe("left")}
          variant="outline"
          size="icon"
          className="swipe-button bg-white text-black hover:bg-gray-100"
          disabled={currentIndex < 0}
        >
          <X className="h-8 w-8 text-destructive" />
        </Button>

        <Button
          onClick={() => swipe("right")}
          variant="outline"
          size="icon"
          className="swipe-button bg-white text-black hover:bg-gray-100"
          disabled={currentIndex < 0}
        >
          <Heart className="h-8 w-8 text-primary" />
        </Button>
      </div>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        <p className="flex items-center justify-center gap-1">
          <Info className="h-4 w-4" />
          右スワイプでLIKE、左スワイプでSKIP
        </p>
      </div>
    </div>
  )
}
