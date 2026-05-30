import { PrismaClient, Role, SubscriptionPlan } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.upsert({
    where: { slug: 'demo-org' },
    update: {},
    create: {
      name: 'Demo Organization',
      slug: 'demo-org',
      subscription: {
        create: {
          plan: SubscriptionPlan.STARTER,
          seats: 10,
          monthlyQuota: 500,
        },
      },
    },
  });

  const passwordHash = await bcrypt.hash('DemoPassword123!', 12);

  await prisma.user.upsert({
    where: {
      organizationId_email: {
        organizationId: org.id,
        email: 'admin@demo.local',
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      email: 'admin@demo.local',
      passwordHash,
      firstName: 'Demo',
      lastName: 'Admin',
      role: Role.ADMIN,
      emailVerifiedAt: new Date(),
    },
  });

  console.log('Seed completed:', { organizationId: org.id, email: 'admin@demo.local' });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
