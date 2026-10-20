import { Subject, Quiz, UserProfile, QuizAttempt } from '../types/quiz';

// Clean initial profiles - Single default teacher for immediate login
export const INITIAL_PROFILES: UserProfile[] = [
  {
    id: '00000000-0000-4000-a000-000000000001',
    email: 'teacher@quizrev.edu',
    fullName: 'Prof. Jack Hernandez',
    role: 'teacher',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    createdAt: '2026-01-10T08:00:00Z',
    password: 'admin123',
  },
];

// Foundational academic subjects ready for exam tagging
export const INITIAL_SUBJECTS: Subject[] = [
  {
    id: '11111111-1111-4111-a111-111111111111',
    name: 'General Science',
    code: 'SCI',
    description: 'Earth Science, Biology, Chemistry & Physics fundamentals',
    color: '#1b6e66',
  },
  {
    id: '22222222-2222-4222-a222-222222222222',
    name: 'Mathematics',
    code: 'MATH',
    description: 'Algebra, Geometry, Trigonometry, Statistics & Quantitative Problem Solving',
    color: '#2a5b88',
  },
  {
    id: '33333333-3333-4333-a333-333333333333',
    name: 'Professional Education',
    code: 'PROFED',
    description: 'Theories of Learning, Curriculum Development, Assessment of Learning & Teaching Ethics',
    color: '#78350f',
  },
  {
    id: '44444444-4444-4444-a444-444444444444',
    name: 'English & Literature',
    code: 'ENG',
    description: 'Grammar mechanics, critical comprehension, literary forms and vocabulary',
    color: '#4c1d95',
  },
  {
    id: '55555555-5555-4555-a555-555555555555',
    name: 'Philippine & World History',
    code: 'HIST',
    description: 'Historical timelines, governance, world civilizations and political thought',
    color: '#831843',
  },
];

// Clean empty quizzes - No demo data
export const INITIAL_QUIZZES: Quiz[] = [];

// Clean empty attempts - No demo data
export const INITIAL_ATTEMPTS: QuizAttempt[] = [];

// Sample text for teachers wishing to quickly test upload
export const SAMPLE_EXAM_TEXT = `Subject: General Science
Mock Exam: Environmental Science Practice Test

1. What is the process called when plants absorb carbon dioxide and release oxygen using sunlight?
A. Cellular Respiration
B. Photosynthesis
C. Fermentation
D. Transpiration
Answer: B
Explanation: Photosynthesis takes place in chloroplasts where chlorophyll captures solar photon energy.

2. Which ecological tier consists of organisms that break down organic waste and return nutrients to soil?
A. Apex Predators
B. Decomposers
C. Primary Producers
D. Herbivores
Answer: B
Explanation: Decomposers such as fungi and bacteria break down decaying matter into inorganic compounds.

3. What layer of Earth's atmosphere shields life from harmful ultraviolet (UV) solar radiation?
A. Troposphere
B. Mesosphere
C. Ozone layer
D. Exosphere
Answer: C
Explanation: The ozone layer located within the stratosphere absorbs between 97% to 99% of medium-frequency UV light.

4. Which biogeochemical cycle does not primarily cycle through the atmospheric reservoir?
A. Nitrogen Cycle
B. Carbon Cycle
C. Phosphorus Cycle
D. Water Cycle
Answer: C
Explanation: Phosphorus does not have a significant gaseous phase; it cycles through rocks, soil, sediment, and water.
`;

export const SAMPLE_ANSWER_KEY_TEXT = `ANSWER KEY:
1. B - Photosynthesis takes place in chloroplasts.
2. B - Decomposers break down organic compounds.
3. C - Ozone layer shields UV radiation.
4. C - Phosphorus cycles through rocks and soil.
`;
