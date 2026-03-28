declare module 'next-pwa' {
  type PWAConfig = {
    dest?: string
    register?: boolean
    skipWaiting?: boolean
    clientsClaim?: boolean
    disable?: boolean
    [key: string]: any
  }

  function withPWA(config: PWAConfig): (config: any) => any
  export default withPWA
}
