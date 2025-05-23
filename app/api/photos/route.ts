import { NextResponse } from "next/server"
import { readdirSync, readFileSync } from "fs"
import path from "path"

// Use nodejs runtime for fs operations
export const runtime = "nodejs"

// Simple in-memory cache to track recently shown photos
let recentPhotoIds = new Set<number>()

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const gender = url.searchParams.get("gender") || "female"
    const useLocal = url.searchParams.get("useLocal") === "true"
    const ratio = parseInt(url.searchParams.get("ratio") || "0", 10) // Pexels percentage

    console.log(`GET /api/photos - gender: ${gender}, useLocal: ${useLocal}, ratio: ${ratio}`)

    // If ratio is 0 or useLocal is true, use only local images
    if (ratio === 0 || useLocal) {
      const localPhotos = await getLocalPhotos(gender)
      console.log(`Returning ${localPhotos.length} local photos`)
      return NextResponse.json(localPhotos)
    }
    
    // If ratio is 100, use only Pexels
    if (ratio === 100) {
      return await getPexelsPhotos(gender)
    }
    
    // Mix both sources based on ratio
    console.log(`Mixing photos with ratio ${ratio}% Pexels, ${100-ratio}% local`)
    const mixedPhotos = await getMixedPhotos(gender, ratio)
    console.log(`Returning ${mixedPhotos.length} mixed photos`)
    return NextResponse.json(mixedPhotos)
  } catch (error) {
    console.error("Error fetching photos:", error)
    return NextResponse.json({ error: `Failed to fetch photos: ${error.message}` }, { status: 500 })
  }
}

// Function to get photos from local image directory
async function getLocalPhotos(gender: string) {
  try {
    // Always use public/images directory for Vercel compatibility
    const imagesDir = path.join(process.cwd(), "public", "images")
    let files: string[] = []
    
    try {
      files = readdirSync(imagesDir)
      console.log(`Found ${files.length} files in ${imagesDir}`)
    } catch (error) {
      console.error("Could not find images directory:", error)
      return []
    }
    
    // Load metadata
    let metadata: any = {}
    try {
      const metadataPath = path.join(imagesDir, "metadata.json")
      const metadataContent = readFileSync(metadataPath, "utf-8")
      metadata = JSON.parse(metadataContent)
    } catch (error) {
      // Try loading from public/images if not found
      try {
        const publicMetadataPath = path.join(process.cwd(), "public", "images", "metadata.json")
        const metadataContent = readFileSync(publicMetadataPath, "utf-8")
        metadata = JSON.parse(metadataContent)
      } catch (error2) {
        console.warn("Could not load metadata from either location")
      }
    }

    // Filter for image files only
    const imageFiles = files.filter((file) => /\.(jpg|jpeg|png|webp)$/i.test(file))

    // Filter based on gender using metadata patterns
    const filteredImages = imageFiles.filter((file) => {
      // Check specific metadata first
      if (metadata.imageData?.[file]?.gender) {
        return metadata.imageData[file].gender === gender || metadata.imageData[file].gender === "unisex"
      }
      
      const lowerFile = file.toLowerCase()
      
      // Check exclude patterns first
      const excludePatterns = metadata.excludePatterns?.[gender] || []
      for (const pattern of excludePatterns) {
        if (lowerFile.includes(pattern)) return false
      }
      
      // Check include patterns
      const includePatterns = metadata.genderPatterns?.[gender] || []
      for (const pattern of includePatterns) {
        if (lowerFile.includes(pattern)) return true
      }
      
      // Default: include if no clear indicator (better to show more options)
      return true
    })

    // Select random 30 images maximum
    const shuffledImages = shuffleArray(filteredImages)
    const limitedResults = shuffledImages.slice(0, 30)

    // Convert to Photo format
    return limitedResults.map((file, index) => {
      // Always use public path for images
      const urlPath = `/images/${file}`
      
      return {
        id: index + 1000,
        width: 800,
        height: 1200,
        url: urlPath,
        photographer: "Local Collection",
        photographer_url: "",
        photographer_id: 0,
        avg_color: "#CCCCCC",
        src: {
          original: urlPath,
          large2x: urlPath,
          large: urlPath,
          medium: urlPath,
          small: urlPath,
          portrait: urlPath,
          landscape: urlPath,
          tiny: urlPath,
        },
        liked: false,
        alt: generateAltText(file, gender),
      }
    })
  } catch (error) {
    console.error("Error getting local photos:", error)
    throw error
  }
}

async function getPexelsPhotos(gender: string, returnRaw = false) {
  const apiKey = process.env.PEXELS_API_KEY

  if (!apiKey) {
    console.error("Pexels API key is missing")
    if (returnRaw) return null
    return NextResponse.json({ error: "Pexels API key is not configured" }, { status: 500 })
  }

  // Build diverse queries to get more variety
  const queries = [
    `${gender} fashion portrait full body`,
    `${gender} street style outfit`,
    `${gender} casual wear fashion`,
    `${gender} model fashion photography`,
    `japanese ${gender} fashion style`,
    `asian ${gender} fashion outfit`,
    `${gender} clothing fashion photo`,
    `${gender} fashion lookbook`,
    `${gender} style outfit portrait`
  ]
  
  // Randomly select a query for variety
  const randomQuery = queries[Math.floor(Math.random() * queries.length)]
  
  console.log(`Fetching photos from Pexels API with query: ${randomQuery}`)
  const response = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(randomQuery)}&orientation=portrait&per_page=80&page=${Math.floor(Math.random() * 5) + 1}`,
    {
      headers: {
        Authorization: apiKey,
      },
    },
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`Pexels API error: ${response.status} ${response.statusText}`, errorText)
    if (returnRaw) return null
    return NextResponse.json({ error: `Pexels API error: ${response.status}` }, { status: response.status })
  }

  const data = await response.json()

  if (!data || !data.photos || !Array.isArray(data.photos) || data.photos.length === 0) {
    console.error("Invalid or empty response from Pexels API:", data)
    if (returnRaw) return null
    return NextResponse.json({ error: "No photos received from Pexels API" }, { status: 500 })
  }

  console.log(`Received ${data.photos.length} photos from Pexels API`)

  // Filter out recently shown photos
  const filteredPhotos = data.photos.filter(photo => !recentPhotoIds.has(photo.id))
  
  // If we have too few new photos, reset the cache
  if (filteredPhotos.length < 10) {
    recentPhotoIds.clear()
    filteredPhotos.push(...data.photos)
  }
  
  // Shuffle the photos to get random order
  const shuffledPhotos = shuffleArray(filteredPhotos)
  
  // Track these photos as recently shown (keep only last 200)
  shuffledPhotos.slice(0, 30).forEach(photo => {
    recentPhotoIds.add(photo.id)
  })
  
  // Clean up old entries if cache gets too big
  if (recentPhotoIds.size > 200) {
    const idsArray = Array.from(recentPhotoIds)
    recentPhotoIds = new Set(idsArray.slice(-150))
  }

  if (returnRaw) return shuffledPhotos
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

// Mix photos from both sources based on ratio
async function getMixedPhotos(gender: string, pexelsRatio: number) {
  try {
    // Calculate how many photos from each source
    const totalPhotos = 30
    const pexelsCount = Math.round((totalPhotos * pexelsRatio) / 100)
    const localCount = totalPhotos - pexelsCount
    
    console.log(`getMixedPhotos - total: ${totalPhotos}, pexels: ${pexelsCount}, local: ${localCount}`)
    
    const photos: any[] = []
    
    // Get Pexels photos if API key is available
    if (process.env.PEXELS_API_KEY && pexelsCount > 0) {
      try {
        console.log(`Fetching ${pexelsCount} photos from Pexels...`)
        const pexelsPhotos = await getPexelsPhotos(gender, true)
        if (pexelsPhotos && Array.isArray(pexelsPhotos)) {
          photos.push(...pexelsPhotos.slice(0, pexelsCount))
          console.log(`Added ${Math.min(pexelsPhotos.length, pexelsCount)} Pexels photos`)
        } else {
          console.warn("No valid Pexels photos returned")
        }
      } catch (error) {
        console.warn("Pexels API error, falling back to local:", error)
      }
    } else {
      console.log(`Skipping Pexels (no API key or count is 0)`)
    }
    
    // Get local photos to fill the rest
    const localPhotos = await getLocalPhotos(gender)
    const remainingCount = totalPhotos - photos.length
    if (remainingCount > 0) {
      photos.push(...localPhotos.slice(0, remainingCount))
      console.log(`Added ${Math.min(localPhotos.length, remainingCount)} local photos`)
    }
    
    console.log(`Final mixed photos count: ${photos.length}`)
    
    // Shuffle the combined array
    return shuffleArray(photos)
  } catch (error) {
    console.error("Error mixing photos:", error)
    // Fallback to local photos
    return await getLocalPhotos(gender)
  }
}

// Generate alt text for images based on filename and gender
function generateAltText(filename: string, gender: string): string {
  // Extract base name without extension and numbers
  const baseName = filename.replace(/\.(jpg|jpeg|png|webp)$/i, "").replace(/_\d+$/, "")
  
  // Determine category from filename patterns
  let category = "fashion"
  if (baseName.includes("casual")) category = "casual"
  else if (baseName.includes("formal")) category = "formal"
  else if (baseName.includes("street")) category = "street"
  else if (baseName.includes("business")) category = "business"
  
  // Get gender label
  const genderLabel = gender === "male" ? "Men's" : "Women's"
  
  // Generate a descriptive alt text
  return `${genderLabel} ${category} outfit`
}
