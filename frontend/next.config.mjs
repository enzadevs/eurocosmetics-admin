/** @type {import('next').NextConfig} */
const nextConfig = {
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
  basePath: "/admin",
};

export default nextConfig;
