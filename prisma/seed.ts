import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // ============================================================
  // 1. SKILL TYPES
  // ============================================================
  await prisma.skillType.createMany({
    data: [
      { id: 1, name: 'Listening' },
      { id: 2, name: 'Reading' },
      { id: 3, name: 'Writing' },
      { id: 4, name: 'Speaking' },
    ],
    skipDuplicates: true,
  });
  console.log('✅ SkillTypes seeded');

  // ============================================================
  // 2. PRACTICE TESTS
  // ============================================================
  await prisma.practiceTest.createMany({
    data: [
      {
        id: 'pt-cambridge-1',
        title: 'Cambridge Practice Tests for IELTS 1 — Practice Test 1',
      },
    ],
    skipDuplicates: true,
  });
  console.log('✅ PracticeTests seeded');

  // ============================================================
  // 3. SKILL CONTENTS
  // ============================================================
  await prisma.skillContent.createMany({
    skipDuplicates: true,
    data: [
      // --- WRITING Task 1 ---
      {
        id: 'wt1-pt1-t1',
        skillTypeId: 3,
        source: 'Cambridge Practice Tests for IELTS 1 — Practice Test 1',
        audioUrl: null,
        contentJson: {
          task: 1,
          module: 'academic',
          visual_type: 'mixed',
          visual_description:
            'Bar chart showing reasons why adults decide to study + Pie chart showing how course costs should be shared',
          visuals: [
            {
              type: 'bar_chart',
              label: 'Reasons for adults studying',
              data_points: [
                'Interest in subject',
                'To gain qualifications',
                'Helpful for current job',
                'To improve prospects of promotion',
                'Enjoy learning/studying',
                'To be able to change jobs',
                'To meet people',
              ],
            },
            {
              type: 'pie_chart',
              label: 'How course costs should be shared',
              data_points: [
                { label: 'Individual', value: '40%' },
                { label: 'Employer', value: '35%' },
                { label: 'Taxpayer', value: '25%' },
              ],
            },
          ],
          prompt:
            'The charts below show the results of a survey of adult education. The first chart shows the reasons why adults decide to study. The pie chart shows how people think the costs of adult education should be shared. Write a report for a university lecturer, describing the information shown below.',
          instruction: 'You should spend about 20 minutes on this task.',
          min_words: 150,
          time_minutes: 20,
        },
      },

      // --- WRITING Task 2 ---
      {
        id: 'wt1-pt1-t2',
        skillTypeId: 3,
        source: 'Cambridge Practice Tests for IELTS 1 — Practice Test 1',
        audioUrl: null,
        contentJson: {
          task: 2,
          module: 'academic',
          essay_type: 'two_part_question',
          prompt:
            'There are many different types of music in the world today. Why do we need music? Is the traditional music of a country more important than the international music that is heard everywhere nowadays?',
          instruction:
            'You should spend about 40 minutes on this task. Present a written argument or case to an educated reader with no specialist knowledge of the following topic.',
          note: 'Use your own ideas, knowledge and experience and support your arguments with examples and relevant evidence.',
          min_words: 250,
          time_minutes: 40,
        },
      },

      // --- LISTENING ---
      {
        id: 'sc-pt1-listening',
        skillTypeId: 1,
        source: 'Cambridge Practice Tests for IELTS 1 — Practice Test 1',
        audioUrl: null,
        contentJson: {
          total_questions: 41,
          sections: [
            {
              section: 1,
              context: 'social_conversation',
              description: 'A woman calls the City Police Station to report a stolen briefcase.',
              speakers: ['Receptionist', 'Woman', 'Police Officer'],
              question_blocks: [
                {
                  question_type: 'multiple_choice',
                  questions_range: '1-5',
                  instruction: 'Circle the appropriate letter.',
                  questions: [
                    { id: 'L1Q1', number: 1, text: 'What does her briefcase look like?', options: ['A', 'B', 'C', 'D'], note: 'Image-based options', answer: 'A' },
                    { id: 'L1Q2', number: 2, text: 'Which picture shows the distinguishing features?', options: ['A', 'B', 'C', 'D'], note: 'Image-based options', answer: 'C' },
                    { id: 'L1Q3', number: 3, text: 'What did she have inside her briefcase?', options: ['A: wallet, pens and novel', 'B: papers and wallet', 'C: pens and novel', 'D: papers, pens and novel'], answer: 'D' },
                    { id: 'L1Q4', number: 4, text: 'Where was she standing when she lost her briefcase?', options: ['A', 'B', 'C', 'D'], note: 'Image-based options', answer: 'D' },
                    { id: 'L1Q5', number: 5, text: 'What time was it when she lost her briefcase?', options: ['A', 'B', 'C', 'D'], note: 'Image-based options', answer: 'C' },
                  ],
                },
                {
                  question_type: 'form_completion',
                  questions_range: '6-10',
                  instruction: 'Complete the form. Write NO MORE THAN THREE WORDS for each answer.',
                  form_title: 'PERSONAL DETAILS FORM',
                  questions: [
                    { id: 'L1Q6',  number: 6,  text: 'Name: Mary ___',                          answer: 'Prescott' },
                    { id: 'L1Q7',  number: 7,  text: 'Address: Flat 2, ___ [number]',            answer: '41' },
                    { id: 'L1Q8',  number: 8,  text: 'Address: ___ Road, Canterbury',            answer: 'Fountain' },
                    { id: 'L1Q9',  number: 9,  text: 'Telephone: ___',                           answer: '752239' },
                    { id: 'L1Q10', number: 10, text: 'Estimated value of lost item: £___',       answer: '65' },
                  ],
                },
              ],
            },
            {
              section: 2,
              context: 'social_monologue',
              description: 'A news broadcast covering drought relief funds and a plane emergency landing.',
              speakers: ['Newsreader'],
              question_blocks: [
                {
                  question_type: 'matching',
                  questions_range: '11-13',
                  instruction: 'Tick the THREE other items mentioned in the news headlines.',
                  options: ['A: Rivers flood in the north', 'B: Money promised for drought victims (EXAMPLE)', 'C: Nurses on strike in Melbourne', 'D: Passengers rescued from ship', 'E: Passengers rescued from plane', 'F: Bus and train drivers national strike threat', 'G: Teachers demand more pay', 'H: New uniform for QANTAS staff', 'I: National airports under new management'],
                  answers: ['E', 'F', 'H'],
                },
                {
                  question_type: 'note_completion',
                  questions_range: '14-21',
                  instruction: 'Complete the notes below. Write NO MORE THAN THREE WORDS.',
                  questions: [
                    { id: 'L2Q14', number: 14, text: 'The Government plans to give $___ to assist the farmers.',        answer: '250 million' },
                    { id: 'L2Q15', number: 15, text: "Money was to be spent on improving Sydney's ___ but re-allocated.", answer: 'roads / road system' },
                    { id: 'L2Q16', number: 16, text: 'Farmers say the money will not help because it is ___.',           answer: 'too late' },
                    { id: 'L2Q17', number: 17, text: 'An aeroplane carrying a group of ___ was forced to land.',         answer: 'school children / boys' },
                    { id: 'L2Q18', number: 18, text: 'Forced to land just ___ minutes after take-off.',                  answer: '3' },
                    { id: 'L2Q19', number: 19, text: 'The passengers were rescued by ___.',                               answer: 'boats / pleasure craft' },
                    { id: 'L2Q20', number: 20, text: 'The passengers thanked the ___ for saving their lives.',            answer: 'pilot' },
                    { id: 'L2Q21', number: 21, text: 'Unfortunately they lost their ___.',                                answer: 'musical instruments' },
                  ],
                },
              ],
            },
            {
              section: 3,
              context: 'academic_conversation',
              description: 'A new male student speaks with a female lecturer about Economics I course requirements.',
              speakers: ['Male student', 'Female lecturer'],
              question_blocks: [
                {
                  question_type: 'multiple_choice',
                  questions_range: '22-25',
                  instruction: 'Circle the appropriate letter.',
                  questions: [
                    { id: 'L3Q22', number: 22, text: 'The orientation meeting',    options: ['A: took place recently', 'B: took place last term', 'C: will take place tomorrow', 'D: will take place next week'], answer: 'A' },
                    { id: 'L3Q23', number: 23, text: 'Attendance at lectures is',  options: ['A: optional after 4 pm', 'B: closely monitored', 'C: difficult to enforce', 'D: sometimes unnecessary'], answer: 'B' },
                    { id: 'L3Q24', number: 24, text: 'Tutorials take place',        options: ['A: every morning', 'B: twice a week', 'C: three mornings a week', 'D: three afternoons a week'], answer: 'C' },
                    { id: 'L3Q25', number: 25, text: "The lecturer's name is",      options: ['A: Roberts', 'B: Rawson', 'C: Rogers', 'D: Robertson'], answer: 'A' },
                  ],
                },
                {
                  question_type: 'note_completion',
                  questions_range: '26-31',
                  instruction: 'Complete the notes below using NO MORE THAN THREE WORDS.',
                  questions: [
                    { id: 'L3Q26', number: 26, text: 'Tutorial paper: Students must ___ for 25 minutes.',  answer: 'talk / give a talk' },
                    { id: 'L3Q27', number: 27, text: 'Students must also ___.',                             answer: 'write up work' },
                    { id: 'L3Q28', number: 28, text: 'Essay topic: Usually ___.',                           answer: 'can choose' },
                    { id: 'L3Q29', number: 29, text: 'Type of exam: ___.',                                  answer: 'open book' },
                    { id: 'L3Q30', number: 30, text: 'Library: Important books are in ___.',                answer: 'closed reserve' },
                    { id: 'L3Q31', number: 31, text: 'Focus of course: Focus on ___.',                      answer: 'vocational subjects / preparing for work' },
                  ],
                },
              ],
            },
            {
              section: 4,
              context: 'academic_monologue',
              description: 'University open day mini-lecture on Faculty of Arts and Social Sciences.',
              speakers: ['Female lecturer'],
              question_blocks: [
                {
                  question_type: 'multiple_choice',
                  questions_range: '32-33',
                  instruction: 'Circle the appropriate letter.',
                  questions: [
                    { id: 'L4Q32', number: 32, text: 'The speaker works within the Faculty of', options: ['A: Science and Technology', 'B: Arts and Social Sciences', 'C: Architecture', 'D: Law'], answer: 'B' },
                    { id: 'L4Q33', number: 33, text: 'The Faculty consists firstly of',          options: ['A: subjects', 'B: degrees', 'C: divisions', 'D: departments'], answer: 'C' },
                  ],
                },
                {
                  question_type: 'note_completion',
                  questions_range: '34-36',
                  instruction: 'Complete the notes in NO MORE THAN THREE WORDS.',
                  questions: [
                    { id: 'L4Q34', number: 34, text: 'Subjects in first semester: psychology, sociology, ___ and ___.', answer: 'history and economics' },
                    { id: 'L4Q35', number: 35, text: 'Students may have problems with ___.',                            answer: 'meeting deadlines (for essays)' },
                    { id: 'L4Q36', number: 36, text: 'Students may also have problems with ___.',                       answer: 'attendance' },
                  ],
                },
                {
                  question_type: 'multiple_choice',
                  questions_range: '37-41',
                  instruction: 'Circle the appropriate letter.',
                  questions: [
                    { id: 'L4Q37', number: 37, text: 'The speaker says students can visit her',        options: ['A: every morning', 'B: some mornings', 'C: mornings only', 'D: Friday morning'], answer: 'B' },
                    { id: 'L4Q38', number: 38, text: 'According to the speaker, a tutorial',           options: ['A: is a type of lecture', 'B: is less important than a lecture', 'C: provides a chance to share views', 'D: provides an alternative to groupwork'], answer: 'C' },
                    { id: 'L4Q39', number: 39, text: 'When writing essays, the speaker advises to',    options: ['A: research their work well', 'B: name the books they have read', 'C: share work with friends', "D: avoid using other writers' ideas"], answer: 'B' },
                    { id: 'L4Q40', number: 40, text: 'The speaker thinks that plagiarism is',          options: ['A: a common problem', 'B: an acceptable risk', 'C: a minor concern', 'D: a serious offence'], answer: 'D' },
                    { id: 'L4Q41', number: 41, text: "The speaker's aims are to",                      options: ['A: introduce students to university expectations', 'B: introduce students to the members of staff', 'C: warn students about the difficulties of studying', 'D: guide students round the university'], answer: 'A' },
                  ],
                },
              ],
            },
          ],
        },
      },

      // --- READING ---
      {
        id: 'sc-pt1-reading',
        skillTypeId: 2,
        source: 'Cambridge Practice Tests for IELTS 1 — Practice Test 1',
        audioUrl: null,
        contentJson: {
          total_questions: 40,
          time_minutes: 60,
          passages: [
            {
              passage_number: 1,
              title: 'A spark, a flint: How fire leapt to life',
              topic: 'History of Science / Technology',
              time_suggested_minutes: 20,
              question_blocks: [
                {
                  question_type: 'summary_completion',
                  questions_range: '1-8',
                  instruction: 'Complete the summary. Choose answers from the box.',
                  word_bank: ['Mexicans', 'random', 'rotating', 'despite', 'preserve', 'realising', 'sunlight', 'lacking', 'heavenly', 'percussion', 'chance', 'friction', 'unaware', 'without', 'make', 'heating', 'Eskimos', 'surprised', 'until', 'smoke'],
                  questions: [
                    { id: 'R1Q1', number: 1,  text: 'They tried to [1] burning logs or charcoal',      answer: 'preserve' },
                    { id: 'R1Q2', number: 2,  text: '[2] that they could create fire themselves',       answer: 'unaware' },
                    { id: 'R1Q3', number: 3,  text: 'first man-made flames were produced by [3]',       answer: 'chance' },
                    { id: 'R1Q4', number: 4,  text: 'first methods involved the creation of [4]',       answer: 'friction' },
                    { id: 'R1Q5', number: 5,  text: 'by, for example, rapidly [5] a wooden stick',      answer: 'rotating' },
                    { id: 'R1Q6', number: 6,  text: 'The use of [6] or persistent chipping',            answer: 'percussion' },
                    { id: 'R1Q7', number: 7,  text: 'widespread among Chinese and [7]',                 answer: 'Eskimos' },
                    { id: 'R1Q8', number: 8,  text: 'continued until 1850s [8] the discovery of phosphorus', answer: 'despite' },
                  ],
                },
                {
                  question_type: 'matching_features',
                  questions_range: '9-15',
                  instruction: 'Decide which type of match (A-H) corresponds with each description.',
                  options: ['A: the Ethereal Match', 'B: the Instantaneous Light Box', 'C: Congreves', 'D: Lucifers', 'E: the first strike-anywhere match', "F: Lundstrom's safety match", 'G: book matches', 'H: waterproof matches'],
                  questions: [
                    { id: 'R1Q9',  number: 9,  text: 'made using a less poisonous type of phosphorus', answer: 'F' },
                    { id: 'R1Q10', number: 10, text: 'identical to a previous type of match',           answer: 'D' },
                    { id: 'R1Q11', number: 11, text: 'caused a deadly illness',                          answer: 'E' },
                    { id: 'R1Q12', number: 12, text: 'first to look like modern matches',                answer: 'C' },
                    { id: 'R1Q13', number: 13, text: 'first matches used for advertising',               answer: 'G' },
                    { id: 'R1Q14', number: 14, text: 'relied on an airtight glass container',            answer: 'A' },
                    { id: 'R1Q15', number: 15, text: 'made with the help of an army design',             answer: 'C' },
                  ],
                },
              ],
            },
            {
              passage_number: 2,
              title: 'Zoo conservation programmes',
              topic: 'Environment / Animal Conservation',
              time_suggested_minutes: 20,
              question_blocks: [
                {
                  question_type: 'yes_no_not_given',
                  questions_range: '16-22',
                  instruction: 'Do the following statements agree with the views of the writer?',
                  questions: [
                    { id: 'R2Q16', number: 16, text: "London Zoo's advertisements are dishonest.",               answer: 'YES' },
                    { id: 'R2Q17', number: 17, text: 'Zoos made an insignificant contribution to conservation up until 30 years ago.', answer: 'YES' },
                    { id: 'R2Q18', number: 18, text: 'The WZCS document is not known in Eastern Europe.',         answer: 'NOT GIVEN' },
                    { id: 'R2Q19', number: 19, text: 'Zoos in the WZCS select list were carefully inspected.',    answer: 'NO' },
                    { id: 'R2Q20', number: 20, text: 'No-one knew how the animals were treated at Robin Hill.',   answer: 'NO' },
                    { id: 'R2Q21', number: 21, text: 'Colin Tudge was dissatisfied with treatment at London Zoo.', answer: 'NOT GIVEN' },
                    { id: 'R2Q22', number: 22, text: 'The number of successful zoo conservation programmes is unsatisfactory.', answer: 'YES' },
                  ],
                },
                {
                  question_type: 'multiple_choice',
                  questions_range: '23-25',
                  instruction: 'Choose the appropriate letters A-D.',
                  questions: [
                    { id: 'R2Q23', number: 23, text: 'What were the objectives of the WZCS document?',       options: ['A: to improve the calibre of zoos world-wide', 'B: to identify zoos suitable for conservation practice', 'C: to provide funds for zoos in underdeveloped countries', 'D: to list the endangered species of the world'], answer: 'B' },
                    { id: 'R2Q24', number: 24, text: 'Why does the writer refer to Robin Hill Adventure Park?', options: ['A: to support the Isle of Wight local council', 'B: to criticise the 1981 Zoo Licensing Act', 'C: to illustrate a weakness in the WZCS document', 'D: to exemplify the standards in AAZPA zoos'], answer: 'C' },
                    { id: 'R2Q25', number: 25, text: "What word best describes the writer's response to Colin Tudge's prediction?", options: ['A: disbelieving', 'B: impartial', 'C: prejudiced', 'D: accepting'], answer: 'A' },
                  ],
                },
                {
                  question_type: 'selecting_factors',
                  questions_range: '26-28',
                  instruction: 'Which THREE factors lead the writer to doubt the value of the WZCS document?',
                  options: ['A: the number of unregistered zoos in the world', 'B: the lack of money in developing countries', 'C: the actions of the Isle of Wight local council', "D: the failure of the WZCS to examine the standards of the 'core zoos'", "E: the unrealistic aim of the WZCS in view of the number of species 'saved' to date", 'F: the policies of WZCS zoo managers'],
                  answers: ['A', 'D', 'E'],
                },
              ],
            },
            {
              passage_number: 3,
              title: 'Architecture — Reaching for the Sky',
              topic: 'Architecture / History',
              time_suggested_minutes: 20,
              question_blocks: [
                {
                  question_type: 'table_completion',
                  questions_range: '29-35',
                  instruction: 'Complete the table. Write NO MORE THAN THREE WORDS for each answer.',
                  table_headers: ['Period', 'Style of Period', 'Building Materials', 'Characteristics'],
                  questions: [
                    { id: 'R3Q29', number: 29, text: 'Before 18th century — Building Materials: ___', answer: 'timber and stone' },
                    { id: 'R3Q30', number: 30, text: '1920s — Introduction of ___',                   answer: 'Modernism' },
                    { id: 'R3Q31', number: 31, text: '1930s–1950s — Style: ___',                       answer: 'International Style' },
                    { id: 'R3Q32', number: 32, text: '1960s — Characteristics: ___',                   answer: 'badly designed buildings / multi-storey housing' },
                    { id: 'R3Q33', number: 33, text: '1970s — Characteristics: ___ of historic buildings', answer: 'preservation' },
                    { id: 'R3Q34', number: 34, text: '1970s — Beginning of ___ era',                   answer: 'High-Tech' },
                    { id: 'R3Q35', number: 35, text: '1980s — Post-Modernism — Characteristics: ___',  answer: 'co-existence of styles / different styles together' },
                  ],
                },
                {
                  question_type: 'matching_cause_effect',
                  questions_range: '36-40',
                  instruction: 'Match each Cause (36-40) with its Effect (A-H).',
                  effects: ['A: The quality of life is improved.', 'B: Architecture reflects the age.', 'C: A number of these have been knocked down.', 'D: Light steel frames and lifts are developed.', 'E: Historical buildings are preserved.', 'F: All decoration is removed.', 'G: Parts of cities become slums.', 'H: Modernist ideas cannot be put into practice until the second half of the 20th century.'],
                  questions: [
                    { id: 'R3Q36', number: 36, cause: 'A rapid movement of people from rural areas to cities.', answer: 'G' },
                    { id: 'R3Q37', number: 37, cause: 'Buildings become simple and functional.',                 answer: 'F' },
                    { id: 'R3Q38', number: 38, cause: 'An economic depression and the second world war hit Europe.', answer: 'H' },
                    { id: 'R3Q39', number: 39, cause: 'Multi-storey housing estates are built.',                 answer: 'C' },
                    { id: 'R3Q40', number: 40, cause: 'Less land must be used for building.',                    answer: 'D' },
                  ],
                },
              ],
            },
          ],
        },
      },

      // --- SPEAKING ---
      {
        id: 'sc-pt1-speaking',
        skillTypeId: 4,
        source: 'Cambridge Practice Tests for IELTS 1 — Practice Test 1',
        audioUrl: null,
        contentJson: {
          part: 3,
          format: 'role_play',
          topic: 'University Clubs and Associations',
          scenario: 'You have just arrived at a new university. It is orientation week and you want to know about the different clubs and associations you can join.',
          candidate_task: 'Ask the examiner about the following:',
          candidate_prompts: ['types of clubs', 'meeting times', 'benefits', 'costs'],
          examiner_notes: {
            clubs: [
              { name: 'Overseas Students Club', details: 'Meets once a week in Student Centre, near Library. Helps you to meet other students. Financial contributions welcome. All welcome.' },
              { name: 'Chess Club',              details: 'Meets once a week in Library. Plays other universities. No subscription. Serious players only.' },
              { name: 'Table Tennis Club',       details: 'Meets every day at lunch-time near canteen. Arranges tournaments. $5.00 subscription. All welcome.' },
            ],
          },
          time_minutes: 5,
        },
      },
    ],
  });
  console.log('✅ SkillContents seeded');

  // ============================================================
  // 4. SKILL TESTS
  // ============================================================
  await prisma.skillTest.createMany({
    skipDuplicates: true,
    data: [
      { id: 'st-pt1-writing-t1', skillContentId: 'wt1-pt1-t1',      skillTypeId: 3, numberOfVisits: 12 },
      { id: 'st-pt1-writing-t2', skillContentId: 'wt1-pt1-t2',      skillTypeId: 3, numberOfVisits: 10 },
      { id: 'st-pt1-listening',  skillContentId: 'sc-pt1-listening', skillTypeId: 1, numberOfVisits: 28 },
      { id: 'st-pt1-reading',    skillContentId: 'sc-pt1-reading',   skillTypeId: 2, numberOfVisits: 31 },
      { id: 'st-pt1-speaking',   skillContentId: 'sc-pt1-speaking',  skillTypeId: 4, numberOfVisits: 9  },
    ],
  });
  console.log('✅ SkillTests seeded');

  // ============================================================
  // 5. PRACTICE TEST SKILLS
  //    All 4 skills (Writing uses Task 1 as the representative skill test)
  // ============================================================
  await prisma.practiceTestSkill.createMany({
    skipDuplicates: true,
    data: [
      { id: 'pts-pt1-listening',  practiceTestId: 'pt-cambridge-1', skillTestId: 'st-pt1-listening'  },
      { id: 'pts-pt1-reading',    practiceTestId: 'pt-cambridge-1', skillTestId: 'st-pt1-reading'    },
      { id: 'pts-pt1-writing-t1', practiceTestId: 'pt-cambridge-1', skillTestId: 'st-pt1-writing-t1' },
      { id: 'pts-pt1-writing-t2', practiceTestId: 'pt-cambridge-1', skillTestId: 'st-pt1-writing-t2' },
      { id: 'pts-pt1-speaking',   practiceTestId: 'pt-cambridge-1', skillTestId: 'st-pt1-speaking'   },
    ],
  });
  console.log('✅ PracticeTestSkills seeded');

  // ============================================================
  // 6. USERS
  // ============================================================
  await prisma.user.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 'user-alice-01',
        googleId: 'google-alice-001',
        email: 'alice@example.com',
        name: 'Alice Nguyen',
        avatarUrl: 'https://i.pravatar.cc/150?u=alice',
        refreshToken: null,
      },
      {
        id: 'user-bob-02',
        googleId: 'google-bob-002',
        email: 'bob@example.com',
        name: 'Bob Smith',
        avatarUrl: 'https://i.pravatar.cc/150?u=bob',
        refreshToken: null,
      },
    ],
  });
  console.log('✅ Users seeded');

  // ============================================================
  // 7. TESTS
  //    Alice: COMPLETED session  |  Bob: IN_PROGRESS session
  // ============================================================
  await prisma.test.createMany({
    skipDuplicates: true,
    data: [
      // Alice — fully completed, scored
      {
        id: 'test-alice-completed',
        userId: 'user-alice-01',
        practiceTestId: 'pt-cambridge-1',
        status: 'COMPLETED',
        totalScore: 62,       // Listening 30 + Reading 32
        maxScore: 81,         // Listening 41 + Reading 40
        startedAt: new Date('2024-11-10T08:00:00Z'),
        completedAt: new Date('2024-11-10T11:45:00Z'),
      },
      // Bob — in progress, only Listening submitted so far
      {
        id: 'test-bob-inprogress',
        userId: 'user-bob-02',
        practiceTestId: 'pt-cambridge-1',
        status: 'IN_PROGRESS',
        totalScore: null,
        maxScore: null,
        startedAt: new Date('2024-12-01T09:00:00Z'),
        completedAt: null,
      },
    ],
  });
  console.log('✅ Tests seeded');

  // ============================================================
  // 8. TEST SKILL ATTEMPTS
  // ============================================================
  await prisma.testSkillAttempt.createMany({
    skipDuplicates: true,
    data: [
      // ── Alice: COMPLETED ────────────────────────────────────
      {
        id: 'tsa-alice-listening',
        testId: 'test-alice-completed',
        skillTestId: 'st-pt1-listening',
        score: 30,
        maxScore: 41,
        bandScore: 6.5,
        timeSpentSec: 2580,   // ~43 min
        submittedAt: new Date('2024-11-10T08:45:00Z'),
      },
      {
        id: 'tsa-alice-reading',
        testId: 'test-alice-completed',
        skillTestId: 'st-pt1-reading',
        score: 32,
        maxScore: 40,
        bandScore: 7.0,
        timeSpentSec: 3480,   // ~58 min
        submittedAt: new Date('2024-11-10T09:55:00Z'),
      },
      {
        id: 'tsa-alice-writing-t1',
        testId: 'test-alice-completed',
        skillTestId: 'st-pt1-writing-t1',
        score: null,          // Writing: ungraded
        maxScore: null,
        bandScore: null,
        timeSpentSec: 1200,   // 20 min
        submittedAt: new Date('2024-11-10T10:20:00Z'),
      },
      {
        id: 'tsa-alice-writing-t2',
        testId: 'test-alice-completed',
        skillTestId: 'st-pt1-writing-t2',
        score: null,
        maxScore: null,
        bandScore: null,
        timeSpentSec: 2400,   // 40 min
        submittedAt: new Date('2024-11-10T11:05:00Z'),
      },
      {
        id: 'tsa-alice-speaking',
        testId: 'test-alice-completed',
        skillTestId: 'st-pt1-speaking',
        score: null,          // Speaking: ungraded
        maxScore: null,
        bandScore: null,
        timeSpentSec: 300,    // 5 min
        submittedAt: new Date('2024-11-10T11:40:00Z'),
      },

      // ── Bob: IN_PROGRESS — only Listening submitted ──────────
      {
        id: 'tsa-bob-listening',
        testId: 'test-bob-inprogress',
        skillTestId: 'st-pt1-listening',
        score: 24,
        maxScore: 41,
        bandScore: 5.5,
        timeSpentSec: 2700,   // 45 min
        submittedAt: new Date('2024-12-01T09:47:00Z'),
      },
      // Bob hasn't submitted Reading yet — attempt row created but no answers
      {
        id: 'tsa-bob-reading',
        testId: 'test-bob-inprogress',
        skillTestId: 'st-pt1-reading',
        score: null,
        maxScore: null,
        bandScore: null,
        timeSpentSec: null,
        submittedAt: null,
      },
    ],
  });
  console.log('✅ TestSkillAttempts seeded');

  // ============================================================
  // 9. TEST ANSWERS
  //    Alice: all Listening + Reading answers (with some wrong ones for realism)
  //    Bob:   all Listening answers (submitted), no Reading answers (in progress)
  // ============================================================

  // ── Helpers ──────────────────────────────────────────────────
  type AnswerRow = {
    id: string;
    attemptId: string;
    questionId: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    timeSpentSec: number;
  };

  // Alice's Listening answers — gets 30/41 correct
  const aliceListeningAnswers: AnswerRow[] = [
    // Section 1 — MC (Q1-5)
    { id: 'ans-al-L1Q1',  attemptId: 'tsa-alice-listening', questionId: 'L1Q1',  userAnswer: 'A',               correctAnswer: 'A',               isCorrect: true,  timeSpentSec: 18 },
    { id: 'ans-al-L1Q2',  attemptId: 'tsa-alice-listening', questionId: 'L1Q2',  userAnswer: 'B',               correctAnswer: 'C',               isCorrect: false, timeSpentSec: 22 },
    { id: 'ans-al-L1Q3',  attemptId: 'tsa-alice-listening', questionId: 'L1Q3',  userAnswer: 'D',               correctAnswer: 'D',               isCorrect: true,  timeSpentSec: 15 },
    { id: 'ans-al-L1Q4',  attemptId: 'tsa-alice-listening', questionId: 'L1Q4',  userAnswer: 'D',               correctAnswer: 'D',               isCorrect: true,  timeSpentSec: 20 },
    { id: 'ans-al-L1Q5',  attemptId: 'tsa-alice-listening', questionId: 'L1Q5',  userAnswer: 'C',               correctAnswer: 'C',               isCorrect: true,  timeSpentSec: 17 },
    // Section 1 — Form (Q6-10)
    { id: 'ans-al-L1Q6',  attemptId: 'tsa-alice-listening', questionId: 'L1Q6',  userAnswer: 'Prescott',        correctAnswer: 'Prescott',        isCorrect: true,  timeSpentSec: 12 },
    { id: 'ans-al-L1Q7',  attemptId: 'tsa-alice-listening', questionId: 'L1Q7',  userAnswer: '41',              correctAnswer: '41',              isCorrect: true,  timeSpentSec: 10 },
    { id: 'ans-al-L1Q8',  attemptId: 'tsa-alice-listening', questionId: 'L1Q8',  userAnswer: 'Fountain',        correctAnswer: 'Fountain',        isCorrect: true,  timeSpentSec: 11 },
    { id: 'ans-al-L1Q9',  attemptId: 'tsa-alice-listening', questionId: 'L1Q9',  userAnswer: '752239',          correctAnswer: '752239',          isCorrect: true,  timeSpentSec: 14 },
    { id: 'ans-al-L1Q10', attemptId: 'tsa-alice-listening', questionId: 'L1Q10', userAnswer: '65',              correctAnswer: '65',              isCorrect: true,  timeSpentSec: 9  },
    // Section 2 — Note (Q14-21)
    { id: 'ans-al-L2Q14', attemptId: 'tsa-alice-listening', questionId: 'L2Q14', userAnswer: '250 million',     correctAnswer: '250 million',     isCorrect: true,  timeSpentSec: 13 },
    { id: 'ans-al-L2Q15', attemptId: 'tsa-alice-listening', questionId: 'L2Q15', userAnswer: 'road system',     correctAnswer: 'roads / road system', isCorrect: true,  timeSpentSec: 18 },
    { id: 'ans-al-L2Q16', attemptId: 'tsa-alice-listening', questionId: 'L2Q16', userAnswer: 'too early',       correctAnswer: 'too late',        isCorrect: false, timeSpentSec: 16 },
    { id: 'ans-al-L2Q17', attemptId: 'tsa-alice-listening', questionId: 'L2Q17', userAnswer: 'school children', correctAnswer: 'school children / boys', isCorrect: true, timeSpentSec: 14 },
    { id: 'ans-al-L2Q18', attemptId: 'tsa-alice-listening', questionId: 'L2Q18', userAnswer: '3',               correctAnswer: '3',               isCorrect: true,  timeSpentSec: 8  },
    { id: 'ans-al-L2Q19', attemptId: 'tsa-alice-listening', questionId: 'L2Q19', userAnswer: 'boats',           correctAnswer: 'boats / pleasure craft', isCorrect: true, timeSpentSec: 12 },
    { id: 'ans-al-L2Q20', attemptId: 'tsa-alice-listening', questionId: 'L2Q20', userAnswer: 'pilot',           correctAnswer: 'pilot',           isCorrect: true,  timeSpentSec: 10 },
    { id: 'ans-al-L2Q21', attemptId: 'tsa-alice-listening', questionId: 'L2Q21', userAnswer: 'musical instruments', correctAnswer: 'musical instruments', isCorrect: true, timeSpentSec: 11 },
    // Section 3 — MC (Q22-25)
    { id: 'ans-al-L3Q22', attemptId: 'tsa-alice-listening', questionId: 'L3Q22', userAnswer: 'A',               correctAnswer: 'A',               isCorrect: true,  timeSpentSec: 15 },
    { id: 'ans-al-L3Q23', attemptId: 'tsa-alice-listening', questionId: 'L3Q23', userAnswer: 'B',               correctAnswer: 'B',               isCorrect: true,  timeSpentSec: 14 },
    { id: 'ans-al-L3Q24', attemptId: 'tsa-alice-listening', questionId: 'L3Q24', userAnswer: 'D',               correctAnswer: 'C',               isCorrect: false, timeSpentSec: 20 },
    { id: 'ans-al-L3Q25', attemptId: 'tsa-alice-listening', questionId: 'L3Q25', userAnswer: 'A',               correctAnswer: 'A',               isCorrect: true,  timeSpentSec: 12 },
    // Section 3 — Note (Q26-31)
    { id: 'ans-al-L3Q26', attemptId: 'tsa-alice-listening', questionId: 'L3Q26', userAnswer: 'give a talk',     correctAnswer: 'talk / give a talk', isCorrect: true, timeSpentSec: 16 },
    { id: 'ans-al-L3Q27', attemptId: 'tsa-alice-listening', questionId: 'L3Q27', userAnswer: 'write up work',   correctAnswer: 'write up work',   isCorrect: true,  timeSpentSec: 13 },
    { id: 'ans-al-L3Q28', attemptId: 'tsa-alice-listening', questionId: 'L3Q28', userAnswer: 'can choose',      correctAnswer: 'can choose',      isCorrect: true,  timeSpentSec: 11 },
    { id: 'ans-al-L3Q29', attemptId: 'tsa-alice-listening', questionId: 'L3Q29', userAnswer: 'open book',       correctAnswer: 'open book',       isCorrect: true,  timeSpentSec: 10 },
    { id: 'ans-al-L3Q30', attemptId: 'tsa-alice-listening', questionId: 'L3Q30', userAnswer: 'short loan',      correctAnswer: 'closed reserve',  isCorrect: false, timeSpentSec: 18 },
    { id: 'ans-al-L3Q31', attemptId: 'tsa-alice-listening', questionId: 'L3Q31', userAnswer: 'vocational subjects', correctAnswer: 'vocational subjects / preparing for work', isCorrect: true, timeSpentSec: 14 },
    // Section 4 — MC (Q32-33)
    { id: 'ans-al-L4Q32', attemptId: 'tsa-alice-listening', questionId: 'L4Q32', userAnswer: 'B',               correctAnswer: 'B',               isCorrect: true,  timeSpentSec: 14 },
    { id: 'ans-al-L4Q33', attemptId: 'tsa-alice-listening', questionId: 'L4Q33', userAnswer: 'C',               correctAnswer: 'C',               isCorrect: true,  timeSpentSec: 13 },
    // Section 4 — Note (Q34-36)
    { id: 'ans-al-L4Q34', attemptId: 'tsa-alice-listening', questionId: 'L4Q34', userAnswer: 'history and economics', correctAnswer: 'history and economics', isCorrect: true, timeSpentSec: 16 },
    { id: 'ans-al-L4Q35', attemptId: 'tsa-alice-listening', questionId: 'L4Q35', userAnswer: 'meeting deadlines', correctAnswer: 'meeting deadlines (for essays)', isCorrect: true, timeSpentSec: 15 },
    { id: 'ans-al-L4Q36', attemptId: 'tsa-alice-listening', questionId: 'L4Q36', userAnswer: 'attendance',      correctAnswer: 'attendance',      isCorrect: true,  timeSpentSec: 10 },
    // Section 4 — MC (Q37-41)
    { id: 'ans-al-L4Q37', attemptId: 'tsa-alice-listening', questionId: 'L4Q37', userAnswer: 'B',               correctAnswer: 'B',               isCorrect: true,  timeSpentSec: 14 },
    { id: 'ans-al-L4Q38', attemptId: 'tsa-alice-listening', questionId: 'L4Q38', userAnswer: 'C',               correctAnswer: 'C',               isCorrect: true,  timeSpentSec: 13 },
    { id: 'ans-al-L4Q39', attemptId: 'tsa-alice-listening', questionId: 'L4Q39', userAnswer: 'A',               correctAnswer: 'B',               isCorrect: false, timeSpentSec: 20 },
    { id: 'ans-al-L4Q40', attemptId: 'tsa-alice-listening', questionId: 'L4Q40', userAnswer: 'D',               correctAnswer: 'D',               isCorrect: true,  timeSpentSec: 12 },
    { id: 'ans-al-L4Q41', attemptId: 'tsa-alice-listening', questionId: 'L4Q41', userAnswer: 'A',               correctAnswer: 'A',               isCorrect: true,  timeSpentSec: 11 },
  ];

  // Alice's Reading answers — gets 32/40 correct
  const aliceReadingAnswers: AnswerRow[] = [
    // Passage 1 — Summary (Q1-8)
    { id: 'ans-al-R1Q1',  attemptId: 'tsa-alice-reading', questionId: 'R1Q1',  userAnswer: 'preserve',    correctAnswer: 'preserve',    isCorrect: true,  timeSpentSec: 30 },
    { id: 'ans-al-R1Q2',  attemptId: 'tsa-alice-reading', questionId: 'R1Q2',  userAnswer: 'unaware',     correctAnswer: 'unaware',     isCorrect: true,  timeSpentSec: 28 },
    { id: 'ans-al-R1Q3',  attemptId: 'tsa-alice-reading', questionId: 'R1Q3',  userAnswer: 'chance',      correctAnswer: 'chance',      isCorrect: true,  timeSpentSec: 25 },
    { id: 'ans-al-R1Q4',  attemptId: 'tsa-alice-reading', questionId: 'R1Q4',  userAnswer: 'friction',    correctAnswer: 'friction',    isCorrect: true,  timeSpentSec: 22 },
    { id: 'ans-al-R1Q5',  attemptId: 'tsa-alice-reading', questionId: 'R1Q5',  userAnswer: 'rotating',    correctAnswer: 'rotating',    isCorrect: true,  timeSpentSec: 24 },
    { id: 'ans-al-R1Q6',  attemptId: 'tsa-alice-reading', questionId: 'R1Q6',  userAnswer: 'heating',     correctAnswer: 'percussion',  isCorrect: false, timeSpentSec: 35 },
    { id: 'ans-al-R1Q7',  attemptId: 'tsa-alice-reading', questionId: 'R1Q7',  userAnswer: 'Eskimos',     correctAnswer: 'Eskimos',     isCorrect: true,  timeSpentSec: 20 },
    { id: 'ans-al-R1Q8',  attemptId: 'tsa-alice-reading', questionId: 'R1Q8',  userAnswer: 'despite',     correctAnswer: 'despite',     isCorrect: true,  timeSpentSec: 22 },
    // Passage 1 — Matching (Q9-15)
    { id: 'ans-al-R1Q9',  attemptId: 'tsa-alice-reading', questionId: 'R1Q9',  userAnswer: 'F',           correctAnswer: 'F',           isCorrect: true,  timeSpentSec: 40 },
    { id: 'ans-al-R1Q10', attemptId: 'tsa-alice-reading', questionId: 'R1Q10', userAnswer: 'D',           correctAnswer: 'D',           isCorrect: true,  timeSpentSec: 38 },
    { id: 'ans-al-R1Q11', attemptId: 'tsa-alice-reading', questionId: 'R1Q11', userAnswer: 'C',           correctAnswer: 'E',           isCorrect: false, timeSpentSec: 45 },
    { id: 'ans-al-R1Q12', attemptId: 'tsa-alice-reading', questionId: 'R1Q12', userAnswer: 'C',           correctAnswer: 'C',           isCorrect: true,  timeSpentSec: 36 },
    { id: 'ans-al-R1Q13', attemptId: 'tsa-alice-reading', questionId: 'R1Q13', userAnswer: 'G',           correctAnswer: 'G',           isCorrect: true,  timeSpentSec: 32 },
    { id: 'ans-al-R1Q14', attemptId: 'tsa-alice-reading', questionId: 'R1Q14', userAnswer: 'A',           correctAnswer: 'A',           isCorrect: true,  timeSpentSec: 30 },
    { id: 'ans-al-R1Q15', attemptId: 'tsa-alice-reading', questionId: 'R1Q15', userAnswer: 'C',           correctAnswer: 'C',           isCorrect: true,  timeSpentSec: 33 },
    // Passage 2 — Y/N/NG (Q16-22)
    { id: 'ans-al-R2Q16', attemptId: 'tsa-alice-reading', questionId: 'R2Q16', userAnswer: 'YES',         correctAnswer: 'YES',         isCorrect: true,  timeSpentSec: 28 },
    { id: 'ans-al-R2Q17', attemptId: 'tsa-alice-reading', questionId: 'R2Q17', userAnswer: 'YES',         correctAnswer: 'YES',         isCorrect: true,  timeSpentSec: 26 },
    { id: 'ans-al-R2Q18', attemptId: 'tsa-alice-reading', questionId: 'R2Q18', userAnswer: 'NO',          correctAnswer: 'NOT GIVEN',   isCorrect: false, timeSpentSec: 40 },
    { id: 'ans-al-R2Q19', attemptId: 'tsa-alice-reading', questionId: 'R2Q19', userAnswer: 'NO',          correctAnswer: 'NO',          isCorrect: true,  timeSpentSec: 24 },
    { id: 'ans-al-R2Q20', attemptId: 'tsa-alice-reading', questionId: 'R2Q20', userAnswer: 'NO',          correctAnswer: 'NO',          isCorrect: true,  timeSpentSec: 22 },
    { id: 'ans-al-R2Q21', attemptId: 'tsa-alice-reading', questionId: 'R2Q21', userAnswer: 'NOT GIVEN',   correctAnswer: 'NOT GIVEN',   isCorrect: true,  timeSpentSec: 30 },
    { id: 'ans-al-R2Q22', attemptId: 'tsa-alice-reading', questionId: 'R2Q22', userAnswer: 'YES',         correctAnswer: 'YES',         isCorrect: true,  timeSpentSec: 25 },
    // Passage 2 — MC (Q23-25)
    { id: 'ans-al-R2Q23', attemptId: 'tsa-alice-reading', questionId: 'R2Q23', userAnswer: 'B',           correctAnswer: 'B',           isCorrect: true,  timeSpentSec: 35 },
    { id: 'ans-al-R2Q24', attemptId: 'tsa-alice-reading', questionId: 'R2Q24', userAnswer: 'C',           correctAnswer: 'C',           isCorrect: true,  timeSpentSec: 33 },
    { id: 'ans-al-R2Q25', attemptId: 'tsa-alice-reading', questionId: 'R2Q25', userAnswer: 'B',           correctAnswer: 'A',           isCorrect: false, timeSpentSec: 40 },
    // Passage 2 — Selecting (Q26-28)
    { id: 'ans-al-R2Q26', attemptId: 'tsa-alice-reading', questionId: 'R2Q26', userAnswer: 'A',           correctAnswer: 'A',           isCorrect: true,  timeSpentSec: 30 },
    { id: 'ans-al-R2Q27', attemptId: 'tsa-alice-reading', questionId: 'R2Q27', userAnswer: 'D',           correctAnswer: 'D',           isCorrect: true,  timeSpentSec: 28 },
    { id: 'ans-al-R2Q28', attemptId: 'tsa-alice-reading', questionId: 'R2Q28', userAnswer: 'E',           correctAnswer: 'E',           isCorrect: true,  timeSpentSec: 32 },
    // Passage 3 — Table (Q29-35)
    { id: 'ans-al-R3Q29', attemptId: 'tsa-alice-reading', questionId: 'R3Q29', userAnswer: 'timber and stone',     correctAnswer: 'timber and stone',     isCorrect: true,  timeSpentSec: 25 },
    { id: 'ans-al-R3Q30', attemptId: 'tsa-alice-reading', questionId: 'R3Q30', userAnswer: 'Modernism',            correctAnswer: 'Modernism',            isCorrect: true,  timeSpentSec: 20 },
    { id: 'ans-al-R3Q31', attemptId: 'tsa-alice-reading', questionId: 'R3Q31', userAnswer: 'International Style',  correctAnswer: 'International Style',  isCorrect: true,  timeSpentSec: 22 },
    { id: 'ans-al-R3Q32', attemptId: 'tsa-alice-reading', questionId: 'R3Q32', userAnswer: 'multi-storey housing', correctAnswer: 'badly designed buildings / multi-storey housing', isCorrect: true, timeSpentSec: 28 },
    { id: 'ans-al-R3Q33', attemptId: 'tsa-alice-reading', questionId: 'R3Q33', userAnswer: 'preservation',         correctAnswer: 'preservation',         isCorrect: true,  timeSpentSec: 20 },
    { id: 'ans-al-R3Q34', attemptId: 'tsa-alice-reading', questionId: 'R3Q34', userAnswer: 'High-Tech',            correctAnswer: 'High-Tech',            isCorrect: true,  timeSpentSec: 18 },
    { id: 'ans-al-R3Q35', attemptId: 'tsa-alice-reading', questionId: 'R3Q35', userAnswer: 'co-existence of styles', correctAnswer: 'co-existence of styles / different styles together', isCorrect: true, timeSpentSec: 30 },
    // Passage 3 — Cause/Effect (Q36-40)
    { id: 'ans-al-R3Q36', attemptId: 'tsa-alice-reading', questionId: 'R3Q36', userAnswer: 'G',           correctAnswer: 'G',           isCorrect: true,  timeSpentSec: 35 },
    { id: 'ans-al-R3Q37', attemptId: 'tsa-alice-reading', questionId: 'R3Q37', userAnswer: 'F',           correctAnswer: 'F',           isCorrect: true,  timeSpentSec: 30 },
    { id: 'ans-al-R3Q38', attemptId: 'tsa-alice-reading', questionId: 'R3Q38', userAnswer: 'H',           correctAnswer: 'H',           isCorrect: true,  timeSpentSec: 28 },
    { id: 'ans-al-R3Q39', attemptId: 'tsa-alice-reading', questionId: 'R3Q39', userAnswer: 'C',           correctAnswer: 'C',           isCorrect: true,  timeSpentSec: 25 },
    { id: 'ans-al-R3Q40', attemptId: 'tsa-alice-reading', questionId: 'R3Q40', userAnswer: 'B',           correctAnswer: 'D',           isCorrect: false, timeSpentSec: 40 },
  ];

  // Bob's Listening answers — gets 24/41 correct (weaker student)
  const bobListeningAnswers: AnswerRow[] = [
    { id: 'ans-bob-L1Q1',  attemptId: 'tsa-bob-listening', questionId: 'L1Q1',  userAnswer: 'A',               correctAnswer: 'A',               isCorrect: true,  timeSpentSec: 25 },
    { id: 'ans-bob-L1Q2',  attemptId: 'tsa-bob-listening', questionId: 'L1Q2',  userAnswer: 'A',               correctAnswer: 'C',               isCorrect: false, timeSpentSec: 30 },
    { id: 'ans-bob-L1Q3',  attemptId: 'tsa-bob-listening', questionId: 'L1Q3',  userAnswer: 'B',               correctAnswer: 'D',               isCorrect: false, timeSpentSec: 28 },
    { id: 'ans-bob-L1Q4',  attemptId: 'tsa-bob-listening', questionId: 'L1Q4',  userAnswer: 'D',               correctAnswer: 'D',               isCorrect: true,  timeSpentSec: 22 },
    { id: 'ans-bob-L1Q5',  attemptId: 'tsa-bob-listening', questionId: 'L1Q5',  userAnswer: 'B',               correctAnswer: 'C',               isCorrect: false, timeSpentSec: 25 },
    { id: 'ans-bob-L1Q6',  attemptId: 'tsa-bob-listening', questionId: 'L1Q6',  userAnswer: 'Preston',         correctAnswer: 'Prescott',        isCorrect: false, timeSpentSec: 18 },
    { id: 'ans-bob-L1Q7',  attemptId: 'tsa-bob-listening', questionId: 'L1Q7',  userAnswer: '41',              correctAnswer: '41',              isCorrect: true,  timeSpentSec: 12 },
    { id: 'ans-bob-L1Q8',  attemptId: 'tsa-bob-listening', questionId: 'L1Q8',  userAnswer: 'Fountain',        correctAnswer: 'Fountain',        isCorrect: true,  timeSpentSec: 14 },
    { id: 'ans-bob-L1Q9',  attemptId: 'tsa-bob-listening', questionId: 'L1Q9',  userAnswer: '752239',          correctAnswer: '752239',          isCorrect: true,  timeSpentSec: 15 },
    { id: 'ans-bob-L1Q10', attemptId: 'tsa-bob-listening', questionId: 'L1Q10', userAnswer: '60',              correctAnswer: '65',              isCorrect: false, timeSpentSec: 18 },
    { id: 'ans-bob-L2Q14', attemptId: 'tsa-bob-listening', questionId: 'L2Q14', userAnswer: '250 million',     correctAnswer: '250 million',     isCorrect: true,  timeSpentSec: 16 },
    { id: 'ans-bob-L2Q15', attemptId: 'tsa-bob-listening', questionId: 'L2Q15', userAnswer: 'parks',           correctAnswer: 'roads / road system', isCorrect: false, timeSpentSec: 22 },
    { id: 'ans-bob-L2Q16', attemptId: 'tsa-bob-listening', questionId: 'L2Q16', userAnswer: 'too late',        correctAnswer: 'too late',        isCorrect: true,  timeSpentSec: 14 },
    { id: 'ans-bob-L2Q17', attemptId: 'tsa-bob-listening', questionId: 'L2Q17', userAnswer: 'tourists',        correctAnswer: 'school children / boys', isCorrect: false, timeSpentSec: 20 },
    { id: 'ans-bob-L2Q18', attemptId: 'tsa-bob-listening', questionId: 'L2Q18', userAnswer: '3',               correctAnswer: '3',               isCorrect: true,  timeSpentSec: 10 },
    { id: 'ans-bob-L2Q19', attemptId: 'tsa-bob-listening', questionId: 'L2Q19', userAnswer: 'boats',           correctAnswer: 'boats / pleasure craft', isCorrect: true, timeSpentSec: 14 },
    { id: 'ans-bob-L2Q20', attemptId: 'tsa-bob-listening', questionId: 'L2Q20', userAnswer: 'pilot',           correctAnswer: 'pilot',           isCorrect: true,  timeSpentSec: 12 },
    { id: 'ans-bob-L2Q21', attemptId: 'tsa-bob-listening', questionId: 'L2Q21', userAnswer: 'luggage',         correctAnswer: 'musical instruments', isCorrect: false, timeSpentSec: 18 },
    { id: 'ans-bob-L3Q22', attemptId: 'tsa-bob-listening', questionId: 'L3Q22', userAnswer: 'A',               correctAnswer: 'A',               isCorrect: true,  timeSpentSec: 16 },
    { id: 'ans-bob-L3Q23', attemptId: 'tsa-bob-listening', questionId: 'L3Q23', userAnswer: 'A',               correctAnswer: 'B',               isCorrect: false, timeSpentSec: 20 },
    { id: 'ans-bob-L3Q24', attemptId: 'tsa-bob-listening', questionId: 'L3Q24', userAnswer: 'C',               correctAnswer: 'C',               isCorrect: true,  timeSpentSec: 18 },
    { id: 'ans-bob-L3Q25', attemptId: 'tsa-bob-listening', questionId: 'L3Q25', userAnswer: 'A',               correctAnswer: 'A',               isCorrect: true,  timeSpentSec: 14 },
    { id: 'ans-bob-L3Q26', attemptId: 'tsa-bob-listening', questionId: 'L3Q26', userAnswer: 'present',         correctAnswer: 'talk / give a talk', isCorrect: false, timeSpentSec: 22 },
    { id: 'ans-bob-L3Q27', attemptId: 'tsa-bob-listening', questionId: 'L3Q27', userAnswer: 'write up work',   correctAnswer: 'write up work',   isCorrect: true,  timeSpentSec: 14 },
    { id: 'ans-bob-L3Q28', attemptId: 'tsa-bob-listening', questionId: 'L3Q28', userAnswer: 'assigned topic',  correctAnswer: 'can choose',      isCorrect: false, timeSpentSec: 20 },
    { id: 'ans-bob-L3Q29', attemptId: 'tsa-bob-listening', questionId: 'L3Q29', userAnswer: 'open book',       correctAnswer: 'open book',       isCorrect: true,  timeSpentSec: 12 },
    { id: 'ans-bob-L3Q30', attemptId: 'tsa-bob-listening', questionId: 'L3Q30', userAnswer: 'closed reserve',  correctAnswer: 'closed reserve',  isCorrect: true,  timeSpentSec: 14 },
    { id: 'ans-bob-L3Q31', attemptId: 'tsa-bob-listening', questionId: 'L3Q31', userAnswer: 'vocational subjects', correctAnswer: 'vocational subjects / preparing for work', isCorrect: true, timeSpentSec: 16 },
    { id: 'ans-bob-L4Q32', attemptId: 'tsa-bob-listening', questionId: 'L4Q32', userAnswer: 'A',               correctAnswer: 'B',               isCorrect: false, timeSpentSec: 18 },
    { id: 'ans-bob-L4Q33', attemptId: 'tsa-bob-listening', questionId: 'L4Q33', userAnswer: 'C',               correctAnswer: 'C',               isCorrect: true,  timeSpentSec: 16 },
    { id: 'ans-bob-L4Q34', attemptId: 'tsa-bob-listening', questionId: 'L4Q34', userAnswer: 'philosophy and economics', correctAnswer: 'history and economics', isCorrect: false, timeSpentSec: 22 },
    { id: 'ans-bob-L4Q35', attemptId: 'tsa-bob-listening', questionId: 'L4Q35', userAnswer: 'meeting deadlines', correctAnswer: 'meeting deadlines (for essays)', isCorrect: true, timeSpentSec: 16 },
    { id: 'ans-bob-L4Q36', attemptId: 'tsa-bob-listening', questionId: 'L4Q36', userAnswer: 'attendance',      correctAnswer: 'attendance',      isCorrect: true,  timeSpentSec: 12 },
    { id: 'ans-bob-L4Q37', attemptId: 'tsa-bob-listening', questionId: 'L4Q37', userAnswer: 'D',               correctAnswer: 'B',               isCorrect: false, timeSpentSec: 20 },
    { id: 'ans-bob-L4Q38', attemptId: 'tsa-bob-listening', questionId: 'L4Q38', userAnswer: 'C',               correctAnswer: 'C',               isCorrect: true,  timeSpentSec: 16 },
    { id: 'ans-bob-L4Q39', attemptId: 'tsa-bob-listening', questionId: 'L4Q39', userAnswer: 'B',               correctAnswer: 'B',               isCorrect: true,  timeSpentSec: 14 },
    { id: 'ans-bob-L4Q40', attemptId: 'tsa-bob-listening', questionId: 'L4Q40', userAnswer: 'D',               correctAnswer: 'D',               isCorrect: true,  timeSpentSec: 12 },
    { id: 'ans-bob-L4Q41', attemptId: 'tsa-bob-listening', questionId: 'L4Q41', userAnswer: 'C',               correctAnswer: 'A',               isCorrect: false, timeSpentSec: 18 },
  ];

  await prisma.testAnswer.createMany({
    skipDuplicates: true,
    data: [...aliceListeningAnswers, ...aliceReadingAnswers, ...bobListeningAnswers],
  });
  console.log('✅ TestAnswers seeded');
  console.log('');
  console.log('🎉 Done! Summary:');
  console.log('   • 1 PracticeTest  (Cambridge PT1)');
  console.log('   • 5 SkillTests    (Listening, Reading, Writing T1, Writing T2, Speaking)');
  console.log('   • 2 Users         (Alice — COMPLETED, Bob — IN_PROGRESS)');
  console.log('   • 2 Tests         (1 completed, 1 in progress)');
  console.log('   • 7 SkillAttempts (Alice: 5 skills | Bob: 1 submitted + 1 pending)');
  console.log(`   • ${aliceListeningAnswers.length + aliceReadingAnswers.length + bobListeningAnswers.length} TestAnswers`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });