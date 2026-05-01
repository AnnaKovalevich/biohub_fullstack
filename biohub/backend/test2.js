import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://biohub:biohub@localhost:5432/biohub?schema=public"
    }
  }
})

async function main() {
  console.log('Attempting to connect...')
  await prisma.$connect()
  console.log('Connected to database!')
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      password: 'test',
      fullName: 'Test User'
    }
  })
  console.log('Created user:', user)
  await prisma.user.delete({ where: { email: 'test@example.com' } })
  console.log('Test user deleted')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
