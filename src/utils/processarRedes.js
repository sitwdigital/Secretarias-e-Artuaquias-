// src/utils/processarRedes.js
function normalizarNome(nome) {
  return String(nome || "")
    .normalize("NFD")                 // separa acentos (ex.: "é" -> "é")
    .replace(/[\u0300-\u036f]/g, "")  // remove acentos
    .trim()                           // remove espaços extras
    .toLowerCase();                   // tudo minúsculo
}

// converte "229.498", "1.169", "5,552", "5.552" -> número
function toNumber(v) {
  if (v == null) return 0;
  const s = String(v).trim();
  if (!s) return 0;
  // remove separador de milhar ".", troca vírgula por ponto, remove espaços
  const clean = s.replace(/\./g, "").replace(",", ".").replace(/\s+/g, "");
  const n = parseFloat(clean);
  return Number.isFinite(n) ? n : 0;
}

// lê o nome aceitando os dois formatos de planilha
function getNomeDoRow(row = {}) {
  return String(
    row["SECRETARIAS E AUTARQUIAS"] ??
    row["SECRETÁRIO"] ??
    row["SECRETARIO"] ??
    ""
  ).trim();
}

export default function processarRedes(insta = [], face = [], tw = [], somaSeguidores = []) {
  const mapa = new Map();

  // Lista fixa de verificados (já normalizada)
  const verificados = [
  "gov-ma", "secma", "procon", "ses",
  "seduc", "detran", "iema", "emap", "cbm",
  "sedes", "sema", "setres", "senic", "saf",
  "secti", "semag", "sema", "setres", "seinc", "cbm",
  ].map(normalizarNome);

  // acumula seguidores por rede para o nome
  const somar = (arr = [], rede) => {
    arr.forEach((item) => {
      const nomeOriginal = getNomeDoRow(item);
      const nomeNorm = normalizarNome(nomeOriginal);
      if (!nomeNorm) return;

      const seguidores = toNumber(item["SEGUIDORES"] ?? item["SEGUIDOR"]);

      if (!mapa.has(nomeNorm)) {
        mapa.set(nomeNorm, {
          nome: nomeOriginal,   // mantém original para exibir
          instagram: 0,
          facebook: 0,
          twitter: 0,
          total: 0,
          verificado: verificados.includes(nomeNorm),
        });
      }

      const obj = mapa.get(nomeNorm);
      obj[rede] = seguidores;
      obj.total = obj.instagram + obj.facebook + obj.twitter;
    });
  };

  somar(insta, "instagram");
  somar(face, "facebook");
  somar(tw, "twitter");

  const lista = Array.from(mapa.values());

  // Ranking de ganho de seguidores (aba SOMA SEGUIDORES)
  const rankingGanho = (somaSeguidores || [])
    .filter((row) => row["NOME"] && row["SOMA"] != null)
    .map((row) => {
      const nomeOriginal = String(row["NOME"]).trim();
      const nomeNorm = normalizarNome(nomeOriginal);
      return {
        nome: nomeOriginal,
        ganho: toNumber(row["SOMA"]),
        cargo: "",
        verificado: verificados.includes(nomeNorm),
      };
    })
    .sort((a, b) => b.ganho - a.ganho)
    .slice(0, 10);

  return {
    top10: [...lista].sort((a, b) => b.total - a.total).slice(0, 10),
    instagram: [...lista].sort((a, b) => b.instagram - a.instagram),
    facebook:  [...lista].sort((a, b) => b.facebook  - a.facebook),
    twitter:   [...lista].sort((a, b) => b.twitter   - a.twitter),
    rankingGanho,
  };
}
