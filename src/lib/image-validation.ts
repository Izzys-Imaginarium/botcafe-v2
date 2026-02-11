/**
 * Shared image validation for avatar/profile image uploads.
 * Used by bot wizard, creator profile, and persona forms.
 */

export const IMAGE_CONSTRAINTS = {
  maxSizeBytes: 5 * 1024 * 1024, // 5MB
  maxSizeMB: 5,
  validTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const,
  validExtensions: 'PNG, JPG, GIF, or WebP',
  avatar: {
    minWidth: 100,
    minHeight: 100,
    maxWidth: 4096,
    maxHeight: 4096,
  },
  banner: {
    minWidth: 400,
    minHeight: 100,
    maxWidth: 6000,
    maxHeight: 4096,
  },
}

export type ImageType = 'avatar' | 'banner'

export interface ImageValidationError {
  type: 'format' | 'size' | 'dimensions'
  message: string
}

/**
 * Validates file type (format).
 */
function validateFormat(file: File): ImageValidationError | null {
  if (!IMAGE_CONSTRAINTS.validTypes.includes(file.type as any)) {
    const ext = file.name.split('.').pop()?.toUpperCase() || 'unknown'
    return {
      type: 'format',
      message: `Unsupported image format "${ext}". Please use ${IMAGE_CONSTRAINTS.validExtensions}.`,
    }
  }
  return null
}

/**
 * Validates file size.
 */
function validateSize(file: File): ImageValidationError | null {
  if (file.size > IMAGE_CONSTRAINTS.maxSizeBytes) {
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(1)
    return {
      type: 'size',
      message: `Image is too large (${fileSizeMB}MB). Maximum file size is ${IMAGE_CONSTRAINTS.maxSizeMB}MB. Try compressing the image or using a smaller resolution.`,
    }
  }
  return null
}

/**
 * Loads an image file and returns its dimensions.
 */
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image. The file may be corrupted or not a valid image.'))
    }
    img.src = url
  })
}

/**
 * Validates image dimensions for the given image type.
 */
function validateDimensions(
  width: number,
  height: number,
  imageType: ImageType
): ImageValidationError | null {
  const constraints = IMAGE_CONSTRAINTS[imageType]

  if (width < constraints.minWidth || height < constraints.minHeight) {
    return {
      type: 'dimensions',
      message: `Image is too small (${width}x${height}px). Minimum size is ${constraints.minWidth}x${constraints.minHeight}px.`,
    }
  }

  if (width > constraints.maxWidth || height > constraints.maxHeight) {
    return {
      type: 'dimensions',
      message: `Image is too large (${width}x${height}px). Maximum size is ${constraints.maxWidth}x${constraints.maxHeight}px. Please resize the image.`,
    }
  }

  return null
}

/**
 * Validates an image file for upload. Checks format, size, and dimensions.
 * Returns null if valid, or an error object with a user-friendly message.
 */
export async function validateImageFile(
  file: File,
  imageType: ImageType = 'avatar'
): Promise<ImageValidationError | null> {
  // 1. Check format
  const formatError = validateFormat(file)
  if (formatError) return formatError

  // 2. Check file size
  const sizeError = validateSize(file)
  if (sizeError) return sizeError

  // 3. Check dimensions
  try {
    const { width, height } = await getImageDimensions(file)
    const dimensionError = validateDimensions(width, height, imageType)
    if (dimensionError) return dimensionError
  } catch {
    return {
      type: 'format',
      message: 'Unable to read this image file. It may be corrupted or in an unsupported format. Please try a different image.',
    }
  }

  return null
}
