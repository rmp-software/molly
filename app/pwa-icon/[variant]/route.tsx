import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

// Inline SVG for the Lucide PawPrint icon (white, stroke-width 2.5)
// Source: renderToStaticMarkup(<PawPrint color="#ffffff" strokeWidth={2.5} width="100%" height="100%" />)
function PawSvg({ size }: { size: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#ffffff"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="4" r="2" />
      <circle cx="18" cy="8" r="2" />
      <circle cx="20" cy="16" r="2" />
      <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z" />
    </svg>
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ variant: string }> }
) {
  const { variant } = await params;

  if (variant === "192") {
    const sz = 192;
    const iconSz = Math.round(sz * 0.54);
    return new ImageResponse(
      (
        <div
          style={{
            width: sz,
            height: sz,
            borderRadius: Math.round(sz * 0.29),
            background: "#B27A22",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <PawSvg size={iconSz} />
        </div>
      ),
      { width: sz, height: sz }
    );
  }

  if (variant === "512") {
    const sz = 512;
    const iconSz = Math.round(sz * 0.54);
    return new ImageResponse(
      (
        <div
          style={{
            width: sz,
            height: sz,
            borderRadius: Math.round(sz * 0.29),
            background: "#B27A22",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <PawSvg size={iconSz} />
        </div>
      ),
      { width: sz, height: sz }
    );
  }

  if (variant === "512-maskable") {
    // Full-bleed gold square, paw centered within safe zone (~54% of tile)
    const sz = 512;
    const iconSz = Math.round(sz * 0.54);
    return new ImageResponse(
      (
        <div
          style={{
            width: sz,
            height: sz,
            background: "#B27A22",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <PawSvg size={iconSz} />
        </div>
      ),
      { width: sz, height: sz }
    );
  }

  return new Response("Not found", { status: 404 });
}
