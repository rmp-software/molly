import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

// Single brand app-icon for every mode: dark-mode gold paw on the dark surface
// — matching the dark wordmark (gold #DEB055 on #1A1712). iOS "Add to Home
// Screen" web clips can't switch icons by light/dark, so we ship one look that
// reads as intentional in both. (Originally white-on-gold; iOS dimmed it into a
// gray paw on black under its Dark/Tinted home-screen appearance.)
const BG = "#1A1712";
const PAW = "#DEB055";

// Lucide PawPrint geometry (viewBox 0 0 24 24), stroke-width 2.5, round caps.
const PAW_CIRCLES = [
  { cx: 11, cy: 4 },
  { cx: 18, cy: 8 },
  { cx: 20, cy: 16 },
];
const PAW_PATH =
  "M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z";

function PawSvg({ size }: { size: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={PAW}
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

// A solid tile with the paw centered. `radius` 0 = full-bleed (maskable / apple,
// where the OS applies its own mask).
function tile(sz: number, radius: number) {
  return new ImageResponse(
    (
      <div
        style={{
          width: sz,
          height: sz,
          borderRadius: radius,
          background: BG,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <PawSvg size={Math.round(sz * 0.54)} />
      </div>
    ),
    { width: sz, height: sz }
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ variant: string }> }
) {
  const { variant } = await params;

  switch (variant) {
    case "192":
      return tile(192, Math.round(192 * 0.29));
    case "512":
      return tile(512, Math.round(512 * 0.29));
    case "512-maskable":
      return tile(512, 0);
    // Apple touch icon (180×180, full-bleed — iOS masks to a rounded square).
    case "apple":
      return tile(180, 0);
    default:
      return new Response("Not found", { status: 404 });
  }
}
