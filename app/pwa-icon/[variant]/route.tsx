import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

// Brand colors (mirrors the light/dark tokens in app/globals.css).
// Light: white paw on brand gold. Dark: dark-mode gold paw on the dark surface
// — matching the dark wordmark (gold #DEB055 on #1A1712).
const LIGHT = { bg: "#B27A22", paw: "#ffffff" };
const DARK = { bg: "#1A1712", paw: "#DEB055" };

// Lucide PawPrint geometry (viewBox 0 0 24 24), stroke-width 2.5, round caps/joins.
const PAW_CIRCLES = [
  { cx: 11, cy: 4 },
  { cx: 18, cy: 8 },
  { cx: 20, cy: 16 },
];
const PAW_PATH =
  "M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z";

function PawSvg({ size, color }: { size: number; color: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {PAW_CIRCLES.map((c) => (
        <circle key={`${c.cx}-${c.cy}`} cx={c.cx} cy={c.cy} r="2" />
      ))}
      <path d={PAW_PATH} />
    </svg>
  );
}

// A solid square tile with the paw centered. `radius` 0 = full-bleed (maskable
// / apple, where the OS applies its own mask).
function tile({
  sz,
  radius,
  bg,
  paw,
}: {
  sz: number;
  radius: number;
  bg: string;
  paw: string;
}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: sz,
          height: sz,
          borderRadius: radius,
          background: bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <PawSvg size={Math.round(sz * 0.54)} color={paw} />
      </div>
    ),
    { width: sz, height: sz }
  );
}

// Scheme-adaptive SVG for the web manifest. Manifest PNG icons can't be
// switched by color scheme, but an SVG with an embedded prefers-color-scheme
// media query adapts at install time (Android/desktop). `rounded` bakes the
// ~29% corner radius for the "any" purpose; maskable stays full-bleed.
function adaptiveSvg(rounded: boolean) {
  const SZ = 512;
  const rx = rounded ? Math.round(SZ * 0.29) : 0;
  const pawSz = Math.round(SZ * 0.54);
  const offset = (SZ - pawSz) / 2;
  const scale = pawSz / 24;
  const circles = PAW_CIRCLES.map(
    (c) => `<circle cx="${c.cx}" cy="${c.cy}" r="2" />`
  ).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SZ}" height="${SZ}" viewBox="0 0 ${SZ} ${SZ}">
  <style>
    .bg { fill: ${LIGHT.bg}; }
    .paw { stroke: ${LIGHT.paw}; }
    @media (prefers-color-scheme: dark) {
      .bg { fill: ${DARK.bg}; }
      .paw { stroke: ${DARK.paw}; }
    }
  </style>
  <rect class="bg" width="${SZ}" height="${SZ}" rx="${rx}" />
  <g class="paw" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" transform="translate(${offset} ${offset}) scale(${scale})">
    ${circles}
    <path d="${PAW_PATH}" />
  </g>
</svg>`;
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ variant: string }> }
) {
  const { variant } = await params;

  switch (variant) {
    // Light PNGs (manifest "any" purpose + fallback).
    case "192":
      return tile({ sz: 192, radius: Math.round(192 * 0.29), ...LIGHT });
    case "512":
      return tile({ sz: 512, radius: Math.round(512 * 0.29), ...LIGHT });
    case "512-maskable":
      return tile({ sz: 512, radius: 0, ...LIGHT });

    // Apple touch icons (180×180, full-bleed — iOS masks to a rounded square).
    // Selected by prefers-color-scheme via <link media> in app/layout.tsx.
    case "apple":
      return tile({ sz: 180, radius: 0, ...LIGHT });
    case "apple-dark":
      return tile({ sz: 180, radius: 0, ...DARK });

    // Scheme-adaptive SVGs (manifest primary — Android/desktop dark mode).
    case "svg":
      return adaptiveSvg(true);
    case "svg-maskable":
      return adaptiveSvg(false);

    default:
      return new Response("Not found", { status: 404 });
  }
}
