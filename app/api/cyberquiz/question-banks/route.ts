import { NextResponse } from 'next/server';
import { pool } from '@/lib/cyberquiz/db';
import { getLocalQuestionBanks } from '@/lib/cyberquiz/local-question-bank';

const COURSE_META: Record<string, object> = {
  'EDU210':         { label: 'Network Security Professional',        code: 'EDU-210',  color: '#ef4444', icon: 'shield',  group: 'Palo Alto Networks' },
  'EDU220':         { label: 'Next Generation Firewall Engineer',     code: 'EDU-220',  color: '#f97316', icon: 'flame',   group: 'Palo Alto Networks' },
  'EDU330':         { label: 'NGFW Troubleshooting ILT',             code: 'EDU-330',  color: '#eab308', icon: 'wrench',  group: 'Palo Alto Networks' },
  'PRISMA-ACCESS':  { label: 'Prisma Access / Security Service Edge', code: 'PRISMA',   color: '#22c55e', icon: 'cloud',   group: 'Palo Alto Networks' },
  'PRISMA-SDWAN':   { label: 'Prisma SD-WAN',                        code: 'SD-WAN',   color: '#06b6d4', icon: 'network', group: 'Palo Alto Networks' },
  'XDR-ENGINEER':   { label: 'Cortex XDR Engineer',                  code: 'XDR-ENG',  color: '#3b82f6', icon: 'cpu',     group: 'Palo Alto Networks' },
  'XDR-ANALYST':    { label: 'Cortex XDR Analyst',                   code: 'XDR-ANL',  color: '#6366f1', icon: 'eye',     group: 'Palo Alto Networks' },
  'XSOAR':          { label: 'Cortex XSOAR — Engineer & Analyst',    code: 'XSOAR',    color: '#8b5cf6', icon: 'bot',     group: 'Palo Alto Networks' },
  'XSIAM-ENGINEER': { label: 'Cortex XSIAM Engineer',                code: 'XSIAM-E',  color: '#a855f7', icon: 'zap',     group: 'Palo Alto Networks' },
  'XSIAM-ANALYST':  { label: 'Cortex XSIAM Analyst',                 code: 'XSIAM-A',  color: '#ec4899', icon: 'search',  group: 'Palo Alto Networks' },
  'CCSA':           { label: 'Check Point Security Administrator',    code: 'CCSA',     color: '#e91e8c', icon: 'shield',  group: 'Check Point' },
  'CCSE':           { label: 'Check Point Security Expert',           code: 'CCSE',     color: '#ff4aa2', icon: 'shield',  group: 'Check Point' },
  'CCTA':           { label: 'Check Point Troubleshooting Administrator', code: 'CCTA', color: '#c026d3', icon: 'wrench',  group: 'Check Point' },
  'CCTE':           { label: 'Check Point Troubleshooting Expert',    code: 'CCTE',     color: '#a855f7', icon: 'search',  group: 'Check Point' },
  'F5-BIGIP-ADMIN': { label: 'BIG-IP Administrator',                  code: 'BIG-IP',   color: '#c0203c', icon: 'network', group: 'F5' },
  'F5-LTM':         { label: 'BIG-IP LTM Specialist',                 code: 'LTM',      color: '#e11d48', icon: 'network', group: 'F5' },
  'F5-DNS':         { label: 'BIG-IP DNS Specialist',                 code: 'DNS',      color: '#f43f5e', icon: 'network', group: 'F5' },
  'F5-APM':         { label: 'BIG-IP APM Specialist',                 code: 'APM',      color: '#fb7185', icon: 'shield',  group: 'F5' },
  'F5-ASM-AWAF':    { label: 'BIG-IP ASM / Advanced WAF Specialist',  code: 'AWAF',     color: '#be123c', icon: 'shield',  group: 'F5' },
  'F5-CSE-CLOUD':   { label: 'CSE Security / Cloud',                  code: 'CSE',      color: '#9f1239', icon: 'cloud',   group: 'F5' },
  'CYBERARK-PAM-ADMIN':   { label: 'PAM Administration',              code: 'PAM-A',    color: '#06b6d4', icon: 'lock',    group: 'CyberArk' },
  'CYBERARK-PAM-INSTALL': { label: 'PAM Install and Configure',       code: 'PAM-I',    color: '#0ea5e9', icon: 'wrench',  group: 'CyberArk' },
  'CYBERARK-EPM-ADMIN':   { label: 'EPM Administration',              code: 'EPM',      color: '#14b8a6', icon: 'shield',  group: 'CyberArk' },
  'CYBERARK-SM-K8S':      { label: 'Secrets Manager for Kubernetes',  code: 'SM-K8S',   color: '#22c55e', icon: 'cloud',   group: 'CyberArk' },
  'CYBERARK-SM-SAAS':     { label: 'Secrets Manager SaaS Fundamentals', code: 'SM-SaaS', color: '#84cc16', icon: 'key',    group: 'CyberArk' },
  'KIDS-GK':        { label: 'Kids General Knowledge (Under 8)',      code: 'KIDS GK',  color: '#f59e0b', icon: 'star',    group: 'Kids' },
};

const COURSE_ORDER = [
  'EDU210','EDU220','EDU330','PRISMA-ACCESS','PRISMA-SDWAN',
  'XDR-ENGINEER','XDR-ANALYST','XSOAR','XSIAM-ENGINEER','XSIAM-ANALYST',
  'CCSA','CCSE','CCTA','CCTE',
  'F5-BIGIP-ADMIN','F5-LTM','F5-DNS','F5-APM','F5-ASM-AWAF','F5-CSE-CLOUD',
  'CYBERARK-PAM-ADMIN','CYBERARK-PAM-INSTALL','CYBERARK-EPM-ADMIN','CYBERARK-SM-K8S','CYBERARK-SM-SAAS',
];

export async function GET() {
  try {
    const [rows] = await pool.query(
      `SELECT course_code, course_name, COUNT(*) AS total_questions,
              COUNT(DISTINCT module_num) AS module_count,
              SUM(difficulty = 'Foundational') AS foundational,
              SUM(difficulty = 'Intermediate') AS intermediate,
              SUM(difficulty = 'Advanced')     AS advanced
       FROM question_banks GROUP BY course_code, course_name
       ORDER BY FIELD(course_code, ${COURSE_ORDER.map(() => '?').join(',')})`,
      COURSE_ORDER
    ) as any[];

    // Deduplicate by course_code — keep the entry with the most questions
    const best = new Map<string, any>();
    for (const r of rows as any[]) {
      const prev = best.get(r.course_code);
      if (!prev || r.total_questions > prev.total_questions) best.set(r.course_code, r);
    }

    const localRows = getLocalQuestionBanks();
    for (const row of localRows) {
      if (best.has(row.course_code)) continue;
      const rowsForCourse = localRows.filter((item) => item.course_code === row.course_code);
      best.set(row.course_code, {
        course_code: row.course_code,
        course_name: row.course_name,
        total_questions: rowsForCourse.length,
        foundational: rowsForCourse.filter((item) => item.difficulty === 'Foundational').length,
        intermediate: rowsForCourse.filter((item) => item.difficulty === 'Intermediate').length,
        advanced: rowsForCourse.filter((item) => item.difficulty === 'Advanced').length,
        module_count: new Set(rowsForCourse.map((item) => item.module_num)).size,
      });
    }

    return NextResponse.json([...best.values()].map((r: any) => ({
      course_code: r.course_code, course_name: r.course_name, total_questions: r.total_questions,
      by_difficulty: { Foundational: r.foundational || 0, Intermediate: r.intermediate || 0, Advanced: r.advanced || 0 },
      module_count: r.module_count,
      ...(COURSE_META[r.course_code] || {}),
    })));
  } catch (err: any) {
    if (err.code === 'ER_NO_SUCH_TABLE') return NextResponse.json([]);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
