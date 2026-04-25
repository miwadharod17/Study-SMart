import { PrismaClient, Role, ProductCategory, ProductCondition, ProductStatus, PostCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Users ────────────────────────────────────────────────────────────────

  const hashedPassword = await bcrypt.hash('Password123!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@studysmart.in' },
    update: {},
    create: {
      email: 'admin@studysmart.in',
      password: hashedPassword,
      name: 'Admin User',
      role: Role.ADMIN,
      isEmailVerified: true,
      verificationStatus: 'VERIFIED',
      college: 'Study Smart HQ',
    },
  });

  const student1 = await prisma.user.upsert({
    where: { email: 'rahul@student.college.edu' },
    update: {},
    create: {
      email: 'rahul@student.college.edu',
      password: hashedPassword,
      name: 'Rahul Sharma',
      role: Role.STUDENT,
      collegeId: 'CS21001',
      college: 'IIT Bombay',
      isEmailVerified: true,
      verificationStatus: 'VERIFIED',
    },
  });

  const student2 = await prisma.user.upsert({
    where: { email: 'priya@student.college.edu' },
    update: {},
    create: {
      email: 'priya@student.college.edu',
      password: hashedPassword,
      name: 'Priya Patel',
      role: Role.STUDENT,
      collegeId: 'CS21042',
      college: 'IIT Bombay',
      isEmailVerified: true,
      verificationStatus: 'VERIFIED',
    },
  });

  const vendor = await prisma.user.upsert({
    where: { email: 'vendor@campusstore.in' },
    update: {},
    create: {
      email: 'vendor@campusstore.in',
      password: hashedPassword,
      name: 'Campus Store',
      role: Role.VENDOR,
      isEmailVerified: true,
      verificationStatus: 'VERIFIED',
      businessName: 'Campus Tech Store',
      businessDescription: 'Official campus electronics and stationery vendor',
      isCollegeVerified: true,
      college: 'IIT Bombay',
    },
  });

  // ── Tags ─────────────────────────────────────────────────────────────────

  const tags = await Promise.all([
    prisma.tag.upsert({ where: { slug: 'data-structures' }, update: {}, create: { name: 'Data Structures', slug: 'data-structures', color: '#3B82F6' } }),
    prisma.tag.upsert({ where: { slug: 'algorithms' }, update: {}, create: { name: 'Algorithms', slug: 'algorithms', color: '#8B5CF6' } }),
    prisma.tag.upsert({ where: { slug: 'machine-learning' }, update: {}, create: { name: 'Machine Learning', slug: 'machine-learning', color: '#10B981' } }),
    prisma.tag.upsert({ where: { slug: 'placement' }, update: {}, create: { name: 'Placement', slug: 'placement', color: '#F59E0B' } }),
    prisma.tag.upsert({ where: { slug: 'semester-5' }, update: {}, create: { name: 'Semester 5', slug: 'semester-5', color: '#EF4444' } }),
  ]);

  // ── Products ─────────────────────────────────────────────────────────────

  await prisma.product.createMany({
    skipDuplicates: true,
    data: [
      {
        title: 'CLRS Algorithms Textbook (4th Edition)',
        description: 'Introduction to Algorithms by Cormen et al. Great condition, minimal highlighting. Perfect for placement prep.',
        price: 450,
        category: ProductCategory.TEXTBOOKS,
        condition: ProductCondition.GOOD,
        status: ProductStatus.ACTIVE,
        images: ['https://placehold.co/400x300?text=CLRS+Book'],
        sellerId: student1.id,
        college: 'IIT Bombay',
        subject: 'Algorithms',
        semester: 5,
      },
      {
        title: 'DS Notes - Complete Handwritten (Sem 3)',
        description: 'Full semester handwritten notes for Data Structures. Covers arrays, linked lists, trees, graphs, hashing. Very neat.',
        price: 120,
        category: ProductCategory.NOTES,
        condition: ProductCondition.LIKE_NEW,
        status: ProductStatus.ACTIVE,
        images: ['https://placehold.co/400x300?text=DS+Notes'],
        sellerId: student2.id,
        college: 'IIT Bombay',
        subject: 'Data Structures',
        semester: 3,
      },
      {
        title: 'Casio FX-991ES Plus Scientific Calculator',
        description: 'Used for 2 semesters, fully functional. All buttons work perfectly. Comes with case.',
        price: 650,
        category: ProductCategory.ELECTRONICS,
        condition: ProductCondition.GOOD,
        status: ProductStatus.ACTIVE,
        images: ['https://placehold.co/400x300?text=Calculator'],
        sellerId: student1.id,
        college: 'IIT Bombay',
      },
      {
        title: 'HP 15s Laptop (i5 11th Gen, 8GB RAM)',
        description: 'Selling after upgrade. No scratches, battery health 85%. Comes with charger and laptop bag.',
        price: 28000,
        category: ProductCategory.ELECTRONICS,
        condition: ProductCondition.LIKE_NEW,
        status: ProductStatus.ACTIVE,
        images: ['https://placehold.co/400x300?text=HP+Laptop'],
        sellerId: vendor.id,
        college: 'IIT Bombay',
      },
    ],
  });

  // ── Forum Posts ───────────────────────────────────────────────────────────

  const post1 = await prisma.forumPost.create({
    data: {
      title: 'Resources for Placement Season 2024 — A Comprehensive Guide',
      content: `Hey everyone! Placement season is approaching and I wanted to compile all the resources that helped me and my seniors crack top product companies.

## DSA Resources
- Striver's SDE Sheet (450 problems)
- LeetCode Top 150
- CLRS for theory

## System Design
- Grokking System Design
- Alex Xu's System Design Interview book

## CS Fundamentals
- Operating Systems: Galvin
- DBMS: Navathe
- CN: Forouzan

All the best everyone! Feel free to ask questions below. 🚀`,
      category: PostCategory.CAREER,
      authorId: student1.id,
      college: 'IIT Bombay',
      isPinned: true,
      likeCount: 42,
      viewCount: 380,
    },
  });

  await prisma.forumPost.create({
    data: {
      title: 'Semester 5 timetable released — clash in OS and CN?',
      content: 'Has anyone else noticed that Operating Systems lab and Computer Networks lecture are clashing on Wednesday 2-4 PM? Please raise this with the department if you are affected.',
      category: PostCategory.ACADEMIC,
      authorId: student2.id,
      college: 'IIT Bombay',
      likeCount: 18,
      commentCount: 7,
      viewCount: 124,
    },
  });

  // Add tags to post
  await prisma.postTag.createMany({
    skipDuplicates: true,
    data: [
      { postId: post1.id, tagId: tags[3].id }, // placement
      { postId: post1.id, tagId: tags[1].id }, // algorithms
    ],
  });

  // ── Comments ─────────────────────────────────────────────────────────────

  await prisma.forumComment.create({
    data: {
      postId: post1.id,
      content: 'Thank you so much for this! Adding NeetCode blind 75 to the DSA list — it really helps focus on patterns rather than just grinding problems.',
      authorId: student2.id,
    },
  });

  console.log('✅ Seeding complete!');
  console.log('');
  console.log('📧 Test accounts:');
  console.log('   Admin:   admin@studysmart.in / Password123!');
  console.log('   Student: rahul@student.college.edu / Password123!');
  console.log('   Vendor:  vendor@campusstore.in / Password123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
