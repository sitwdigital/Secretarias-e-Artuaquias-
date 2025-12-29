// src/utils/fotoCatalog.js

// 1) Busca imagens dentro de src/assets/fotos (empacotadas pelo Vite)
const imported1 = import.meta.glob('../assets/fotos/*.{png,jpg,jpeg,webp,svg}', {
  eager: true,
  as: 'url',
});

// 2) (Opcional) Também busca em src/assets/fotos_secretarias
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
    .replace(/[^a-z0-9]+/g, '-')     // troca tudo que não é letra/número por hífen
    .replace(/(^-|-$)/g, '');        // remove hífen no começo/fim
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
  'defesa-civil': 'defesa-civil',
  'gov-ma': 'gov-ma',
  'policia-civil': 'policia-civil',
  'casa-da-mulher': 'casa-da-mulher',
  'shopping-da-crianca': 'shopping-da-crianca',
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
