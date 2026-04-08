import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
const ALLOWED_EXTS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

const VALID_FOLDERS = ["lots", "events", "newsletter", "general"] as const;
type UploadFolder = (typeof VALID_FOLDERS)[number];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const folderRaw = formData.get("folder");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const folder: UploadFolder =
      typeof folderRaw === "string" && (VALID_FOLDERS as readonly string[]).includes(folderRaw)
        ? (folderRaw as UploadFolder)
        : "general";

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPG, PNG, WebP, and GIF allowed." },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    const originalExt = path.extname(file.name).toLowerCase();
    const ext = ALLOWED_EXTS.includes(originalExt) ? originalExt : ".jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, filename);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(filePath, buffer);

    return NextResponse.json({ url: `/uploads/${folder}/${filename}` }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/upload]", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
