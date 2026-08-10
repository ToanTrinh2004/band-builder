const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const { PrismaPg } = require('@prisma/adapter-pg');
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Đặt 4 file JSON trong thư mục con "seed-data" cùng cấp với script:
// listening.json, reading.json, writing.json, speaking.json
const DATA_DIR = path.join(__dirname, 'seed-data');

function loadJson(filename) {
  const filePath = path.join(DATA_DIR, filename);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

async function main() {
  // 1. SkillType — upsert theo name để chạy lại không tạo trùng
  const skillTypeNames = ['Listening', 'Reading', 'Writing', 'Speaking'];
  const skillTypes = {};

  for (const name of skillTypeNames) {
    const st = await prisma.skillType.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    skillTypes[name] = st.id;
  }

  // 2. Đọc dữ liệu thật từ file JSON
  const listeningJson = loadJson('listening.json');
  const readingJson = loadJson('reading.json');
  const writingJson = loadJson('writing.json'); // wt1.json — có cả task1 + task2
  const speakingJson = loadJson('speaking.json');

  // 3. SkillContent
  const listeningContent = await prisma.skillContent.create({
    data: {
      skillTypeId: skillTypes['Listening'],
      source: 'Cambridge IELTS 1 - Practice Test 1',
      audioUrl: null,
      contentJson: listeningJson,
    },
  });

  const readingContent = await prisma.skillContent.create({
    data: {
      skillTypeId: skillTypes['Reading'],
      source: 'Cambridge IELTS 1 - Practice Test 1',
      contentJson: readingJson,
    },
  });

  const writingContent = await prisma.skillContent.create({
    data: {
      skillTypeId: skillTypes['Writing'],
      source: 'Cambridge IELTS 1 - Practice Test 1',
      contentJson: writingJson,
    },
  });

  const speakingContent = await prisma.skillContent.create({
    data: {
      skillTypeId: skillTypes['Speaking'],
      source: 'Cambridge IELTS 1 - Practice Test 1',
      contentJson: speakingJson,
    },
  });

  // 4. SkillTest
  const listeningTest = await prisma.skillTest.create({
    data: { skillContentId: listeningContent.id, skillTypeId: skillTypes['Listening'] },
  });
  const readingTest = await prisma.skillTest.create({
    data: { skillContentId: readingContent.id, skillTypeId: skillTypes['Reading'] },
  });
  const writingTest = await prisma.skillTest.create({
    data: { skillContentId: writingContent.id, skillTypeId: skillTypes['Writing'] },
  });
  const speakingTest = await prisma.skillTest.create({
    data: { skillContentId: speakingContent.id, skillTypeId: skillTypes['Speaking'] },
  });

  // 5. PracticeTest
  const practiceTest = await prisma.practiceTest.create({
    data: { title: 'Cambridge IELTS 1 - Practice Test 1' },
  });

  // 6. PracticeTestSkill
  await prisma.practiceTestSkill.createMany({
    data: [
      { practiceTestId: practiceTest.id, skillTestId: listeningTest.id },
      { practiceTestId: practiceTest.id, skillTestId: readingTest.id },
      { practiceTestId: practiceTest.id, skillTestId: writingTest.id },
      { practiceTestId: practiceTest.id, skillTestId: speakingTest.id },
    ],
  });

  console.log('Seeded practice test:', practiceTest.id);
  console.log({
    listeningTest: listeningTest.id,
    readingTest: readingTest.id,
    writingTest: writingTest.id,
    speakingTest: speakingTest.id,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });