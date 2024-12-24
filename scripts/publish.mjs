import cfaClient from '@continuous-auth/client'
import path from 'path'
import { execa } from 'execa'

async function publish() {
  const projectRoot = path.resolve(import.meta.dirname, '..')

  console.log('Getting OTP code')

  const otp = await cfaClient.getOtp()

  console.log('OTP code get, continuing...')

  const result = execa('npm', ['publish', '--otp', otp], {
    cwd: projectRoot,
    env: process.env,
    preferLocal: true,
  })
  result.stdout.pipe(process.stdout, { end: false })
  result.stderr.pipe(process.stderr, { end: false })
  await result
}

publish().catch(error => {
  console.error(error)
  process.exit(1)
})
