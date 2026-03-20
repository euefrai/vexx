import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  clientsClaim: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig = {
  // Removidas as chaves 'eslint' e 'turbo' que causavam o erro de 'Unrecognized key'
  typescript: { 
    ignoreBuildErrors: true 
  },
  experimental: {
    // Mantido vazio para evitar conflitos na versão 16
  },
};

export default withPWA(nextConfig);