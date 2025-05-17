"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Globe, HardDrive, MessageCircle, Sparkles } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { motion, AnimatePresence } from "framer-motion"

export default function Home() {
  const router = useRouter()
  const [sourceRatio, setSourceRatio] = useState<number[]>([30]) // Default 30% Pexels, 70% Local
  const [showChat, setShowChat] = useState(false)
  const [chatMessages, setChatMessages] = useState<Array<{role: string, content: string}>>([])
  const [customPrompt, setCustomPrompt] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [selectedGender, setSelectedGender] = useState("female")
  const [showStartButton, setShowStartButton] = useState(false)

  const handleChatSubmit = async () => {
    if (!customPrompt.trim()) return
    
    const currentPrompt = customPrompt
    const newMessages = [...chatMessages, { role: "user", content: currentPrompt }]
    setChatMessages(newMessages)
    setCustomPrompt("")
    setIsTyping(true)
    
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: newMessages,
          userPrompt: currentPrompt,
          gender: selectedGender,
        }),
      })
      
      const data = await response.json()
      setChatMessages([...newMessages, { 
        role: "assistant", 
        content: data.message 
      }])
      
      // Show start button after first interaction
      setShowStartButton(true)
    } catch (error) {
      setChatMessages([...newMessages, { 
        role: "assistant", 
        content: "あっ、ちょっと調子が悪いみたい...😅 でも大丈夫！下のボタンから始められるよ！" 
      }])
      setShowStartButton(true)
    } finally {
      setIsTyping(false)
    }
  }

  const handleStartFromChat = () => {
    router.push(`/swipe?gender=${selectedGender}&ratio=${sourceRatio[0]}`)
  }

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
            
            {/* AIチャットボタン */}
            <div className="mt-6">
              <Button
                onClick={() => setShowChat(!showChat)}
                variant="outline"
                className="rounded-full px-6 modern-button"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                AIに相談
              </Button>
            </div>
          </div>

          {/* AIチャット */}
          <AnimatePresence>
            {showChat && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="w-full glass-card p-6 mb-6"
              >
                <h3 className="font-semibold mb-4 flex items-center">
                  <Sparkles className="h-5 w-5 mr-2" />
                  スタイリストAI
                </h3>
                
                {/* Initial greeting message */}
                {chatMessages.length === 0 && (
                  <div className="mb-4 text-center text-muted-foreground">
                    <p className="text-sm">こんにちは！ファッションのお悩みはありますか？</p>
                    <p className="text-sm">お気軽に相談してください！ 👗</p>
                  </div>
                )}
                
                {/* Chat Messages */}
                {chatMessages.length > 0 && (
                  <div className="mb-4 max-h-60 overflow-y-auto space-y-3">
                    {chatMessages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] px-4 py-2 rounded-lg ${
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-muted px-4 py-2 rounded-lg">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-primary rounded-full animate-bounce"></span>
                            <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: "0.1s"}}></span>
                            <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: "0.2s"}}></span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Gender Selection in Chat */}
                <div className="mb-3 flex gap-2 justify-center">
                  <Button
                    size="sm"
                    variant={selectedGender === "male" ? "default" : "outline"}
                    onClick={() => setSelectedGender("male")}
                    className="rounded-full"
                  >
                    メンズ
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedGender === "female" ? "default" : "outline"}
                    onClick={() => setSelectedGender("female")}
                    className="rounded-full"
                  >
                    レディース
                  </Button>
                </div>
                
                {/* Input Area */}
                <div className="flex gap-2">
                  <Textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="どんなスタイルをお探しですか？気軽に聞いてください！"
                    className="stylish-input flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleChatSubmit()
                      }
                    }}
                  />
                  <Button 
                    onClick={handleChatSubmit} 
                    disabled={!customPrompt.trim() || isTyping}
                    className="rounded-full px-6 modern-button"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    送信
                  </Button>
                </div>
                
                {/* Start Button after consultation */}
                {showStartButton && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 flex justify-center"
                  >
                    <Button
                      onClick={handleStartFromChat}
                      size="lg"
                      className="rounded-full px-8 modern-button"
                    >
                      <ArrowRight className="mr-2 h-5 w-5" />
                      {selectedGender === "male" ? "メンズ" : "レディース"}ファッションを見る
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

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
