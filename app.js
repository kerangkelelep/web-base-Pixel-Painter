/* Pixel Painter - app.js
   Fitur: grid, brush, eraser, fill, undo/redo, export PNG HD, export SVG, import/export JSON
*/

const App = {
  gridSize: 32,
  cellSize: 20,
  mode: "brush", // brush | eraser | fill
  scaleExport: 20,
  cells: [],
  undoStack: [],
  redoStack: [],
  painting: false,
  undoLocked: false
};

/* ---------------- DOM ---------------- */
const gridEl = document.getElementById("grid");

const gridSizeSlider = document.getElementById("grid-size");
const gridSizeLabel = document.getElementById("grid-size-label");
const gridSizeLabel2 = document.getElementById("grid-size-label-2");

const cellSizeSlider = document.getElementById("cell-size");
const cellSizeLabel = document.getElementById("cell-size-label");

const colorPicker = document.getElementById("color-picker");
const colorPreview = document.getElementById("color-preview");

const brushBtn = document.getElementById("brush-btn");
const eraserBtn = document.getElementById("eraser-btn");
const fillBtn = document.getElementById("fill-btn");

const undoBtn = document.getElementById("undo-btn");
const redoBtn = document.getElementById("redo-btn");
const clearBtn = document.getElementById("clear-btn");

const saveBtn = document.getElementById("save-btn");
const saveSvgBtn = document.getElementById("save-svg-btn");

const exportJsonBtn = document.getElementById("export-json-btn");
const importJsonBtn = document.getElementById("import-json-btn");
const jsonFileInput = document.getElementById("json-file-input");

const showGridCheck = document.getElementById("show-grid");
const zoomSlider = document.getElementById("zoom");

/* ---------- Utility: safe getElement ---------- */
function safe(el){
  if(!el) console.warn("Missing element reference:", el);
  return el;
}

/* --------------- Grid generator --------------- */
function setCellSizeCSS(px){
  document.documentElement.style.setProperty("--cell-size", px + "px");
}

function generateGrid(){
  gridEl.innerHTML = "";
  App.cells = [];
  gridEl.style.gridTemplateColumns = `repeat(${App.gridSize}, var(--cell-size))`;

  for(let i=0;i<App.gridSize*App.gridSize;i++){
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.dataset.index = i;
    cell.dataset.filled = "false";

    // events
    cell.addEventListener("mousedown", onCellMouseDown);
    cell.addEventListener("mouseenter", onCellMouseEnter);
    cell.addEventListener("click", onCellClick);

    gridEl.appendChild(cell);
    App.cells.push(cell);
  }
}

/* ------------- Painting handlers ------------- */
let pointerDown = false;
window.addEventListener("mousedown", ()=> pointerDown = true);
window.addEventListener("mouseup", ()=> {
  pointerDown = false;
  App.painting = false;
  App.undoLocked = false;
});

function onCellMouseDown(e){
  const cell = e.currentTarget;
  startPainting(cell);
}

function onCellMouseEnter(e){
  const cell = e.currentTarget;
  if(pointerDown) startPainting(cell);
}

function onCellClick(e){
  const cell = e.currentTarget;
  if(App.mode === "fill"){
    // push undo once
    pushUndo();
    floodFill(cell);
  } else {
    // toggled by mousedown handler, no op here
  }
}

function startPainting(cell){
  if(!cell) return;
  // push undo once at start of continuous painting
  if(!App.undoLocked){
    pushUndo();
    App.undoLocked = true;
  }

  App.painting = true;
  const color = (App.mode === "eraser") ? "transparent" : colorPicker.value;
  applyColorToCell(cell, color);
}

function applyColorToCell(cell, color){
  if(!cell) return;
  // normalize empty -> transparent
  const prev = cell.style.backgroundColor || "transparent";

  // if same color do nothing
  // compare by computed style: convert both to hex for consistent compare
  if(colorsEqual(prev, color)) return;

  if(color === "transparent"){
    cell.style.backgroundColor = "transparent";
    cell.dataset.filled = "false";
  } else {
    cell.style.backgroundColor = color;
    cell.dataset.filled = "true";
  }
}

/* ---------- Flood fill (iterative BFS) ---------- */
function floodFill(startCell){
  if(!startCell) return;
  const idx = Number(startCell.dataset.index);
  const targetColorRaw = startCell.style.backgroundColor || "transparent";
  const newColorRaw = colorPicker.value;

  if(colorsEqual(targetColorRaw, newColorRaw)) return;

  const size = App.gridSize;
  const visited = new Uint8Array(size*size);
  const q = [idx];

  while(q.length){
    const i = q.shift();
    if(visited[i]) continue;
    visited[i] = 1;

    const cell = App.cells[i];
    if(!cell) continue;

    if(colorsEqual(cell.style.backgroundColor || "transparent", targetColorRaw)){
      applyColorToCell(cell, newColorRaw);

      const row = Math.floor(i / size);
      const col = i % size;
      if(col > 0) q.push(i - 1);
      if(col < size - 1) q.push(i + 1);
      if(row > 0) q.push(i - size);
      if(row < size - 1) q.push(i + size);
    }
  }
}

/* --------- Undo / Redo (snapshots) --------- */
function snapshot(){
  return App.cells.map(c => c.style.backgroundColor || null);
}

function pushUndo(){
  App.undoStack.push(snapshot());
  // limit stack size to keep memory reasonable
  if(App.undoStack.length > 200) App.undoStack.shift();
  App.redoStack = [];
}

function undo(){
  if(App.undoStack.length === 0) return;
  const current = snapshot();
  App.redoStack.push(current);

  const prev = App.undoStack.pop();
  if(prev) loadSnapshot(prev);
}

function redo(){
  if(App.redoStack.length === 0) return;
  const current = snapshot();
  App.undoStack.push(current);

  const next = App.redoStack.pop();
  if(next) loadSnapshot(next);
}

function loadSnapshot(arr){
  if(!arr || arr.length !== App.cells.length) return;
  arr.forEach((val, i) => {
    App.cells[i].style.backgroundColor = val || "transparent";
    App.cells[i].dataset.filled = val ? "true" : "false";
  });
}

/* ---------------- Utilities ---------------- */
function colorsEqual(a, b){
  // handle transparent
  if((!a || a === "transparent") && (!b || b === "transparent")) return true;
  if(!a || !b) return false;

  // convert rgb(...) to hex for both
  const aa = cssColorToHex(a);
  const bb = cssColorToHex(b);
  return aa.toLowerCase() === bb.toLowerCase();
}

function cssColorToHex(cssColor){
  if(!cssColor) return "transparent";
  if(cssColor === "transparent") return "transparent";
  cssColor = cssColor.trim();
  if(cssColor.startsWith("#")) return cssColor;
  const m = cssColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if(m){
    const r = parseInt(m[1],10).toString(16).padStart(2,"0");
    const g = parseInt(m[2],10).toString(16).padStart(2,"0");
    const b = parseInt(m[3],10).toString(16).padStart(2,"0");
    return `#${r}${g}${b}`;
  }
  return cssColor;
}

/* ------------- Export PNG HD -------------- */
function exportPNG(scale = App.scaleExport, filename = "pixel-art-HD.png"){
  const size = App.gridSize;
  const canvas = document.createElement("canvas");
  canvas.width = size * scale;
  canvas.height = size * scale;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  App.cells.forEach((cell, i) => {
    const color = cell.style.backgroundColor || "transparent";
    if(!color || color === "transparent") {
      // leave transparent
    } else {
      const x = (i % size) * scale;
      const y = Math.floor(i / size) * scale;
      ctx.fillStyle = cssColorToHex(color);
      ctx.fillRect(x, y, scale, scale);
    }
  });

  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

/* ------------- Export SVG -------------- */
function exportAsSVG(scale = App.scaleExport, filename = "pixel-art.svg"){
  const size = App.gridSize;
  const width = size * scale;
  const height = size * scale;

  const header = `<?xml version="1.0" encoding="utf-8"?>\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" shape-rendering="crispEdges">\n`;

  let body = '';
  // optional background (transparent by default)
  // body += `<rect width="${width}" height="${height}" fill="#ffffff" />\n`;

  App.cells.forEach((cell, i) => {
    const c = cell.style.backgroundColor || "transparent";
    if(!c || c === "transparent") return;
    const x = (i % size) * scale;
    const y = Math.floor(i / size) * scale;
    const fill = cssColorToHex(c);
    body += `  <rect x="${x}" y="${y}" width="${scale}" height="${scale}" fill="${fill}" />\n`;
  });

  const footer = `</svg>`;
  const svg = header + body + footer;

  const blob = new Blob([svg], {type: "image/svg+xml;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ------------- JSON Export / Import -------------- */
function exportJSON(){
  const data = {
    gridSize: App.gridSize,
    cellSize: App.cellSize,
    pixels: App.cells.map(c => c.style.backgroundColor || null)
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {type: "application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pixel-art.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importJSONFile(file){
  if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if(!data.gridSize || !data.pixels) {
        alert("File JSON tidak valid");
        return;
      }
      App.gridSize = data.gridSize;
      App.cellSize = data.cellSize || App.cellSize;
      gridSizeSlider.value = App.gridSize;
      gridSizeLabel.textContent = App.gridSize;
      gridSizeLabel2.textContent = App.gridSize;

      cellSizeSlider.value = App.cellSize;
      cellSizeLabel.textContent = App.cellSize;
      setCellSizeCSS(App.cellSize);

      generateGrid();
      // apply pixels
      data.pixels.forEach((col, i) => {
        if(App.cells[i]) {
          App.cells[i].style.backgroundColor = col || "transparent";
          App.cells[i].dataset.filled = col ? "true" : "false";
        }
      });
    } catch(err) {
      alert("Gagal membaca JSON: " + err);
    }
  };
  reader.readAsText(file);
}

/* ------------- Init & UI wiring -------------- */
function init(){
  // initial values
  gridSizeSlider.value = App.gridSize;
  gridSizeLabel.textContent = App.gridSize;
  gridSizeLabel2.textContent = App.gridSize;

  cellSizeSlider.value = App.cellSize;
  cellSizeLabel.textContent = App.cellSize;
  setCellSizeCSS(App.cellSize);

  colorPreview.style.backgroundColor = colorPicker.value;

  // generate
  generateGrid();

  // events
  gridSizeSlider.addEventListener("input", (e) => {
    App.gridSize = Number(e.target.value);
    gridSizeLabel.textContent = App.gridSize;
    gridSizeLabel2.textContent = App.gridSize;
    generateGrid();
  });

  cellSizeSlider.addEventListener("input", (e) => {
    App.cellSize = Number(e.target.value);
    cellSizeLabel.textContent = App.cellSize;
    setCellSizeCSS(App.cellSize);
    // update grid template to reflect new var size
    gridEl.style.gridTemplateColumns = `repeat(${App.gridSize}, var(--cell-size))`;
  });

  colorPicker.addEventListener("input", (e) => {
    colorPreview.style.backgroundColor = e.target.value;
  });

  brushBtn.addEventListener("click", ()=> App.mode = "brush");
  eraserBtn.addEventListener("click", ()=> App.mode = "eraser");
  fillBtn.addEventListener("click", ()=> App.mode = "fill");

  undoBtn.addEventListener("click", undo);
  redoBtn.addEventListener("click", redo);
  clearBtn.addEventListener("click", ()=> { pushUndo(); App.cells.forEach(c => { c.style.backgroundColor = "transparent"; c.dataset.filled = "false"; }); });

  saveBtn.addEventListener("click", ()=> exportPNG(App.scaleExport));
  saveSvgBtn.addEventListener("click", ()=> exportAsSVG(App.scaleExport));

  exportJsonBtn.addEventListener("click", exportJSON);
  importJsonBtn.addEventListener("click", ()=> jsonFileInput.click());
  jsonFileInput.addEventListener("change", (e)=> importJSONFile(e.target.files[0]));

  showGridCheck.addEventListener("change", (e)=> {
    gridEl.style.gap = e.target.checked ? "1px" : "0px";
  });

  zoomSlider.addEventListener("input", (e)=> {
    const v = Number(e.target.value) / 100;
    gridEl.style.transform = `scale(${v})`;
    gridEl.style.transformOrigin = "0 0";
  });

  // keyboard shortcuts
  document.addEventListener("keydown", (ev) => {
    if(ev.ctrlKey && ev.key.toLowerCase() === "z"){ ev.preventDefault(); undo(); }
    if(ev.ctrlKey && ev.key.toLowerCase() === "y"){ ev.preventDefault(); redo(); }
  });
}

// run
init();
