import { importBangs, fetchAllBangs } from './db-service'
import baseBangs from '../../kabang-collections/base.json'

async function seed() {
  console.log('🌱 Checking database...')
  
  try {
    // Check if database already has bangs
    const existingBangs = await fetchAllBangs()
    
    if (existingBangs.length > 0) {
      console.log(`⏭️  Database already populated with ${existingBangs.length} bangs. Skipping seed.`)
      process.exit(0)
    }
    
    console.log('🌱 Seeding database with base collection...')
    const result = await importBangs(baseBangs)
    
    console.log(`✅ Seeding complete!`)
    console.log(`   Imported: ${result.imported} bangs`)
    
    if (result.errors.length > 0) {
      console.log(`   Errors: ${result.errors.length}`)
      result.errors.forEach(err => console.log(`   - ${err}`))
    }
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  }
  
  process.exit(0)
}

seed()
