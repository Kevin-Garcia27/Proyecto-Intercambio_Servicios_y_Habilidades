// Componente de gráfica de barras estilo pixel art con SVG
// props: data = [{ label, value, fill, highlight }], title?: string
function PixelBarChart({ data, title = 'Estadísticas' }) {
  const width = 320;
  const height = 200;
  const chartX = 8;
  const chartY = 12;
  const chartW = width - chartX * 2;
  const chartH = height - chartY * 2 - 8;
  const baseY = 156; // línea base del eje X (coincide con ejemplo)
  const maxValue = Math.max(...data.map(d => d.value), 1);

  // Medidas barra
  const groupOffsets = [48, 128, 208];
  const barW = 44;
  const capH = 4; // tapa clara superior

  const gridYs = [152, 122, 92, 62, 32];

  return (
    <div className="pixel-chart-wrapper">
      <svg viewBox={`0 0 ${width} ${height}`} className="pixel-chart" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Gráfica de barras">
        {/* Fondo y marco */}
        <rect x="0" y="0" width={width} height={height} fill="#161b22" />
        <rect x={chartX} y={chartY} width={chartW} height={chartH} fill="#0f141b" stroke="#2d3748" strokeWidth="2" shapeRendering="crispEdges" />

        {/* Grid horizontal */}
        <g stroke="#1f2937" strokeWidth="1" shapeRendering="crispEdges">
          {gridYs.map((gy) => (
            <line key={gy} x1={16} y1={gy} x2={304} y2={gy} />
          ))}
        </g>

        {/* Ejes */}
        <line x1="16" y1="156" x2="304" y2="156" stroke="#94a3b8" strokeWidth="2" shapeRendering="crispEdges" />
        <line x1="16" y1="20" x2="16" y2="156" stroke="#94a3b8" strokeWidth="2" shapeRendering="crispEdges" />

        {/* Barras */}
        {data.slice(0, 3).map((d, i) => {
          const h = Math.round((d.value / maxValue) * 120);
          const y = baseY - h;
          const x = groupOffsets[i] ?? 48 + i * 80;
          const capY = y - capH;
          const capFill = d.highlight || lighten(d.fill, 0.35);
          return (
            <g key={d.label} transform={`translate(${x},0)`}>
              <rect x="0" y={y} width={barW} height={h} fill={d.fill} stroke="#2e261f" strokeWidth="1" shapeRendering="crispEdges" />
              <rect x="0" y={capY} width={barW} height={capH} fill={capFill} shapeRendering="crispEdges" />
              <text x={barW / 2} y={172} textAnchor="middle" className="bar-label">{d.label}</text>
            </g>
          );
        })}

        {/* Título */}
        <text x="160" y="30" textAnchor="middle" className="chart-title">{title}</text>
      </svg>
    </div>
  );
}

// Utilidad para aclarar color hex (simple)
function lighten(hex, amount = 0.3) {
  try {
    const c = hex.replace('#', '');
    const num = parseInt(c, 16);
    let r = (num >> 16) & 0xff;
    let g = (num >> 8) & 0xff;
    let b = num & 0xff;
    r = Math.min(255, Math.round(r + (255 - r) * amount));
    g = Math.min(255, Math.round(g + (255 - g) * amount));
    b = Math.min(255, Math.round(b + (255 - b) * amount));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  } catch {
    return hex;
  }
}

window.PixelBarChart = PixelBarChart;