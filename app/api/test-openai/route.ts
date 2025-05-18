import { NextResponse } from "next/server"
import OpenAI from "openai"

export const runtime = "nodejs"

export async function GET() {
  try {
    // 環境変数のチェック
    const hasApiKey = !!process.env.OPENAI_API_KEY
    const hasOrgId = !!process.env.OPENAI_ORG_ID
    
    if (!hasApiKey) {
      return NextResponse.json({
        success: false,
        error: "OPENAI_API_KEY is not set",
        env: {
          hasApiKey,
          hasOrgId,
          apiKeyLength: process.env.OPENAI_API_KEY?.length,
          orgIdLength: process.env.OPENAI_ORG_ID?.length
        }
      })
    }

    // OpenAI APIの接続テスト
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      organization: process.env.OPENAI_ORG_ID,
    })

    // シンプルなテストメッセージ
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a test assistant. Respond with 'API is working!' in Japanese." },
        { role: "user", content: "Hello" }
      ],
      max_tokens: 10,
    })

    return NextResponse.json({
      success: true,
      message: completion.choices[0].message.content,
      env: {
        hasApiKey,
        hasOrgId,
        apiKeyLength: process.env.OPENAI_API_KEY?.length,
        orgIdLength: process.env.OPENAI_ORG_ID?.length
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || "Unknown error",
      errorType: error.status || "no status",
      errorDetails: {
        status: error.status,
        statusText: error.statusText,
        error: error.error,
        type: error.type,
        code: error.code,
      },
      env: {
        hasApiKey: !!process.env.OPENAI_API_KEY,
        hasOrgId: !!process.env.OPENAI_ORG_ID,
        apiKeyLength: process.env.OPENAI_API_KEY?.length,
        orgIdLength: process.env.OPENAI_ORG_ID?.length
      }
    })
  }
}