// src/utils/imgToBase64.js
export async function imgToBase64(url, maxWidth = 900, quality = 0.85) {
  try {
    if (!url) return null;

    // 1) Se NÃO for Google Drive, tenta baixar direto.
    const isDrive =
      /drive\.google\.com/.test(url) ||
      /googleusercontent\.com/.test(url);

    let fetchUrl = url;

    if (isDrive) {
      // Extrai o ID do Google Drive
      const viaSlash = url.match(/\/d\/([^/]+)\//);
      const viaParam = url.match(/[?&]id=([^&]+)/);
      const id = viaSlash ? viaSlash[1] : viaParam ? viaParam[1] : null;

      if (!id) {
        // link do drive sem ID claro → devolve a URL original
        return url;
      }

      // 2) Usa proxy público com CORS liberado (sem precisar de servidor próprio)
      // Doc: https://images.weserv.nl
      const driveDirect = `drive.google.com/uc?id=${id}`;
      fetchUrl = `https://images.weserv.nl/?url=${encodeURIComponent(
        driveDirect
      )}&w=${maxWidth}&output=jpg`;
    }

    // 3) Baixa a imagem (CORS ok pelo weserv) e converte para base64
    const res = await fetch(fetchUrl, { mode: "cors" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const blob = await res.blob();
    const bitmap = await createImageBitmap(blob);

    // Redimensiona (caso a imagem seja maior que maxWidth)
    const scale = Math.min(1, maxWidth / bitmap.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));

    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    // JPEG comprimido
    const dataUrl = canvas.toDataURL("image/jpeg", quality);

    // React-PDF aceita data: URLs (não reclama de extensão).
    return dataUrl;
  } catch (err) {
    // Falhou? NÃO QUEBRA o app: devolve a URL original
    console.warn("imgToBase64: falha ao converter; usando URL original →", url, err);
    return url;
  }
}
