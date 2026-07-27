/**
 * Servicio para subir imágenes directamente a Cloudinary desde el cliente.
 * Utiliza un unsigned upload preset si está configurado en las variables de entorno,
 * o un preset por defecto 'ml_default'.
 */
export async function uploadToCloudinary(file: File): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "demo";
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData?.error?.message || `Error ${res.status} al subir a Cloudinary`;
    throw new Error(message);
  }

  const data = await res.json();
  return data.secure_url as string;
}
