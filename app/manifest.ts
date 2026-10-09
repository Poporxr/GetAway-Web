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
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
