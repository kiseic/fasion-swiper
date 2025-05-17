import { NextResponse } from "next/server"
import { readdirSync } from "fs"
import path from "path"

export const runtime = "edge"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const gender = url.searchParams.get("gender") || "female"
    const useLocal = url.searchParams.get("useLocal") === "true"

    if (useLocal) {
      // ローカルイメージディレクトリから写真を取得
      return NextResponse.json(await getLocalPhotos(gender))
    } else {
      // Pexels APIから写真を取得
      return await getPexelsPhotos(gender)
    }
  } catch (error) {
    console.error("Error fetching photos:", error)
    return NextResponse.json({ error: `Failed to fetch photos: ${error.message}` }, { status: 500 })
  }
}

// ローカルイメージディレクトリから写真を取得する関数
async function getLocalPhotos(gender: string) {
  try {
    // ローカルイメージディレクトリのパス
    const imagesDir = path.join(process.cwd(), "images")

    // ディレクトリ内のファイルを読み取る
    const files = readdirSync(imagesDir)

    // 画像ファイルのみをフィルタリング
    const imageFiles = files.filter((file) => /\.(jpg|jpeg|png|webp)$/i.test(file))

    // 性別に基づいてフィルタリング
    const filteredImages = imageFiles.filter((file) => {
      const lowerFile = file.toLowerCase()
      if (gender === "male" && lowerFile.includes("female")) return false
      if (gender === "female" && lowerFile.includes("male")) return false
      return true
    })

    // 最大30枚の画像をランダムに選択
    const shuffledImages = shuffleArray(filteredImages)
    const limitedResults = shuffledImages.slice(0, 30)

    // Photo形式に変換
    return limitedResults.map((file, index) => {
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
    throw error
  }
}

async function getPexelsPhotos(gender: string) {
  const apiKey = process.env.PEXELS_API_KEY

  if (!apiKey) {
    console.error("Pexels API key is missing")
    return NextResponse.json({ error: "Pexels API key is not configured" }, { status: 500 })
  }

  // Build query with Japanese models and gender filter
  const query = `japanese+asian+${gender}+fashion+outfit+full+body`

  console.log(`Fetching photos from Pexels API with query: ${query}`)
  const response = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&orientation=portrait&per_page=30`,
    {
      headers: {
        Authorization: apiKey,
      },
    },
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`Pexels API error: ${response.status} ${response.statusText}`, errorText)
    return NextResponse.json({ error: `Pexels API error: ${response.status}` }, { status: response.status })
  }

  const data = await response.json()

  if (!data || !data.photos || !Array.isArray(data.photos) || data.photos.length === 0) {
    console.error("Invalid or empty response from Pexels API:", data)
    return NextResponse.json({ error: "No photos received from Pexels API" }, { status: 500 })
  }

  console.log(`Received ${data.photos.length} photos from Pexels API`)

  // Shuffle the photos to get random order
  const shuffledPhotos = shuffleArray(data.photos)

  return NextResponse.json(shuffledPhotos)
}

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}
