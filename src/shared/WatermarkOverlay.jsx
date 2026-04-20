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
  // Grid repetido — usamos <span>s em um flex wrap para ficar performático
  // (sem depender de SVG de fundo, facilitando leitura em qualquer zoom).
  const opacity = isDark ? 0.075 : 0.09;
  const color = isDark ? "#ffffff" : "#000000";

  const tile = (
    <span
      style={{
        fontFamily: font,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color,
        whiteSpace: "nowrap",
        padding: "8px 16px",
      }}
    >
      {text}
    </span>
  );

  // Linhas deslocadas para dar aspecto de grid denso.
  const rows = [];
  for (let i = 0; i < 24; i++) {
    const offset = (i % 2 === 0 ? 0 : 120) - 60;
    rows.push(
      <div
        key={i}
        style={{
          display: "flex",
          transform: `translateX(${offset}px)`,
          gap: 40,
          marginBottom: 12,
        }}
      >
        {Array.from({ length: 8 }, (_, j) => (
          <React.Fragment key={j}>{tile}</React.Fragment>
        ))}
      </div>
    );
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
        transform: "rotate(-28deg)",
        transformOrigin: "center center",
        mixBlendMode: isDark ? "screen" : "multiply",
      }}
    >
      <style>{`
        @media print {
          [data-testid="confidential-watermark"] { opacity: 0.18 !important; }
        }
      `}</style>
      <div
        style={{
          position: "absolute",
          top: "-20%",
          left: "-20%",
          width: "140%",
          height: "140%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        {rows}
      </div>
    </div>
  );
}
