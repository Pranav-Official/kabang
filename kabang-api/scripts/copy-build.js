import { cp } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const uiDist = join(__dirname, '../../kabang-ui/dist')
const apiPublic = join(__dirname, '../public/ui-build')

async function copy() {
  await cp(uiDist, apiPublic, { recursive: true })
  console.log('Build copied to public/ui-build')
}

copy().catch(console.error)
