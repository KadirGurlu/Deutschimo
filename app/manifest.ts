import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Deutschimo",
    short_name: "Deutschimo",
    description: "Almanca öğrenme platformu",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#13b9c8",
    orientation: "any",
    icons: [
      { src: "/deutschimo-logo-192.png", sizes: "192x192", type: "image/png" },
      { src: "/deutschimo-logo.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
