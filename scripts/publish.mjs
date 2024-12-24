import { getOtp } from '@continuous-auth/client'
import path from 'path'
import { execa } from 'execa'

async function publish() {
  const projectRoot = path.resolve(import.meta.dirname, '..')

  console.log('Getting OTP code')

  const otp = await getOtp()

  console.log('OTP code get, continuing...')

  const result = execa('pnpm', ['publish', '--otp', otp], {
    cwd: projectRoot,
    env: process.env,
  })
  result.stdout.pipe(process.stdout, { end: false })
  result.stderr.pipe(process.stderr, { end: false })
  await result
}

publish().catch(error => {
  process.exit(1)
})
