import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    qualities: [25, 50, 75, 100],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.suicaodex.com",
        port: "",
        pathname: "/covers/**",
        search: "",
      },
      {
        protocol: "https",
        hostname: "api2.suicaodex.com",
        port: "",
        pathname: "/covers/**",
        search: "",
      },
      {
        protocol: "https",
        hostname: "clf.suicaodex.com",
        port: "",
        pathname: "/covers/**",
        search: "",
      },
    ],
  },
};

export default nextConfig;
