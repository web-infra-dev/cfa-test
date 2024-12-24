import { getOtp } from '@continuous-auth/client'
import fs from 'fs/promises'
import path from 'path'
import { execa } from 'execa'

async function publish() {
  const projectRoot = path.resolve(import.meta.dirname, '..')
  const npmrcPath = path.resolve(projectRoot, '.npmrc')

  if (process.env.NPM_TOKEN) {
    // The npm token (Classic - Publish token) is used for identifying the user, not for publishing.
    await fs.writeFile(
      npmrcPath,
      `//registry.npmjs.org/:_authToken = ${process.env.NPM_TOKEN}`,
      'utf-8'
    );
    console.log(`Wrote NPM_TOKEN to ${npmrcPath}`);
  } else {
    throw new Error('NPM_TOKEN is not set')
  }

  console.log('Getting OTP code')

  const otp = await getOtp()

  console.log('OTP code get, continuing...')

  const result = execa('npm', ['publish', '--registry', 'https://registry.npmjs.org', '--userconfig', npmrcPath, '--otp', otp], {
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
