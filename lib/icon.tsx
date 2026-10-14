import { ImageResponse } from "next/og";

export function generateIcon(sizePx: number, options?: { maskable?: boolean }) {
  const fontSize = options?.maskable ? sizePx * 0.32 : sizePx * 0.42;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2a62d6",
        }}
      >
        <div
          style={{
            fontSize,
            color: "#ffffff",
            fontWeight: 700,
            fontFamily: "sans-serif",
            display: "flex",
          }}
        >
          T
        </div>
      </div>
    ),
    { width: sizePx, height: sizePx },
  );
}
