import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Getaway — What should you do with your free time?",
    short_name: "Getaway",
    description:
      "Getaway turns your free time into real plans: tell it how you feel and how much time you have, get a decision — not a directory.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0A0E0C",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
