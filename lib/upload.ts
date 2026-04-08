import fs from "fs";
import path from "path";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
const ALLOWED_EXTS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

export async function saveUploadedFile(
  file: File,
  folder: string = "uploads"
): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Invalid file type. Only JPG, PNG, WebP, and GIF are allowed.");
  }

  if (file.size > MAX_BYTES) {
    throw new Error("File too large. Maximum size is 5MB.");
  }

  const originalExt = path.extname(file.name).toLowerCase();
  const ext = ALLOWED_EXTS.includes(originalExt) ? originalExt : ".jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;

  const uploadDir = path.join(process.cwd(), "public", folder);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filePath = path.join(uploadDir, filename);
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(filePath, buffer);

  return `/${folder}/${filename}`;
}
