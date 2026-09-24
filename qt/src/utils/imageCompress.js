const DEFAULT_MAX_BYTES = 10 * 1024 * 1024
const MAX_EDGE = 4096
const MIN_EDGE = 800

function loadImageBitmap(file) {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file)
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('图片读取失败'))
    }
    img.src = url
  })
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('图片压缩失败'))
        else resolve(blob)
      },
      type,
      quality
    )
  })
}

/**
 * Compress image only when it exceeds maxBytes. Smaller files pass through unchanged.
 * Oversized images are re-encoded as JPEG with progressive quality/size reduction.
 */
export async function compressImageIfNeeded(file, maxBytes = DEFAULT_MAX_BYTES) {
  if (!file || !file.type?.startsWith('image/')) return file
  if (file.size <= maxBytes) return file

  const source = await loadImageBitmap(file)
  const release = typeof source.close === 'function' ? () => source.close() : () => {}

  try {
    let width = source.width
    let height = source.height
    const longEdge = Math.max(width, height)

    if (longEdge > MAX_EDGE) {
      const scale = MAX_EDGE / longEdge
      width = Math.max(1, Math.round(width * scale))
      height = Math.max(1, Math.round(height * scale))
    }

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('图片压缩失败')

    const encode = async (w, h, quality) => {
      canvas.width = w
      canvas.height = h
      ctx.clearRect(0, 0, w, h)
      ctx.drawImage(source, 0, 0, w, h)
      return canvasToBlob(canvas, 'image/jpeg', quality)
    }

    let quality = 0.92
    let blob = await encode(width, height, quality)

    while (blob.size > maxBytes && quality > 0.5) {
      quality = Math.round((quality - 0.1) * 100) / 100
      blob = await encode(width, height, quality)
    }

    while (blob.size > maxBytes && Math.max(width, height) > MIN_EDGE) {
      width = Math.max(1, Math.round(width * 0.8))
      height = Math.max(1, Math.round(height * 0.8))
      blob = await encode(width, height, quality)
    }

    if (blob.size > maxBytes) {
      throw new Error('图片过大，压缩后仍超过10MB')
    }

    const baseName = (file.name || 'image').replace(/\.[^.]+$/, '')
    return new File([blob], `${baseName}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now()
    })
  } finally {
    release()
  }
}

export const IM_IMAGE_MAX_BYTES = DEFAULT_MAX_BYTES
