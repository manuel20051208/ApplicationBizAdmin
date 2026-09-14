/**
 * Compresión de imágenes client-side antes de subirlas al backend.
 * Reduce drásticamente el peso de las fotos (sobre todo las de cámara móvil)
 * re-encodándolas a JPEG con un ancho máximo y calidad ajustable.
 */

export interface CompressOptions {
  /** Lado largo máximo en px (default 1600). */
  maxDimension?: number;
  /** Calidad JPEG 0-1 (default 0.82). */
  quality?: number;
}

/** Umbral desde el que un JPEG se considera "ya optimizado" y se devuelve tal cual. */
const JPEG_SKIP_THRESHOLD = 500 * 1024;

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(file);
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function closeBitmap(source: ImageBitmap | HTMLImageElement): void {
  if (typeof ImageBitmap !== "undefined" && source instanceof ImageBitmap) {
    source.close();
  }
}

/**
 * Devuelve un `File` JPEG ya comprimido. Si el archivo no es una imagen,
 * ya es un JPEG pequeño o falla el decode, devuelve el archivo original.
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const maxDimension = options.maxDimension ?? 1600;
  const quality = options.quality ?? 0.82;

  if (!file.type.startsWith("image/")) return file;
  if (file.type === "image/jpeg" && file.size <= JPEG_SKIP_THRESHOLD) return file;

  try {
    const source = await loadBitmap(file);
    const scale = Math.min(1, maxDimension / Math.max(source.width, source.height));

    // JPEG que ya es pequeño de dimensiones: no vale la pena reprocesar.
    if (scale >= 1 && file.type === "image/jpeg") return file;

    const width = Math.max(1, Math.round(source.width * scale));
    const height = Math.max(1, Math.round(source.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      closeBitmap(source);
      return file;
    }
    ctx.drawImage(source, 0, 0, width, height);
    closeBitmap(source);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
    if (!blob) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
    return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
  } catch {
    return file;
  }
}