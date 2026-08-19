/**
 * Servicio para subir imágenes directamente a Cloudinary desde el cliente.
 * Utiliza un unsigned upload preset configurado en las variables públicas del
 * frontend. No usamos valores de prueba porque pueden aparentar que la foto se
 * seleccionó correctamente, pero fallar al enviarla desde el dispositivo.
 */
export async function uploadToCloudinary(file: File): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.trim();

  if (!cloudName || !uploadPreset) {
    throw new Error(
      "La subida de fotos no está configurada. Define NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME y NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET."
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`, {
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
