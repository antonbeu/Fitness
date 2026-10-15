export type Pt = [number, number];

/** Glatte Kurve durch die Punkte (monotone kubische Interpolation, kein Überschwingen). */
export function smoothPath(pts: Pt[]): string {
  const n = pts.length;
  if (n === 0) return "";
  const f = (v: number) => v.toFixed(1);
  if (n === 1) return `M${f(pts[0][0])},${f(pts[0][1])}`;
  if (n === 2) return `M${f(pts[0][0])},${f(pts[0][1])} L${f(pts[1][0])},${f(pts[1][1])}`;

  const dx: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(pts[i + 1][0] - pts[i][0]);
    m.push(dx[i] === 0 ? 0 : (pts[i + 1][1] - pts[i][1]) / dx[i]);
  }
  const t: number[] = new Array(n);
  t[0] = m[0];
  t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (m[i - 1] * m[i] <= 0) t[i] = 0;
    else {
      t[i] =
        (3 * (dx[i - 1] + dx[i])) /
        ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i]);
    }
  }

  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const h = (x1 - x0) / 3;
    d += ` C${f(x0 + h)},${f(y0 + h * t[i])} ${f(x1 - h)},${f(y1 - h * t[i + 1])} ${f(x1)},${f(y1)}`;
  }
  return d;
}

/** Fläche unter der Kurve bis zur Grundlinie. */
export function areaPath(pts: Pt[], baseline: number) {
  if (pts.length < 2) return "";
  const line = smoothPath(pts);
  const [lastX] = pts[pts.length - 1];
  const [firstX] = pts[0];
  return `${line} L${lastX.toFixed(1)},${baseline} L${firstX.toFixed(1)},${baseline} Z`;
}
