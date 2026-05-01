import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function check() {
  try {
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    // Попробуем создать временную запись (проверка прав)
    const user = await prisma.user.create({
      data: {
        email: 'check@example.com',
        password: 'temp',
        fullName: 'Check'
      }
    })
    console.log('✅ Create test user:', user.id)
    await prisma.user.delete({ where: { id: user.id } })
    console.log('✅ Test user deleted')
  } catch (e) {
    console.error('❌ Error:', e)
  } finally {
    await prisma.$disconnect()
  }
}
check()
