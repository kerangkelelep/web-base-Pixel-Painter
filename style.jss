:root {
  --bg: #0f1724;
  --panel: #0b1220;
  --muted: #94a3b8;
  --accent: #06b6d4;
  --cell-size: 20px;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background: #071124;
  color: #e6eef8;
  font-family: Arial, sans-serif;
  padding: 20px;
  display: flex;
  justify-content: center;
}

.app {
  display: flex;
  gap: 18px;
  width: 1100px;
}

.panel {
  width: 300px;
  background: rgba(255,255,255,0.03);
  padding: 18px;
  border-radius: 12px;
}

.section {
  margin-top: 16px;
}

.info {
  font-size: 13px;
  color: var(--muted);
  margin-bottom: 4px;
}

.btn {
  padding: 8px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  color: var(--muted);
  width: 100%;
  margin-top: 6px;
  border-radius: 6px;
  cursor: pointer;
}

.btn.primary {
  background: var(--accent);
  color: #042027;
  border: none;
}

.canvas-wrap {
  flex: 1;
}

.canvas-area {
  background: rgba(255,255,255,0.04);
  padding: 12px;
  border-radius: 10px;
  max-height: 80vh;
  overflow: auto;
}

.grid {
  display: grid;
  gap: 1px;
  background: rgba(255,255,255,0.05);
}

.cell {
  width: var(--cell-size);
  height: var(--cell-size);
  background: transparent;
}

.color-preview {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  border: 1px solid #333;
  margin-top: 6px;
}
