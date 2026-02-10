
module.exports = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
}
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" }, // quick allow all (internal tool)
      // Better: exact domains like cdn.pixabay.com etc.
    ],
  },
};

module.exports = nextConfig;
