import { YotoClient } from 'yoto-nodejs-client'
import fs from 'fs'

const env = fs.readFileSync('.env.local', 'utf8')
const get = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.replace(/^"|"$/g, '') ?? ''

const client = new YotoClient({
  clientId: get('YOTO_CLIENT_ID'),
  refreshToken: get('YOTO_REFRESH_TOKEN'),
  accessToken: get('YOTO_ACCESS_TOKEN'),
  onTokenRefresh: () => {}
})

const { devices } = await client.getDevices()
for (const d of devices) {
  console.log(`\nDevice: ${d.deviceId} — ${d.name}`)
  try {
    const status = await client.getDeviceStatus({ deviceId: d.deviceId })
    console.log(JSON.stringify(status, null, 2))
  } catch(e) { console.log('Status error:', e.message) }
}
