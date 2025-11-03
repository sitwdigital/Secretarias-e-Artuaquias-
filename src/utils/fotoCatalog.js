// src/utils/fotoCatalog.js

// 1) Busca imagens dentro de src/assets/fotos (empacotadas pelo Vite)
const imported1 = import.meta.glob('../assets/fotos/*.{png,jpg,jpeg,webp,svg}', {
  eager: true,
  as: 'url',
});

// 2) (Opcional) Também busca em src/assets/fotos_secretarias, caso você prefira manter nessa pasta dentro de src
const imported2 = import.meta.glob('../assets/fotos_secretarias/*.{png,jpg,jpeg,webp,svg}', {
  eager: true,
  as: 'url',
});

// normaliza "Orléans Brandão" -> "orleans-brandao"
export function slugifyNome(str = '') {
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // tira acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')     // troca tudo por hífen
    .replace(/(^-|-$)/g, '');        // trim de hífens
}

// cria um único mapa com tudo que o Vite empacotar
const imageMap = {};

function addToMap(imported) {
  for (const path in imported) {
    const url = imported[path];
    const file = path.split('/').pop();        // ex: "uema.jpg"
    const base = file.replace(/\.[^.]+$/, ''); // "uema"
    imageMap[base] = url;
  }
}
addToMap(imported1);
addToMap(imported2);

// Aliases opcionais (nomes “estranhos” => arquivo)
// ex.: "franca-do-macaquinho" usa a mesma foto de "franca"
const ALIASES = {
  'cbm-ma': 'cbm',
  'DEFESA CIVIL': 'defesa-civil',
  'GOV MA': 'gov-ma',
  'POLÍCIA CIVIL': 'policia-civil',
  'CASA DA MULHER': 'casa-da-mulher',
  'SHOPPING DA CRIANÇA': 'shopping-da-crianca',
};

export function fotoPorNome(nome) {
  if (!nome) return null;
  const key = slugifyNome(nome);
  const finalKey = ALIASES[key] || key;

  // 1) Tenta imagens empacotadas (src/assets/...)
  if (imageMap[finalKey]) return imageMap[finalKey];

  // 2) Fallback para pasta pública (public/fotos_secretarias)
  //    Basta colocar "uema.jpg" em public/fotos_secretarias/uema.jpg
  return `/fotos_secretarias/${finalKey}.jpg`;
}
