// ═══════════════════════════════════════════════
// WATERMARK OVERLAY
// Marca d'água de confidencialidade fixa em todas as telas autenticadas.
// ═══════════════════════════════════════════════
import React from "react";
import { font } from "./design";

const ORG = "BFSA · Análise de Desempenho";

export default function WatermarkOverlay({ user, isDark = true }) {
  if (!user) return null;
  const text = `CONFIDENCIAL · ${ORG} · ${user}`;
  const opacity = isDark ? 0.005 : 0.008;
  const color = isDark ? "#ffffff" : "#000000";

  // Grade esparsa — tiles bem espaçados pra identificar a marca sem
  // atrapalhar a leitura do conteúdo. Usamos CSS grid com células fixas.
  const CELL_W = 960;
  const CELL_H = 420;
  const COLS = 2;
  const ROWS = 4;

  const cells = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const offsetX = (r % 2) * (CELL_W / 2);
      cells.push(
        <div
          key={`${r}-${c}`}
          style={{
            width: CELL_W,
            height: CELL_H,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `translateX(${offsetX}px)`,
          }}
        >
          <span
            style={{
              fontFamily: font,
              fontSize: 9,
              fontWeight: 400,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color,
              whiteSpace: "nowrap",
            }}
          >
            {text}
          </span>
        </div>
      );
    }
  }

  return (
    <div
      aria-hidden="true"
      data-testid="confidential-watermark"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        pointerEvents: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
        opacity,
        overflow: "hidden",
      }}
    >
      <style>{`
        @media print {
          [data-testid="confidential-watermark"] { opacity: 0.2 !important; }
        }
      `}</style>
      <div
        style={{
          position: "absolute",
          top: "-30%",
          left: "-30%",
          width: "160%",
          height: "160%",
          display: "grid",
          gridTemplateColumns: `repeat(${COLS}, ${CELL_W}px)`,
          gridAutoRows: `${CELL_H}px`,
          transform: "rotate(-24deg)",
          transformOrigin: "center center",
        }}
      >
        {cells}
      </div>
    </div>
  );
}
