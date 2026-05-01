import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Attempting to connect...')
  await prisma.$connect()
  console.log('Connected to database!')

  // Попробуем создать запись в User
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      password: 'test',
      fullName: 'Test User'
    }
  })
  console.log('Created user:', user)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
