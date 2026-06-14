'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Flame, Wrench, Cloud, Network, Cpu, Eye, Bot, Zap, Search,
  ChevronRight, BookOpen, ArrowLeft, Layers, GraduationCap,
  Users, UserCheck, Loader2, Lock, CheckCircle2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cqApi } from '@/lib/cyberquiz/api';
import { useAuthStore } from '@/lib/cyberquiz/stores/authStore';
import { CQGenerateQuizModal } from './GenerateQuizModal';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  shield: Shield, flame: Flame, wrench: Wrench, cloud: Cloud, network: Network,
  cpu: Cpu, eye: Eye, bot: Bot, zap: Zap, search: Search,
};

const COURSE_MODULES: Record<string, string[]> = {
  'EDU210': [
    'Palo Alto Networks Portfolio and Architecture','Configuring Initial Firewall Settings','Managing Firewall Configurations',
    'Managing Firewall Administrator Accounts','Connecting the Firewall to Production Networks with Security Zones',
    'Creating and Managing Security Policy Rules','Creating and Managing NAT Policy Rules','Controlling Application Usage with App-ID',
    'Blocking Known Threats Using Security Profiles','Blocking Inappropriate Web Traffic with URL Filtering',
    'Blocking Unknown Threats with WildFire','Controlling Access to Network Resources with User-ID',
    'Using Decryption to Block Threats in Encrypted Traffic','Locating Valuable Information Using Logs and Reports',
    "What's Next in Your Training and Certification Journey",
  ],
  'EDU220': [
    'Initial Configuration','Adding Firewalls','Templates','Device Groups','Log Collection and Forwarding',
    'Using Panorama Logs','Panorama Administrative Accounts','Reporting','Troubleshooting',
  ],
  'EDU330': [
    'Tools and Resources','Flow Logic','Packet Captures','Packet-Diagnostics Logs','Host-Inbound Traffic',
    'Transit Traffic','System Services','Certificate Management and SSL Decryption','User-ID',
    'GlobalProtect','Support Escalation and RMAs','Next Steps',
  ],
  'PRISMA-ACCESS': [
    'Prisma SASE Overview','Prisma Access Architecture','Strata Cloud Manager','Licensing and Activation',
    'Service Connections','Remote Networks','Mobile Users','Prisma Access Explicit Proxy',
    'ZTNA Connector','Prisma Access Browser','Autonomous Digital Experience Management (ADEM)',
  ],
  'XDR-ANALYST': [
    'Introduction to Cortex XDR','Endpoints','XQL Query Language','Alerting and Detection',
    'Vulnerability & Forensics','Platform Automation','Case Management','Dashboards & Reports',
  ],
  'XDR-ENGINEER': [
    'Overview of Cortex XDR','Software Components','Integrations','XQL Query Language',
    'Detection Engineering','System Optimization','Dashboards and Reports',
  ],
  'XSOAR': [
    'XSOAR Overview','Incident Management','Threat Intelligence','Analyst Investigations',
    'Dashboards, Reports, and Timers','Integrations and Content Management','Architecture',
    'Use Case Planning and Implementation','Playbook Development','Automation Scripts',
  ],
  'XSIAM-ANALYST': [
    'Introduction to Cortex XSIAM','Endpoints','XQL Query Language','Alerting and Detection',
    'Threat Intel Management','Automation','Attack Surface Management','Incident Handling','Dashboards and Reports',
  ],
  'XSIAM-ENGINEER': [
    'Overview of Cortex XSIAM','Software Components','XQL Query Language','Detection Engineering',
    'Integrations','Automation','Threat Intel Management','Attack Surface Management','UI Customizations',
  ],
};

interface GroupConfig {
  groupKey: string; label: string; tagline: string;
  accent: string; accent2: string; logo: string; logoClass?: string;
  fallbackIcon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

const GROUPS: GroupConfig[] = [
  { groupKey: 'Palo Alto Networks', label: 'Palo Alto Networks', tagline: 'NSP · SSE · XDR · XSIAM · XSOAR role-based certs', accent: '#fa5c2f', accent2: '#ff8c5a', logo: '/logos/panw.png', fallbackIcon: Shield },
  { groupKey: 'Checkpoint', label: 'Check Point', tagline: 'CCSA · CCSE · Maestro certifications', accent: '#e91e8c', accent2: '#ff6ec7', logo: '/logos/checkpoint.png', fallbackIcon: Shield },
  { groupKey: 'F5', label: 'F5 Networks', tagline: 'BIG-IP · LTM · GTM certifications', accent: '#c0203c', accent2: '#e84060', logo: '/logos/f5.png', fallbackIcon: Shield },
];

interface CourseBank {
  course_code: string; course_name: string; total_questions: number;
  by_difficulty: { Foundational: number; Intermediate: number; Advanced: number };
  label: string; code: string; color: string; icon: string; group?: string;
}

function VendorLogo({ g }: { g: GroupConfig }) {
  const [err, setErr] = useState(false);
  const FallbackIcon = g.fallbackIcon;
  if (!g.logo || err) {
    return <div className="w-full h-20 rounded-xl flex items-center justify-center" style={{ background: `${g.accent}20` }}><FallbackIcon className="w-10 h-10" style={{ color: g.accent }} /></div>;
  }
  return (
    <div className="w-full h-20 rounded-xl bg-white flex items-center justify-center shadow-md p-3">
      <img src={g.logo} alt={g.label} onError={() => setErr(true)} className={g.logoClass || 'w-full h-full object-contain'} />
    </div>
  );
}

function ModuleChoiceModal({ module: mod, moduleIndex, course, onClose }: { module: string; moduleIndex: number; course: CourseBank; onClose: () => void }) {
  const router    = useRouter();
  const moduleNum = moduleIndex + 1;

  const [step,      setStep]      = useState<'choice' | 'host'>('choice');
  const [count,     setCount]     = useState(10);
  const [hosting,   setHosting]   = useState(false);
  const [hostError, setHostError] = useState('');

  const practiceNow = () => {
    router.push(`/tools/cyberquiz/practice/${course.course_code}/${moduleNum}`);
    onClose();
  };

  const createLiveQuiz = async () => {
    setHosting(true);
    setHostError('');
    try {
      const { quiz_id } = await cqApi.hostModuleQuiz(course.course_code, moduleNum, count);
      const session     = await cqApi.createSession({ quiz_id, game_mode: 'classic' });
      router.push(`/tools/cyberquiz/session/${(session as any).id}/lobby`);
      onClose();
    } catch (e: unknown) {
      setHostError(e instanceof Error ? e.message : 'Failed to create session');
      setHosting(false);
    }
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div className="relative w-full max-w-md glass rounded-2xl p-6 shadow-2xl" initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}>
        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <div className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: `${course.color}20`, color: course.color }}>{course.code}</div>
            <span className="text-xs text-[#64748b]">Module {moduleNum}</span>
          </div>
          <h3 className="text-lg font-bold text-[#f1f5f9] leading-snug">{mod}</h3>
          <p className="text-xs text-[#64748b] mt-1">Questions from the official question bank</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'choice' ? (
            <motion.div key="choice" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -16 }}>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button onClick={practiceNow}
                  className="flex flex-col items-center gap-3 p-5 rounded-xl border border-[#22c55e]/30 bg-[#22c55e]/[0.08] hover:bg-[#22c55e]/15 transition-all group">
                  <div className="w-11 h-11 rounded-full bg-[#22c55e]/20 flex items-center justify-center group-hover:bg-[#22c55e]/30 transition-colors">
                    <UserCheck className="w-5 h-5 text-[#22c55e]" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-[#f1f5f9]">Practice Solo</p>
                    <p className="text-[10px] text-[#64748b] mt-0.5">Self-paced · see explanations</p>
                  </div>
                </button>

                <button onClick={() => setStep('host')}
                  className="flex flex-col items-center gap-3 p-5 rounded-xl border border-[#7c3aed]/30 bg-[#7c3aed]/[0.08] hover:bg-[#7c3aed]/15 transition-all group">
                  <div className="w-11 h-11 rounded-full bg-[#7c3aed]/20 flex items-center justify-center group-hover:bg-[#7c3aed]/30 transition-colors">
                    <Users className="w-5 h-5 text-[#a78bfa]" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-[#f1f5f9]">Host Live Quiz</p>
                    <p className="text-[10px] text-[#64748b] mt-0.5">Students join with a code</p>
                  </div>
                </button>
              </div>
              <button onClick={onClose} className="w-full py-2.5 rounded-xl glass-sm text-[#94a3b8] hover:text-white text-sm font-medium transition-all">
                Cancel
              </button>
            </motion.div>
          ) : (
            <motion.div key="host" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="mb-4">
                <label className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wide mb-2 block">How many questions?</label>
                <div className="flex gap-2">
                  {[5, 10, 20, 30].map(n => (
                    <button key={n} onClick={() => setCount(n)}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${count === n ? 'bg-[#7c3aed] text-white shadow-md shadow-[#7c3aed]/30' : 'glass-sm text-[#94a3b8] hover:text-white'}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              {hostError && <p className="text-xs text-red-400 mb-3">{hostError}</p>}
              <div className="flex gap-3">
                <button onClick={() => setStep('choice')} disabled={hosting}
                  className="flex-1 py-2.5 rounded-xl glass-sm text-[#94a3b8] hover:text-white text-sm font-medium transition-all disabled:opacity-50">
                  Back
                </button>
                <button onClick={createLiveQuiz} disabled={hosting}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#7c3aed]/30 hover:opacity-90 transition-opacity disabled:opacity-60">
                  {hosting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                  {hosting ? 'Creating…' : 'Create Session'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

function UpgradeModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div className="relative w-full max-w-sm glass rounded-2xl p-7 shadow-2xl text-center"
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}>

        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FFC300] to-[#FF8C00] mx-auto mb-5 flex items-center justify-center shadow-lg shadow-[#FFC300]/30">
          <Lock className="w-8 h-8 text-[#0f0f1a]" />
        </div>

        <h2 className="text-xl font-black text-[#f1f5f9] mb-2">Upgrade to Pro</h2>
        <p className="text-sm text-[#94a3b8] mb-6 leading-relaxed">
          Unlock all modules and full course practice to accelerate your certification prep.
        </p>

        <div className="text-left space-y-2.5 mb-7 bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
          {[
            'All course modules unlocked',
            'Full course practice — unlimited questions',
            'Host live quiz sessions for your team',
            'Progress tracking & analytics',
          ].map(f => (
            <div key={f} className="flex items-center gap-2.5 text-sm text-[#cbd5e1]">
              <CheckCircle2 className="w-4 h-4 text-[#22c55e] shrink-0" />
              {f}
            </div>
          ))}
        </div>

        <a href="/contact" onClick={onClose}
          className="w-full py-3.5 rounded-xl font-bold text-[#0f0f1a] mb-3 transition-all hover:opacity-90 flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #FFC300, #FF8C00)' }}>
          Upgrade Now
        </a>
        <button onClick={onClose} className="w-full py-2.5 text-sm text-[#64748b] hover:text-[#94a3b8] transition-colors">
          Maybe Later
        </button>
      </motion.div>
    </motion.div>
  );
}

export function CQPANWTemplates() {
  const { user } = useAuthStore();
  const isFree   = !user || user.tier === 'free';

  const [banks, setBanks]               = useState<CourseBank[]>([]);
  const [loading, setLoading]           = useState(true);
  const [activeGroup, setActiveGroup]   = useState<GroupConfig | null>(null);
  const [activeCourse, setActiveCourse] = useState<CourseBank | null>(null);
  const [fullCourseModal, setFullCourseModal] = useState<CourseBank | null>(null);
  const [moduleModal, setModuleModal]   = useState<{ module: string; idx: number; course: CourseBank } | null>(null);
  const [showUpgrade, setShowUpgrade]   = useState(false);

  useEffect(() => {
    cqApi.getQuestionBanks().then(data => setBanks(data as CourseBank[])).catch(console.error).finally(() => setLoading(false));
  }, []);

  const statsByGroup = GROUPS.reduce<Record<string, { courses: number; questions: number }>>((acc, g) => {
    const cards = banks.filter(b => (b.group || 'Other') === g.groupKey);
    acc[g.groupKey] = { courses: cards.length, questions: cards.reduce((s, b) => s + (b.total_questions || 0), 0) };
    return acc;
  }, {});

  const coursesForGroup   = activeGroup  ? banks.filter(b => (b.group || 'Other') === activeGroup.groupKey) : [];
  const modulesForCourse  = activeCourse ? (COURSE_MODULES[activeCourse.course_code] || []) : [];
  const goBack = () => { if (activeCourse) setActiveCourse(null); else setActiveGroup(null); };

  return (
    <section className="mt-10">
      <div className="flex items-center gap-3 mb-6">
        {(activeGroup || activeCourse) ? (
          <button onClick={goBack} className="flex items-center gap-2 text-[#94a3b8] hover:text-white transition-colors text-sm glass-sm px-3 py-1.5 rounded-lg"><ArrowLeft className="w-4 h-4" /> Back</button>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7c3aed] to-[#06b6d4] flex items-center justify-center shadow-md shadow-[#7c3aed]/20"><BookOpen className="w-4 h-4 text-white" /></div>
        )}
        <div>
          {activeCourse ? (
            <><h2 className="font-bold text-[#f1f5f9]">{activeCourse.label}</h2><p className="text-xs text-[#94a3b8]">Select full course practice or a specific module</p></>
          ) : activeGroup ? (
            <><h2 className="font-bold text-[#f1f5f9]">{activeGroup.label}</h2><p className="text-xs text-[#94a3b8]">{activeGroup.tagline}</p></>
          ) : (
            <><h2 className="font-bold text-[#f1f5f9]">Quiz Templates</h2><p className="text-xs text-[#94a3b8]">Choose a vendor → course → practice full course or individual modules</p></>
          )}
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{[0,1,2].map(i => <div key={i} className="h-52 rounded-2xl glass animate-pulse" />)}</div>
      )}

      <AnimatePresence mode="wait">
        {!loading && !activeGroup && (
          <motion.div key="vendors" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {GROUPS.map((g, i) => {
              const stats = statsByGroup[g.groupKey] || { courses: 0, questions: 0 };
              const isEmpty = stats.courses === 0;
              return (
                <motion.button key={g.groupKey} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  whileHover={!isEmpty ? { scale: 1.025, y: -4 } : undefined} whileTap={!isEmpty ? { scale: 0.975 } : undefined}
                  onClick={() => !isEmpty && setActiveGroup(g)} disabled={isEmpty}
                  className={`text-left p-5 rounded-2xl relative overflow-hidden glass glass-hover ${isEmpty ? 'opacity-45 cursor-not-allowed' : 'cursor-pointer'}`}
                  style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.07)' }}>
                  <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${g.accent}, ${g.accent2}, transparent)` }} />
                  <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-3xl pointer-events-none" style={{ background: `${g.accent}18` }} />
                  <div className="mb-4"><VendorLogo g={g} /></div>
                  <p className="font-bold text-[#f1f5f9] text-base leading-tight mb-0.5">{g.label}</p>
                  <p className="text-[11px] text-[#64748b] mb-4 leading-snug">{g.tagline}</p>
                  {isEmpty ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-[#4a4a6a] px-2.5 py-1 rounded-full glass-sm">Coming soon</span>
                  ) : (
                    <div className="flex items-end justify-between">
                      <div className="flex gap-4">
                        <div><p className="text-xl font-black leading-none" style={{ color: g.accent }}>{stats.questions}</p><p className="text-[10px] text-[#64748b] mt-0.5">questions</p></div>
                        <div className="w-px bg-white/10 self-stretch" />
                        <div><p className="text-xl font-black leading-none text-[#f1f5f9]">{stats.courses}</p><p className="text-[10px] text-[#64748b] mt-0.5">courses</p></div>
                      </div>
                      <span className="flex items-center gap-0.5 text-xs font-semibold" style={{ color: g.accent }}>Browse <ChevronRight className="w-3.5 h-3.5" /></span>
                    </div>
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        )}

        {!loading && activeGroup && !activeCourse && (
          <motion.div key={activeGroup.groupKey} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {coursesForGroup.map((bank, i) => {
              const Icon = ICON_MAP[bank.icon] || Shield;
              const hasModules = !!(COURSE_MODULES[bank.course_code]?.length);
              return (
                <motion.button key={bank.course_code} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} onClick={() => setActiveCourse(bank)}
                  className="text-left p-4 rounded-xl glass glass-hover relative overflow-hidden group">
                  <div className="absolute top-0 left-0 right-0 h-[1.5px] opacity-70 group-hover:opacity-100 transition-opacity" style={{ background: bank.color }} />
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3 shadow-md" style={{ background: `${bank.color}18`, boxShadow: `0 4px 10px ${bank.color}20` }}>
                    <Icon className="w-5 h-5" style={{ color: bank.color }} />
                  </div>
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold mb-1.5" style={{ background: `${bank.color}18`, color: bank.color }}>
                    <BookOpen className="w-2.5 h-2.5" />{bank.code}
                  </div>
                  <p className="text-sm font-semibold text-[#f1f5f9] leading-tight mb-2 line-clamp-2">{bank.label}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-[#94a3b8]">{bank.total_questions} questions</span>
                      {hasModules && <span className="text-[10px] text-[#64748b]">{COURSE_MODULES[bank.course_code].length} modules</span>}
                    </div>
                    <span className="flex items-center gap-0.5 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: bank.color }}>Select <ChevronRight className="w-3 h-3" /></span>
                  </div>
                  <div className="mt-2 h-1 rounded-full bg-white/[0.06] overflow-hidden flex gap-0.5">
                    {(['Foundational','Intermediate','Advanced'] as const).map(d => {
                      const pct = bank.total_questions > 0 ? ((bank.by_difficulty[d]||0)/bank.total_questions)*100 : 0;
                      const colors = { Foundational:'#22c55e', Intermediate:'#f59e0b', Advanced:'#ef4444' };
                      return pct>0 ? <div key={d} className="h-full rounded-full" style={{ width:`${pct}%`, background:colors[d] }} title={`${d}: ${bank.by_difficulty[d]}`} /> : null;
                    })}
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        )}

        {!loading && activeCourse && (
          <motion.div key={activeCourse.course_code} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="space-y-6">
            <div>
              <p className="text-xs font-semibold text-[#64748b] uppercase tracking-widest mb-3 flex items-center gap-2"><GraduationCap className="w-3.5 h-3.5" /> Full Course Practice</p>
              <motion.button whileHover={{ scale: 1.01, y: -2 }} whileTap={{ scale: 0.99 }} onClick={() => setFullCourseModal(activeCourse)}
                className="w-full sm:w-auto text-left p-5 rounded-2xl relative overflow-hidden glass glass-hover group"
                style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)' }}>
                <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${activeCourse.color}, transparent)` }} />
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: `${activeCourse.color}18`, boxShadow: `0 4px 16px ${activeCourse.color}30` }}>
                    <Layers className="w-6 h-6" style={{ color: activeCourse.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-[#f1f5f9] text-base">{activeCourse.label}</p>
                      {isFree && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFC300]/20 text-[#FFC300] border border-[#FFC300]/30 shrink-0">
                          5 Q Free
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#94a3b8]">{activeCourse.total_questions} questions · Random mix from full bank</p>
                  </div>
                  <span className="ml-auto flex items-center gap-1 text-sm font-semibold opacity-60 group-hover:opacity-100 transition-opacity shrink-0" style={{ color: activeCourse.color }}>Generate <ChevronRight className="w-4 h-4" /></span>
                </div>
              </motion.button>
            </div>

            {modulesForCourse.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[#64748b] uppercase tracking-widest mb-3 flex items-center gap-2"><BookOpen className="w-3.5 h-3.5" /> Module-by-Module Practice</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {modulesForCourse.map((mod, idx) => {
                    const isLocked = isFree && idx > 0;
                    return (
                    <motion.button key={idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                      whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
                      onClick={() => isLocked ? setShowUpgrade(true) : setModuleModal({ module: mod, idx, course: activeCourse })}
                      className="text-left p-4 rounded-xl glass relative overflow-hidden group cursor-pointer">

                      {/* Lock overlay for Pro modules */}
                      {isLocked && (
                        <div className="absolute inset-0 rounded-xl z-10 flex flex-col items-center justify-center gap-1"
                          style={{ background: 'rgba(15,15,26,0.65)', backdropFilter: 'blur(2px)' }}>
                          <Lock className="w-5 h-5 text-[#FFC300]" />
                          <span className="text-[10px] font-black text-[#FFC300] uppercase tracking-widest">Pro</span>
                        </div>
                      )}

                      <div className={`flex items-start gap-3 ${isLocked ? 'opacity-30' : ''}`}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-black text-sm" style={{ background: `${activeCourse.color}18`, color: activeCourse.color }}>{idx+1}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#f1f5f9] leading-snug line-clamp-2">{mod}</p>
                          <div className={`flex items-center gap-1 mt-2 text-[11px] text-[#64748b] transition-opacity ${isLocked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                            {isLocked
                              ? <><Lock className="w-3 h-3 text-[#64748b]" /><span>Pro only</span></>
                              : <><BookOpen className="w-3 h-3" style={{ color: activeCourse.color }} /><span style={{ color: activeCourse.color }}>Practice or host quiz</span></>
                            }
                          </div>
                        </div>
                      </div>
                    </motion.button>
                    );
                  })}
                </div>
              </div>
            )}
            {modulesForCourse.length === 0 && (
              <div className="glass rounded-xl p-6 text-center text-[#64748b] text-sm">Module-level breakdown coming soon for this course.</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {fullCourseModal && <CQGenerateQuizModal bank={fullCourseModal} onClose={() => setFullCourseModal(null)} isFree={isFree} />}
        {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {moduleModal && <ModuleChoiceModal module={moduleModal.module} moduleIndex={moduleModal.idx} course={moduleModal.course} onClose={() => setModuleModal(null)} />}
      </AnimatePresence>
    </section>
  );
}
