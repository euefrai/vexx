import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig = {
  // Suas outras configurações (images, etc) entram aqui
  reactStrictMode: true,
};

export default withPWA(nextConfig);