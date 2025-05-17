import { NextResponse } from "next/server"
import OpenAI from "openai"

export const runtime = "nodejs"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { messages, userPrompt, gender } = body

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        message: "わー、今AIが使えないみたい！でも大丈夫、あなたの好みをヒントに素敵なコーデ探してみるね！" 
      })
    }

    const systemPrompt = `あなたはファッショナブルで友達のような口調で話すスタイリストAIです。
ユーザーの${gender === "male" ? "メンズ" : "レディース"}ファッションの相談に乗ります。
- 絵文字を適度に使って親しみやすく
- 短めで読みやすい返答
- 具体的なアドバイスを含める
- カジュアルな口調（〜だよ、〜かな、など）
- 相手の気持ちに共感的に`

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map(msg => ({
          role: msg.role as "user" | "assistant",
          content: msg.content
        }))
      ],
      temperature: 0.8,
      max_tokens: 150,
    })

    return NextResponse.json({ 
      message: completion.choices[0].message.content || "えっと...なんて言えばいいかな 😊" 
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ 
      message: "あれ？ちょっと調子悪いかも... でも任せて！あなたの好みから素敵なコーデ探すよ！✨" 
    })
  }
}