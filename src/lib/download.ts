"use client";

/** Trigger a file download from a URL with cookies. */
export async function downloadFile(url: string, fallbackName = "download") {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    try {
      const json = JSON.parse(text);
      throw new Error(json.error || `HTTP ${res.status}`);
    } catch {
      throw new Error(`Gagal mengunduh (${res.status})`);
    }
  }
  // Filename from Content-Disposition
  const cd = res.headers.get("Content-Disposition") || "";
  const match = cd.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] || fallbackName;

  const blob = await res.blob();
  const a = document.createElement("a");
  const objectUrl = URL.createObjectURL(blob);
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
