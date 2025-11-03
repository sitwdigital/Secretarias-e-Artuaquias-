// src/components/common/UploadRedes.jsx
import { useState } from "react";
import * as XLSX from "xlsx";
import processarRedes from "../../utils/processarRedes";
import { fotoPorNome } from "../../utils/fotoCatalog";
import { aplicarVariacoesEmTudo } from "../../shared/calcVariacao";
import { imgToBase64 } from "../../utils/imgToBase64"; // 👈 converte imagem para base64 (funciona no PDF)

// ---------------------- helpers ----------------------
const norm = (s = "") =>
  String(s).trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const num = (v) => {
  if (v == null || v === "") return 0;
  const s = String(v).replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

const getSheetInsensitive = (wb, wanted) => {
  const idx = wb.SheetNames.findIndex((n) => norm(n) === norm(wanted));
  return idx >= 0 ? wb.Sheets[wb.SheetNames[idx]] : null;
};

const lerAba = (wb, nomeEsperado) => {
  const sh = getSheetInsensitive(wb, nomeEsperado);
  return sh ? XLSX.utils.sheet_to_json(sh, { defval: "" }) : [];
};

const nomeStr = (v) => (v ? String(v).trim() : "");

// ---------- Snapshot ----------
function getLastSnapshot() {
  try {
    const snapRaw = localStorage.getItem("lastSnapshot");
    return snapRaw ? JSON.parse(snapRaw) : null;
  } catch {
    return null;
  }
}
function saveSnapshot(data) {
  try {
    localStorage.setItem("lastSnapshot", JSON.stringify(data));
  } catch {}
}

// -----------------------------------------------------

export default function UploadRedes({ setDados }) {
  const [arquivoSelecionado, setArquivoSelecionado] = useState(null);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setArquivoSelecionado(file.name);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        // Abas (nova planilha)
        const rawInstagram = lerAba(workbook, "INSTAGRAM");
        const rawFacebook  = lerAba(workbook, "FACEBOOK");
        const rawTwitter   = lerAba(workbook, "TWITTER"); // mantém TWITTER
        const rawSoma      = lerAba(workbook, "SOMA SEGUIDORES");
        const rawPubs      = lerAba(workbook, "PUBLICAÇÃO ENGAJADAS");

        console.log("🗂️ Lidas:", {
          instagram: rawInstagram.length,
          facebook: rawFacebook.length,
          twitter: rawTwitter.length,
          somaSeguidores: rawSoma.length,
          publicacoes: rawPubs.length,
        });

        // Coluna de nome (tanto nova quanto antiga)
        const pickNome = (linha) =>
          nomeStr(
            linha["SECRETARIAS E AUTARQUIAS"] ??
              linha["SECRETÁRIO"] ??
              linha["SECRETARIO"] ??
              linha["NOME"]
          );

        // ---- Arrs p/ processarRedes (formato esperado: "SECRETÁRIO"/"SEGUIDORES")
        const instaProc = rawInstagram
          .map((ln) => ({
            "SECRETÁRIO": pickNome(ln),
            "SEGUIDORES": num(ln["SEGUIDORES"]),
          }))
          .filter((r) => r["SECRETÁRIO"]);

        const faceProc = rawFacebook
          .map((ln) => ({
            "SECRETÁRIO": pickNome(ln),
            "SEGUIDORES": num(ln["SEGUIDORES"]),
          }))
          .filter((r) => r["SECRETÁRIO"]);

        const twProc = rawTwitter
          .map((ln) => ({
            "SECRETÁRIO": pickNome(ln),
            "SEGUIDORES": num(ln["SEGUIDORES"]),
          }))
          .filter((r) => r["SECRETÁRIO"]);

        // ---- Arrs enriquecidos p/ UI (com foto/nome/seguidores)
        const toUI = (arr) =>
          arr.map((r) => ({
            nome: r["SECRETÁRIO"],
            seguidores: r["SEGUIDORES"],
            foto: fotoPorNome(r["SECRETÁRIO"]) || "",
            cargo: "",
          }));

        const instaUI = toUI(instaProc);
        const faceUI  = toUI(faceProc);
        const twUI    = toUI(twProc);

        // ---- SOMA SEGUIDORES (NOME, SOMA)
        const somaSeguidores = rawSoma
          .map((ln) => ({
            NOME: nomeStr(ln["NOME"]),
            SOMA: num(ln["SOMA"]),
          }))
          .filter((r) => r.NOME);

        // ---- PUBLICAÇÃO ENGAJADAS (com base64 para PDF)
        const publicacoesEngajadas = await Promise.all(
          (rawPubs || []).map(async (ln, i) => {
            // Data pode vir serial do Excel
            let dataFormatada = "";
            const d = ln["DATA"];
            if (d) {
              if (typeof d === "number") {
                const baseDate = new Date(1900, 0, d - 1);
                dataFormatada = baseDate.toLocaleDateString("pt-BR");
              } else {
                dataFormatada = String(d).trim();
              }
            }

            // Converte imagem para base64 (resolve CORS no React-PDF)
            const fotoUrl = ln["FOTO"] || "";
            let fotoFinal = fotoUrl || null;
            if (fotoUrl) {
              try {
                const b64 = await imgToBase64(fotoUrl, 900, 0.85);
                if (b64) fotoFinal = b64;
              } catch (err) {
                console.warn("Falha ao converter imagem para base64:", fotoUrl, err);
              }
            }

            return {
              ITEM: ln["ITEM"] ?? i + 1,
              NOME: nomeStr(ln["NOME"]),
              POSICAO: num(ln["POSIÇÃO"] ?? ln["POSICAO"]),
              FOTO: fotoFinal, // ✅ já em base64 (ou URL se falhar)
              DATA: dataFormatada,
            };
          })
        );

        // ---- Processamento consolidado
        const base = processarRedes(instaProc, faceProc, twProc, somaSeguidores);

        // substitui listas por versões enriquecidas (UI)
        base.instagram = instaUI;
        base.facebook  = faceUI;
        base.twitter   = twUI;

        // publicaçoes
        base.publicacoesEngajadas = publicacoesEngajadas;

        // ---- variações (snapshot)
        const snapshotAnterior = getLastSnapshot();
        const resultado = aplicarVariacoesEmTudo(base, snapshotAnterior || {});
        resultado.publicacoesEngajadas = publicacoesEngajadas;

        // entrega + persiste
        setDados(resultado);
        const json = JSON.stringify(resultado);
        localStorage.setItem("relatorioSecretarias", json);
        localStorage.setItem("relatorioRedes", json);
        saveSnapshot(resultado);
      } catch (err) {
        console.error("Erro ao ler o Excel:", err);
        alert(
          "Não foi possível processar o arquivo. Confira os nomes das abas e o formato."
        );
      }
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div>
      {!arquivoSelecionado && (
        <input
          type="file"
          accept=".xlsx"
          onChange={handleUpload}
          className="block w-full p-2 border rounded-md shadow-sm"
        />
      )}
    </div>
  );
}

