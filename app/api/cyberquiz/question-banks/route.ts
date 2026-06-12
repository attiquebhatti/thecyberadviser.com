import { NextResponse } from 'next/server';
import { pool } from '@/lib/cyberquiz/db';

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
  'KIDS-GK':        { label: 'Kids General Knowledge (Under 8)',      code: 'KIDS GK',  color: '#f59e0b', icon: 'star',    group: 'Kids' },
};

export async function GET() {
  try {
    const [rows] = await pool.query(
      `SELECT course_code, course_name, COUNT(*) AS total_questions,
              SUM(difficulty = 'Foundational') AS foundational,
              SUM(difficulty = 'Intermediate') AS intermediate,
              SUM(difficulty = 'Advanced')     AS advanced
       FROM question_banks GROUP BY course_code, course_name
       ORDER BY FIELD(course_code,'EDU210','EDU220','EDU330','PRISMA-ACCESS','PRISMA-SDWAN','XDR-ENGINEER','XDR-ANALYST','XSOAR','XSIAM-ENGINEER','XSIAM-ANALYST')`
    ) as any[];

    return NextResponse.json(rows.map((r: any) => ({
      course_code: r.course_code, course_name: r.course_name, total_questions: r.total_questions,
      by_difficulty: { Foundational: r.foundational || 0, Intermediate: r.intermediate || 0, Advanced: r.advanced || 0 },
      ...(COURSE_META[r.course_code] || {}),
    })));
  } catch (err: any) {
    if (err.code === 'ER_NO_SUCH_TABLE') return NextResponse.json([]);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
