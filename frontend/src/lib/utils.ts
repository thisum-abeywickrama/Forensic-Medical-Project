export function cls(...args: (string | undefined | false | null)[]): string {
  return args.filter(Boolean).join(" ");
}

export function genId(prefix: string): string {
  const currentYear = new Date().getFullYear();
  let ids: string[] = [];
  try {
    const key = `ids_${prefix === "p" || prefix === "P" ? "P" : prefix}`;
    const stored = sessionStorage.getItem(key);
    if (stored) ids = JSON.parse(stored);
  } catch (err) {
    console.error("Failed to read IDs for generation:", err);
  }

  if (prefix === "USR" || prefix === "usr") {
    // Format: USR-1000
    let max = 999;
    ids.forEach(id => {
      const match = id.match(/^USR-(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > max) max = num;
      }
    });
    return `USR-${max + 1}`;
  } else {
    // Format: prefix-{CurrentYear}-10000
    // "p" for patient (lowercase)
    // "MLEF", "MLR", "PMR", "LAB", "GE" (uppercase)
    let outputPrefix = prefix;
    if (prefix.toLowerCase() === "p") outputPrefix = "p";
    else outputPrefix = prefix.toUpperCase();

    let max = 9999;
    const yearPattern = new RegExp(`^${outputPrefix}-${currentYear}-(\\d+)$`, 'i');
    ids.forEach(id => {
      const match = id.match(yearPattern);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > max) max = num;
      }
    });
    return `${outputPrefix}-${currentYear}-${max + 1}`;
  }
}

export async function downloadFileFromUrl(url: string, defaultFilename?: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    const urlFilename = url.split("/").pop()?.split("?")[0];
    a.download = defaultFilename || urlFilename || "uploaded_document.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error("Direct fetch download failed, falling back to window.open:", err);
    window.open(url, "_blank");
  }
}
