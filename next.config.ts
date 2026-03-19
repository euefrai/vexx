import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  clientsClaim: true,
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removido 'turbo' e 'eslint' da raiz para evitar erros de chaves inválidas
  typescript: { 
    ignoreBuildErrors: true 
  },
  eslint: { 
    ignoreDuringBuilds: true 
  },
  // Se precisar de chaves experimentais, elas devem ser suportadas pela sua versão atual
  experimental: {
    // Removido o bloco 'turbo' que causava erro no seu log
  },
};

export default withPWA(nextConfig);