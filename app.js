/* ======================================================
    Pixel Painter – APP.JS (Modular & Clean)
====================================================== */

const App = {
    gridSize: 32,
    scaleExport: 20,
    mode: "brush",
    cells: [],
    undo: [],
    redo: [],
};

/* ======================================================
    ELEMENT SELECTORS
====================================================== */
const gridEl = document.getElementById("grid");
const colorPicker = document.getElementById("colorPicker");
const btnBrush = document.getElementById("brushBtn");
const btnEraser = document.getElementById("eraserBtn");
const btnClear = document.getElementById("clearBtn");
const btnSave = document.getElementById("saveBtn");
const btnExportJSON = document.getElementById("exportJSON");
const btnImportJSON = document.getElementById("importJSON");
const inputJSON = document.getElementById("jsonFileInput");

/* ======================================================
    GRID GENERATOR
====================================================== */

function generateGrid() {
    gridEl.innerHTML = "";
    App.cells = [];

    for (let i = 0; i < App.gridSize * App.gridSize; i++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.dataset.index = i;

        cell.addEventListener("mousedown", paintCell);
        cell.addEventListener("mouseenter", (e) => {
            if (mouseDown) paintCell(e);
        });

        gridEl.appendChild(cell);
        App.cells.push(cell);
    }
}

generateGrid();

/* ======================================================
    DRAWING ENGINE
====================================================== */

let mouseDown = false;
document.body.onmousedown = () => (mouseDown = true);
document.body.onmouseup = () => (mouseDown = false);

function paintCell(e) {
    const cell = e.target;
    const oldColor = cell.style.backgroundColor || "transparent";
    const newColor = App.mode === "brush" ? colorPicker.value : "transparent";

    if (oldColor !== newColor) {
        saveUndoState();
        cell.style.backgroundColor = newColor;
    }
}

/* ======================================================
    UNDO / REDO SYSTEM
====================================================== */

function saveUndoState() {
    const snapshot = App.cells.map((c) => c.style.backgroundColor || null);
    App.undo.push(snapshot);
    App.redo = []; // reset redo stack
}

function loadSnapshot(snapshot) {
    snapshot.forEach((color, i) => {
        App.cells[i].style.backgroundColor = color;
    });
}

function undo() {
    if (App.undo.length === 0) return;
    const current = App.cells.map((c) => c.style.backgroundColor || null);
    App.redo.push(current);

    const prev = App.undo.pop();
    loadSnapshot(prev);
}

function redo() {
    if (App.redo.length === 0) return;
    const current = App.cells.map((c) => c.style.backgroundColor || null);
    App.undo.push(current);

    const next = App.redo.pop();
    loadSnapshot(next);
}

/* ======================================================
    MODE SWITCH
====================================================== */

btnBrush.onclick = () => {
    App.mode = "brush";
};
btnEraser.onclick = () => {
    App.mode = "eraser";
};

/* ======================================================
    CLEAR CANVAS
====================================================== */
btnClear.onclick = () => {
    saveUndoState();
    App.cells.forEach((c) => (c.style.backgroundColor = "transparent"));
};

/* ======================================================
    EXPORT PNG (HD – NO BLUR)
====================================================== */

btnSave.onclick = () => {
    const scale = App.scaleExport;
    const size = App.gridSize;

    const canvas = document.createElement("canvas");
    canvas.width = size * scale;
    canvas.height = size * scale;

    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    App.cells.forEach((cell, i) => {
        const x = (i % size) * scale;
        const y = Math.floor(i / size) * scale;

        ctx.fillStyle = cell.style.backgroundColor || "transparent";
        ctx.fillRect(x, y, scale, scale);
    });

    const link = document.createElement("a");
    link.download = "pixel-art-HD.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
};

/* ======================================================
    EXPORT JSON
====================================================== */

btnExportJSON.onclick = () => {
    const data = {
        gridSize: App.gridSize,
        pixels: App.cells.map((c) => c.style.backgroundColor || null),
    };

    const blob = new Blob([JSON.stringify(data)], {
        type: "application/json",
    });

    const link = document.createElement("a");
    link.download = "pixel-art.json";
    link.href = URL.createObjectURL(blob);
    link.click();
};

/* ======================================================
    IMPORT JSON
====================================================== */

btnImportJSON.onclick = () => inputJSON.click();

inputJSON.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
        const data = JSON.parse(reader.result);

        if (!data.gridSize || !data.pixels) {
            alert("File JSON tidak valid!");
            return;
        }

        App.gridSize = data.gridSize;
        generateGrid();

        data.pixels.forEach((color, i) => {
            if (App.cells[i]) App.cells[i].style.backgroundColor = color;
        });
    };

    reader.readAsText(file);
};

/* ======================================================
    SHORTCUT (optional)
====================================================== */

document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "z") undo();
    if (e.ctrlKey && e.key === "y") redo();
});
