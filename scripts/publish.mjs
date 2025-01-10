import { getOtp } from '@continuous-auth/client'
import fs from 'fs/promises'
import path from 'path'
import { execa } from 'execa'

async function publish() {
  const projectRoot = path.resolve(import.meta.dirname, '..')
  const npmrcPath = path.resolve(projectRoot, '.npmrc')

  const doPublish = async (otp, name) => {
    if (name) {
      const packageJsonPath = path.resolve(projectRoot, 'package.json')
      const packageJson = await fs.readFile(packageJsonPath, 'utf-8')
      const packageJsonObj = JSON.parse(packageJson)
      packageJsonObj.name = name
      await fs.writeFile(
        packageJsonPath,
        JSON.stringify(packageJsonObj, null, 2),
        'utf-8'
      )
    }
    const result = execa(
      'npm',
      [
        'publish',
        '--registry', 'https://registry.npmjs.org',
        '--userconfig', npmrcPath,
        '--otp', otp,
        '--access', 'public',
      ],
      {
        cwd: projectRoot,
        env: process.env,
      }
    )
    result.stdout.pipe(process.stdout, { end: false })
    result.stderr.pipe(process.stderr, { end: false })
    await result
  }

  if (process.env.NPM_TOKEN) {
    // The npm token (Classic - Publish token) is used for identifying the user, not for publishing.
    await fs.writeFile(
      npmrcPath,
      `//registry.npmjs.org/:_authToken = ${process.env.NPM_TOKEN}`,
      'utf-8'
    )
    console.log(`Wrote NPM_TOKEN to ${npmrcPath}`)
  } else {
    throw new Error('NPM_TOKEN is not set')
  }

  console.log('Getting OTP code')

  let otp = await getOtp()

  console.log('OTP code get, continuing...')

  console.log('Publishing package @zjk-dev/cfa-test')
  await doPublish(otp)

  // wait for 30 seconds
  await new Promise((resolve) => setTimeout(resolve, 30000))

  // publish 10 packages with the same OTP
  for (let i = 1; i <= 10;) {
    const name = `@zjk-dev/cfa-test-${i}`
    console.log(`Publishing package ${name}`)
    try {
      await doPublish(otp, name)
      i++;
    } catch (error) {
      if (error.message.includes('npm error code EOTP')) {
        console.log('OTP expired, getting new OTP')
        otp = await getOtp()
      } else {
        throw error
      }
    }
  }
}

publish().catch((error) => {
  process.exit(1)
})
