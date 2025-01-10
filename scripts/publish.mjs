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

  const r1 = execa('npm', ['publish', '--registry', 'https://registry.npmjs.org', '--userconfig', npmrcPath, '--otp', otp], {
    cwd: projectRoot,
    env: process.env,
  })
  r1.stdout.pipe(process.stdout, { end: false })
  r1.stderr.pipe(process.stderr, { end: false })
  await r1

  // wait for 300 seconds to make sure otp is expired
  await new Promise(resolve => setTimeout(resolve, 300000))

  // try to publish another package with same otp
  const packageJsonPath = path.resolve(projectRoot, 'package.json')
  const packageJson = await fs.readFile(packageJsonPath, 'utf-8')
  const packageJsonObj = JSON.parse(packageJson)
  packageJsonObj.name = '@zjk-dev/cfa-test-2'
  await fs.writeFile(packageJsonPath, JSON.stringify(packageJsonObj, null, 2), 'utf-8')
  const r2 = execa('npm', ['publish', '--registry', 'https://registry.npmjs.org', '--userconfig', npmrcPath, '--otp', otp], {
    cwd: projectRoot,
    env: process.env,
  })
  r2.stdout.pipe(process.stdout, { end: false })
  r2.stderr.pipe(process.stderr, { end: false })
  await r2
}

publish().catch(error => {
  process.exit(1)
})
