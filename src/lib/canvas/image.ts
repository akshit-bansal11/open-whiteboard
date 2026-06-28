/** 2MB file size limit for images */
export const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024

export class ImageSizeError extends Error {
  constructor() {
    super("Image exceeds maximum size of 2MB")
    this.name = "ImageSizeError"
  }
}

/**
 * Converts a File object to a base64 string.
 * @throws {ImageSizeError} if the file exceeds the 2MB limit.
 */
export async function fileToBase64(file: File): Promise<string> {
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new ImageSizeError()
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Gets natural dimensions of a base64 image.
 */
export async function getImageDimensions(
  src: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () =>
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = reject
    img.src = src
  })
}

/**
 * Extracts an image file from a ClipboardEvent and converts it to base64.
 * Returns null if no image was found in the clipboard.
 * @throws {ImageSizeError} if the image exceeds the 2MB limit.
 */
export async function clipboardToBase64(
  e: ClipboardEvent
): Promise<{ src: string; width: number; height: number } | null> {
  const items = e.clipboardData?.items
  if (!items) return null

  for (const item of Array.from(items)) {
    if (item.type.startsWith("image/")) {
      const file = item.getAsFile()
      if (file) {
        const src = await fileToBase64(file)
        const dims = await getImageDimensions(src)
        return { src, ...dims }
      }
    }
  }

  return null
}
