import fs from 'fs';
import path from 'path';

export interface LocalQuestionBankRow {
  course_code: string;
  course_name: string;
  question_bank_id: string;
  difficulty: 'Foundational' | 'Intermediate' | 'Advanced';
  domain: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_letter: 'A' | 'B' | 'C' | 'D';
  correct_text: string;
  explanation: string;
  reference_url: string;
  module_num: number;
  module_name: string;
}

let cachedRows: LocalQuestionBankRow[] | null = null;

const localSeedFiles = [
  'cp_question_banks_seed.json',
  'f5_question_banks_seed.json',
  'cyberark_question_banks_seed.json',
];

export function getLocalQuestionBanks(): LocalQuestionBankRow[] {
  if (process.env.NODE_ENV === 'production') return [];
  if (cachedRows) return cachedRows;

  try {
    cachedRows = localSeedFiles.flatMap((fileName) => {
      const seedPath = path.join(process.cwd(), 'lib', 'cyberquiz', 'seeds', fileName);
      if (!fs.existsSync(seedPath)) return [];
      return JSON.parse(fs.readFileSync(seedPath, 'utf8')) as LocalQuestionBankRow[];
    });
  } catch (error) {
    console.warn('Failed to read local question bank seed:', error);
    cachedRows = [];
  }

  return cachedRows;
}

export function getLocalCpQuestionBanks(): LocalQuestionBankRow[] {
  return getLocalQuestionBanks().filter((row) => row.course_code.startsWith('CC'));
}

export function getLocalRowsByCourse(courseCode: string) {
  const code = courseCode.toUpperCase();
  return getLocalQuestionBanks().filter((row) => row.course_code.toUpperCase() === code);
}

export function getLocalCpRowsByCourse(courseCode: string) {
  return getLocalRowsByCourse(courseCode);
}
