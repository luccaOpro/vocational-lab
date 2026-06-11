/*
  Regenera public/favicon.ico a partir de public/favicon.svg.
  ---
  Usa sharp (ya viene con Astro) para rasterizar el SVG a 16/32/48px
  y arma un .ico con las tres imágenes PNG adentro (formato que todos
  los navegadores modernos aceptan).

  Correr con:  node scripts/generar-favicon-ico.mjs
*/
import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";

const SVG = new URL("../public/favicon.svg", import.meta.url);
const ICO = new URL("../public/favicon.ico", import.meta.url);
const TAMANIOS = [16, 32, 48];

const svg = await readFile(SVG);

// 1. Rasterizar el SVG a cada tamaño (PNG con fondo transparente).
const pngs = [];
for (const t of TAMANIOS) {
  const png = await sharp(svg, { density: 300 }).resize(t, t).png().toBuffer();
  pngs.push({ t, png });
}

// 2. Armar el contenedor ICO: cabecera + un directorio por imagen + los PNG.
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reservado
header.writeUInt16LE(1, 2); // tipo: ícono
header.writeUInt16LE(pngs.length, 4);

const entradas = [];
let offset = 6 + 16 * pngs.length;
for (const { t, png } of pngs) {
  const e = Buffer.alloc(16);
  e.writeUInt8(t === 256 ? 0 : t, 0); // ancho
  e.writeUInt8(t === 256 ? 0 : t, 1); // alto
  e.writeUInt8(0, 2);                 // sin paleta
  e.writeUInt8(0, 3);                 // reservado
  e.writeUInt16LE(1, 4);              // planos
  e.writeUInt16LE(32, 6);             // bits por pixel
  e.writeUInt32LE(png.length, 8);     // tamaño de los datos
  e.writeUInt32LE(offset, 12);        // offset de los datos
  entradas.push(e);
  offset += png.length;
}

await writeFile(ICO, Buffer.concat([header, ...entradas, ...pngs.map((p) => p.png)]));
console.log(`favicon.ico regenerado (${TAMANIOS.join("/")}px, ${offset} bytes).`);
