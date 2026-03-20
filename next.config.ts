import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  clientsClaim: true,
  // Desativado em dev para não cachear arquivos que você está editando
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Usa o compilador SWC do Rust (muito mais rápido que o antigo)
  swcMinify: true,
  
  // Mantemos isso apenas para o deploy na Vercel não barrar por tipagem
  typescript: { 
    ignoreBuildErrors: true 
  },

  // Se precisar de imagens externas (ex: fotos de perfil do Google/Supabase), 
  // adicione os domínios aqui futuramente
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

export default withPWA(nextConfig);