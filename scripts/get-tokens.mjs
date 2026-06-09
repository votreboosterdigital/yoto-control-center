import { YotoClient } from 'yoto-nodejs-client'
import { DEFAULT_CLIENT_ID } from 'yoto-nodejs-client/lib/api-endpoints/constants.js'

const clientId = process.argv[2] || DEFAULT_CLIENT_ID

console.log('\n🔐 Authentification Yoto — Device Flow\n')
console.log(`Client ID : ${clientId}\n`)

try {
  const deviceAuth = await YotoClient.requestDeviceCode({ clientId })

  console.log('1️⃣  Va sur cette URL dans ton navigateur :')
  console.log(`\n   ${deviceAuth.verification_uri_complete || deviceAuth.verification_uri}\n`)

  if (!deviceAuth.verification_uri_complete) {
    console.log(`   Code à entrer : ${deviceAuth.user_code}\n`)
  }

  const expiresMin = Math.round(deviceAuth.expires_in / 60)
  console.log(`   (expire dans ${expiresMin} min, polling toutes les ${deviceAuth.interval}s)\n`)
  console.log('⏳ En attente...\n')

  const tokens = await YotoClient.waitForDeviceAuthorization({
    deviceCode: deviceAuth.device_code,
    clientId,
    initialInterval: deviceAuth.interval * 1000,
    expiresIn: deviceAuth.expires_in,
    onPoll: (result) => {
      if (result.status === 'pending') process.stdout.write('.')
      if (result.status === 'slow_down') process.stdout.write('s')
    }
  })

  console.log('\n\n✅ Tokens obtenus — colle ça dans .env.local :\n')
  console.log(`YOTO_CLIENT_ID=${clientId}`)
  console.log(`YOTO_ACCESS_TOKEN=${tokens.access_token}`)
  console.log(`YOTO_REFRESH_TOKEN=${tokens.refresh_token}`)
  console.log('\nEnsuite : relancer le serveur avec ENABLE_MOCK_PROVIDER=false\n')
} catch (err) {
  console.error('\n❌ Erreur :', err.message)
  if (err.message === 'Device code has expired') {
    console.error('   Relance le script et complète l\'auth dans le délai imparti.')
  }
  process.exit(1)
}
