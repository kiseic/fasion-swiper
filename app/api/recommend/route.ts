import { NextResponse } from "next/server"
import OpenAI from "openai"
import { readdirSync } from "fs"
import path from "path"

// Use nodejs runtime for fs operations
export const runtime = "nodejs"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json().catch((error) => {
      console.error("Error parsing request body:", error)
      return null
    })

    if (!body || !body.likedPhotos) {
      console.error("Invalid request body:", body)
      return NextResponse.json({ error: "Invalid request: likedPhotos is required" }, { status: 400 })
    }

    const { likedPhotos } = body
    // Get gender from request body or default to female
    const gender = body.gender || "female"
    // Get custom prompt if provided
    const customPrompt = body.customPrompt || ""
    // Check if we should use local images
    const useLocal = body.useLocal || false

    if (!Array.isArray(likedPhotos) || likedPhotos.length === 0) {
      console.error("Invalid likedPhotos:", likedPhotos)
      return NextResponse.json({ error: "Invalid or empty likedPhotos array" }, { status: 400 })
    }

    console.log(`Processing ${likedPhotos.length} liked photos for gender: ${gender}`)

    // Get fashion style keywords from OpenAI
    console.log("Generating style keywords with OpenAI...")
    const styleKeywords = await getStyleKeywords(likedPhotos, customPrompt)
    console.log("Generated keywords:", styleKeywords)

    // Use the keywords to fetch similar photos
    console.log("Fetching similar photos...")
    let recommendations
    if (useLocal) {
      recommendations = await getLocalPhotos(styleKeywords, gender)
    } else {
      recommendations = await fetchSimilarPhotos(styleKeywords, gender)
    }
    console.log(`Fetched ${recommendations.length} recommendations`)

    return NextResponse.json(recommendations)
  } catch (error) {
    console.error("Error generating recommendations:", error)
    return NextResponse.json({ error: `Failed to generate recommendations: ${error.message}` }, { status: 500 })
  }
}

async function getStyleKeywords(photoDescriptions: any[], customPrompt: string) {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    console.error("OpenAI API key is missing")
    throw new Error("OpenAI API key is not configured")
  }

  try {
    let prompt = `
      I have liked these fashion outfit photos:
      ${JSON.stringify(photoDescriptions)}
      
      Based on these photos, identify the common fashion style elements and generate 5 specific search keywords or phrases that would help find similar outfits.
    `

    if (customPrompt) {
      prompt += `\n\nAdditionally, consider this specific request from the user: "${customPrompt}"`
    }

    prompt += `\nReturn ONLY the keywords as a JSON array of strings, nothing else.`

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a fashion expert who can identify style patterns and generate relevant search keywords.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    })

    const content = response.choices[0].message.content
    if (!content) {
      console.error("Empty response from OpenAI")
      throw new Error("Failed to generate keywords from OpenAI")
    }

    try {
      const parsedContent = JSON.parse(content)
      const keywords = parsedContent.keywords || []

      if (!Array.isArray(keywords) || keywords.length === 0) {
        console.error("Invalid keywords format from OpenAI:", parsedContent)
        // Fallback to basic keywords
        return ["fashion outfit", "style", "clothing", "trendy", "full body"]
      }

      return keywords
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError, content)
      // Fallback to basic keywords if parsing fails
      return ["fashion outfit", "style", "clothing", "trendy", "full body"]
    }
  } catch (error) {
    console.error("Error calling OpenAI API:", error)
    // Fallback to basic keywords
    return ["fashion outfit", "style", "clothing", "trendy", "full body"]
  }
}

// ローカルイメージディレクトリから写真を取得する関数
async function getLocalPhotos(keywords: string[], gender: string) {
  try {
    // ローカルイメージディレクトリのパス
    const imagesDir = path.join(process.cwd(), "images")

    // ディレクトリ内のファイルを読み取る
    const files = readdirSync(imagesDir)

    // 画像ファイルのみをフィルタリング
    const imageFiles = files.filter((file) => /\.(jpg|jpeg|png|webp)$/i.test(file))

    // キーワードと性別に基づいてフィルタリング
    const filteredImages = imageFiles.filter((file) => {
      const lowerFile = file.toLowerCase()
      // 性別でフィルタリング
      if (gender === "male" && lowerFile.includes("female")) return false
      if (gender === "female" && lowerFile.includes("male")) return false

      // キーワードでフィルタリング（少なくとも1つのキーワードに一致）
      return keywords.some((keyword) => lowerFile.includes(keyword.toLowerCase()))
    })

    // 結果が少ない場合は、より広いフィルタリングを適用
    let resultImages = filteredImages
    if (resultImages.length < 5) {
      resultImages = imageFiles.filter((file) => {
        const lowerFile = file.toLowerCase()
        // 性別のみでフィルタリング
        if (gender === "male" && lowerFile.includes("female")) return false
        if (gender === "female" && lowerFile.includes("male")) return false
        return true
      })
    }

    // 最大10枚の画像を返す
    const limitedResults = resultImages.slice(0, 10)

    // Photo形式に変換
    return limitedResults.map((file, index) => {
      const filePath = path.join(imagesDir, file)
      return {
        id: index + 1000,
        width: 800,
        height: 1200,
        url: `/images/${file}`,
        photographer: "Local Collection",
        photographer_url: "",
        photographer_id: 0,
        avg_color: "#CCCCCC",
        src: {
          original: `/images/${file}`,
          large2x: `/images/${file}`,
          large: `/images/${file}`,
          medium: `/images/${file}`,
          small: `/images/${file}`,
          portrait: `/images/${file}`,
          landscape: `/images/${file}`,
          tiny: `/images/${file}`,
        },
        liked: false,
        alt: file.replace(/\.(jpg|jpeg|png|webp)$/i, "").replace(/-/g, " "),
      }
    })
  } catch (error) {
    console.error("Error getting local photos:", error)
    return [] // エラー時は空の配列を返す
  }
}

async function fetchSimilarPhotos(keywords: string[], gender: string) {
  const apiKey = process.env.PEXELS_API_KEY

  if (!apiKey) {
    console.error("Pexels API key is missing")
    throw new Error("Pexels API key is not configured")
  }

  try {
    // Join keywords with plus signs for the query and add Japanese and gender filters
    const baseKeywords = keywords.slice(0, 3).join("+") // Limit to 3 keywords to avoid overly specific queries
    const query = `japanese+asian+${gender}+${baseKeywords}`

    console.log("Pexels search query:", query)

    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&orientation=portrait&per_page=10`,
      {
        headers: {
          Authorization: apiKey,
        },
      },
    )

    if (!response.ok) {
      const errorText = await response.text().catch(() => "")
      console.error(`Pexels API error: ${response.status} ${response.statusText}`, errorText)
      throw new Error(`Pexels API error: ${response.status}`)
    }

    const data = await response.json()

    if (!data || !data.photos || !Array.isArray(data.photos)) {
      console.error("Invalid response from Pexels API:", data)
      throw new Error("Invalid response from Pexels API")
    }

    if (data.photos.length === 0) {
      console.warn("No photos found for the given keywords")
      // Try with a more generic query as fallback
      return await fetchFallbackPhotos(gender)
    }

    return data.photos
  } catch (error) {
    console.error("Error fetching similar photos:", error)
    // Try fallback photos if the main query fails
    return await fetchFallbackPhotos(gender)
  }
}

async function fetchFallbackPhotos(gender: string) {
  const apiKey = process.env.PEXELS_API_KEY

  if (!apiKey) {
    throw new Error("Pexels API key is not configured")
  }

  console.log("Fetching fallback photos...")

  try {
    const query = `japanese+asian+${gender}+fashion+outfit`

    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&orientation=portrait&per_page=10`,
      {
        headers: {
          Authorization: apiKey,
        },
      },
    )

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status}`)
    }

    const data = await response.json()

    if (!data || !data.photos || !Array.isArray(data.photos)) {
      throw new Error("Invalid response from Pexels API")
    }

    return data.photos
  } catch (error) {
    console.error("Error fetching fallback photos:", error)
    return [] // Return empty array as last resort
  }
}
