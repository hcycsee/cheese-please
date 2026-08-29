"use client";

import { useRef, useState } from "react";

const SIZE = 200;

function cropToSquareDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas not supported."));
        return;
      }
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      ctx.drawImage(img, sx, sy, side, side, 0, 0, SIZE, SIZE);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Couldn't read that image."));
    };
    img.src = url;
  });
}

export default function AvatarUploader({ initialUrl }: { initialUrl: string | null }) {
  const [preview, setPreview] = useState<string | null>(initialUrl);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setLoading(true);
    try {
      const dataUrl = await cropToSquareDataUrl(file);
      const res = await fetch("/api/profile/avatar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to upload.");
      setPreview(data.avatarUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image.");
    } finally {
      setLoading(false);
    }
  }

  async function remove() {
    setLoading(true);
    try {
      await fetch("/api/profile/avatar", { method: "DELETE" });
      setPreview(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card flex flex-col gap-4">
      <h2 className="font-semibold">Profile picture</h2>
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-stone-200 bg-stone-100">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Your avatar" className="h-full w-full object-cover" />
          ) : (
            <span className="text-3xl">🙂</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <button
            type="button"
            className="btn-secondary text-sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
          >
            {loading ? "Uploading..." : "Upload photo"}
          </button>
          {preview && (
            <button type="button" className="btn-ghost text-sm" onClick={remove} disabled={loading}>
              Remove
            </button>
          )}
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
