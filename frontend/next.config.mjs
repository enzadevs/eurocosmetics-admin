/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: "/admin",
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8123",
      },
      {
        protocol: "https",
        hostname: "eurocos.alemtilsimat.com",
        port: "",
      },
    ],
  },
};

export default nextConfig;
