import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
};

// const withPWA = require("@ducanh2912/next-pwa").default({
//   dest: "public",
//   disable: process.env.NODE_ENV === "development",
// });

export default nextConfig; // withPWA(nextConfig);
