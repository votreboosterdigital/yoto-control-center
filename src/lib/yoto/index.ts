import { MockYotoProvider } from './mock-provider'
import { RealYotoProvider } from './real-provider'
import type { YotoProvider } from './provider'

let _provider: YotoProvider | null = null

export function getProvider(): YotoProvider {
  if (_provider) return _provider

  if (process.env.ENABLE_MOCK_PROVIDER === 'true') {
    _provider = new MockYotoProvider()
  } else {
    if (!process.env.YOTO_REFRESH_TOKEN || !process.env.YOTO_ACCESS_TOKEN) {
      throw new Error(
        'YOTO_REFRESH_TOKEN and YOTO_ACCESS_TOKEN are required when ENABLE_MOCK_PROVIDER is not true'
      )
    }
    _provider = new RealYotoProvider({
      refreshToken: process.env.YOTO_REFRESH_TOKEN,
      accessToken: process.env.YOTO_ACCESS_TOKEN,
    })
  }

  return _provider
}

// Pour les tests — reset le singleton
export function resetProvider(): void {
  _provider = null
}
