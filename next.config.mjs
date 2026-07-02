/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      // "Mapa de tendencias" fue reemplazado por la Biblioteca de links.
      { source: "/tendencias", destination: "/biblioteca", permanent: true },
    ];
  },
};

export default nextConfig;
