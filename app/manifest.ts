import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Molly",
    short_name: "Molly",
    description: "Gestão da epilepsia da Molly",
    start_url: "/",
    display: "standalone",
    background_color: "#F7F3EC",
    theme_color: "#B27A22",
    lang: "pt-BR",
    icons: [
      // SVG leads: it carries an embedded prefers-color-scheme media query, so
      // Android/desktop installs render the dark variant (gold on #1A1712) when
      // installed in dark mode. PNGs follow as fallback for engines that skip
      // SVG manifest icons.
      {
        src: "/pwa-icon/svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/pwa-icon/192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-icon/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-icon/svg-maskable",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
      {
        src: "/pwa-icon/512-maskable",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
