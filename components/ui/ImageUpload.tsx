"use client";

import { useState, useRef } from "react";
import Image from "next/image";

interface ImageUploadProps {
  value: string | string[];
  onChange: (url: string | string[]) => void;
  multiple?: boolean;
  folder?: string;
  label?: string;
  maxImages?: number;
}

export default function ImageUpload({
  value,
  onChange,
  multiple = false,
  folder = "general",
  label,
  maxImages = 10,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File): Promise<string | null> {
    const form = new FormData();
    form.append("file", file);
    form.append("folder", folder);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    if (!res.ok) {
      const data = await res.json() as { error?: string };
      throw new Error(data.error ?? "Upload failed");
    }
    const data = await res.json() as { url: string };
    return data.url;
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError("");
    setUploading(true);

    try {
      if (!multiple) {
        const url = await uploadFile(files[0]);
        if (url) onChange(url);
      } else {
        const current = Array.isArray(value) ? value : value ? [value] : [];
        const remaining = maxImages - current.length;
        const toUpload = Array.from(files).slice(0, remaining);
        const urls: string[] = [...current];
        for (const file of toUpload) {
          const url = await uploadFile(file);
          if (url) urls.push(url);
        }
        onChange(urls);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeImage(index?: number) {
    if (!multiple) {
      onChange("");
    } else {
      const current = Array.isArray(value) ? value : [];
      onChange(current.filter((_, i) => i !== index));
    }
  }

  const gold = "#c9a84c";

  // Single image mode
  if (!multiple) {
    const singleUrl = typeof value === "string" ? value : Array.isArray(value) ? value[0] : "";
    return (
      <div>
        {label && (
          <label className="block mb-1.5" style={{ color: "var(--color-text-dim)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px" }}>
            {label}
          </label>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => void handleFiles(e.target.files)}
        />
        {singleUrl ? (
          <div className="relative rounded-lg overflow-hidden" style={{ height: "160px", border: `1px solid var(--color-border)` }}>
            <Image src={singleUrl} alt="Upload" fill style={{ objectFit: "cover" }} />
            <div className="absolute inset-0 flex items-end justify-between p-2" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)" }}>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="text-xs px-2 py-1 rounded font-medium"
                style={{ backgroundColor: gold, color: "#080809" }}
              >
                {uploading ? "Uploading…" : "Change"}
              </button>
              <button
                type="button"
                onClick={() => removeImage()}
                className="text-xs px-2 py-1 rounded"
                style={{ backgroundColor: "rgba(239,68,68,0.8)", color: "#fff" }}
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-full rounded-lg flex flex-col items-center justify-center gap-2 transition-colors disabled:opacity-50"
            style={{
              height: "120px",
              border: `2px dashed ${gold}`,
              backgroundColor: "rgba(201,168,76,0.04)",
              color: "var(--color-text-dim)",
            }}
          >
            <span style={{ fontSize: "24px", opacity: 0.5 }}>📷</span>
            <span style={{ fontSize: "12px" }}>{uploading ? "Uploading…" : "Click to upload"}</span>
          </button>
        )}
        {error && <p className="mt-1 text-xs" style={{ color: "#ef4444" }}>{error}</p>}
        <p className="mt-1" style={{ color: "var(--color-text-dim)", fontSize: "10px" }}>JPG, PNG, WebP · Max 5MB</p>
      </div>
    );
  }

  // Multiple images mode
  const urls = Array.isArray(value) ? value : value ? [value] : [];
  return (
    <div>
      {label && (
        <label className="block mb-1.5" style={{ color: "var(--color-text-dim)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px" }}>
          {label}
        </label>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />
      <div className="grid grid-cols-3 gap-2">
        {urls.map((url, i) => (
          <div key={i} className="relative rounded-lg overflow-hidden" style={{ height: "80px", border: "1px solid var(--color-border)" }}>
            <Image src={url} alt={`Photo ${i + 1}`} fill style={{ objectFit: "cover" }} />
            <button
              type="button"
              onClick={() => removeImage(i)}
              className="absolute top-1 right-1 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ width: "18px", height: "18px", backgroundColor: "rgba(0,0,0,0.7)", color: "#fff" }}
            >
              ×
            </button>
          </div>
        ))}
        {urls.length < maxImages && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="rounded-lg flex flex-col items-center justify-center gap-1 transition-colors disabled:opacity-50"
            style={{
              height: "80px",
              border: `2px dashed ${gold}`,
              backgroundColor: "rgba(201,168,76,0.04)",
              color: "var(--color-text-dim)",
            }}
          >
            <span style={{ fontSize: "20px", opacity: 0.5 }}>{uploading ? "⏳" : "+"}</span>
            <span style={{ fontSize: "10px" }}>{uploading ? "Uploading…" : "Add Photo"}</span>
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs" style={{ color: "#ef4444" }}>{error}</p>}
      <p className="mt-1" style={{ color: "var(--color-text-dim)", fontSize: "10px" }}>JPG, PNG, WebP · Max 5MB per image</p>
    </div>
  );
}
