import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Pre-computed from lucide-react PawPrint, color="#ffffff", strokeWidth=2.5
// Generated via: renderToStaticMarkup(<PawPrint color="#ffffff" strokeWidth={2.5} width="100%" height="100%" />)
const PAW_DATA_URI =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjIuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS1wYXctcHJpbnQiIGFyaWEtaGlkZGVuPSJ0cnVlIj48Y2lyY2xlIGN4PSIxMSIgY3k9IjQiIHI9IjIiPjwvY2lyY2xlPjxjaXJjbGUgY3g9IjE4IiBjeT0iOCIgcj0iMiI+PC9jaXJjbGU+PGNpcmNsZSBjeD0iMjAiIGN5PSIxNiIgcj0iMiI+PC9jaXJjbGU+PHBhdGggZD0iTTkgMTBhNSA1IDAgMCAxIDUgNXYzLjVhMy41IDMuNSAwIDAgMS02Ljg0IDEuMDQ1UTYuNTIgMTcuNDggNC40NiAxNi44NEEzLjUgMy41IDAgMCAxIDUuNSAxMFoiPjwvcGF0aD48L3N2Zz4=";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: "#B27A22",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Full-bleed gold square — iOS masks to rounded square automatically */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={PAW_DATA_URI} width={99} height={99} alt="paw" />
      </div>
    ),
    { ...size }
  );
}
