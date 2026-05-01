import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  console.log('Connecting...')
  await prisma.$connect()
  console.log('Connected!')
  const user = await prisma.user.create({
    data: {
      email: 'test' + Date.now() + '@example.com',
      password: 'test',
      fullName: 'Test User'
    }
  })
  console.log('Created user:', user.id)
  await prisma.user.delete({ where: { id: user.id } })
  console.log('Deleted')
}
main().catch(console.error).finally(() => prisma.$disconnect())
