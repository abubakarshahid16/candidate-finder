/* oxlint-disable */
'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Bell,
  ChevronDown,
  SlidersHorizontal,
  MapPin,
  BriefcaseBusiness,
  Check,
  Plus,
  ExternalLink,
  ShieldCheck,
  MoreHorizontal,
  FileText,
  Users,
  Settings,
  LayoutDashboard,
  ClipboardList,
  Database,
  X,
  ArrowUpRight,
} from 'lucide-react';

type Candidate = {
  id: string;
  name: string;
  title: string;
  company: string;
  location: string;
  locationType: string;
  roleCode?: string;
  industryCode?: string;
  educationCode?: string;
  experienceYears?: number | null;
  relocation?: boolean;
  remote?: boolean;
  score: number;
  confidence: string;
  initials: string;
  tone: string;
  skills: string[];
  evidence: string;
  updated: string;
  sourceUrl: string;
  retrievedAt: string;
  missingEvidence?: string[];
  scoreExplanation?: string;
  evidenceTimeline?: { claim: string; date: string; confidence: string }[];
  shortlisted?: boolean;
};

const candidates: Candidate[] = [
  {
    id: 'a',
    name: 'Noura Al-Harbi',
    title: 'Senior Data Engineer',
    company: 'STC',
    location: 'Riyadh, Saudi Arabia',
    locationType: 'Saudi Arabia',
    score: 92,
    confidence: 'High confidence',
    initials: 'NA',
    tone: 'from-[#dbe8de] to-[#a9c5b1]',
    skills: ['Python', 'Spark', 'Airflow', 'AWS'],
    evidence:
      'Current role and Python / Spark skills are explicitly supported by a recent public profile.',
    updated: 'Updated 2 hours ago',
    sourceUrl: 'https://example.com/noura-profile',
    retrievedAt: '2026-09-09T08:00:00Z',
    missingEvidence: ['Work authorization statement'],
    scoreExplanation:
      'Matched all required skills and exceeded the minimum experience requirement.',
    evidenceTimeline: [
      {
        claim: 'Current role: Senior Data Engineer at STC',
        date: '2026-09-09',
        confidence: 'High',
      },
      {
        claim: 'Skills: Python, Spark, Airflow, AWS',
        date: '2026-09-09',
        confidence: 'High',
      },
      {
        claim: 'Location: Riyadh, Saudi Arabia',
        date: '2026-09-09',
        confidence: 'Medium',
      },
    ],
    shortlisted: true,
  },
  {
    id: 'b',
    name: 'Oliver Chen',
    title: 'Data Platform Engineer',
    company: 'Monzo',
    location: 'London, United Kingdom',
    locationType: 'Outside Saudi Arabia',
    score: 86,
    confidence: 'High confidence',
    initials: 'OC',
    tone: 'from-[#e4e0f2] to-[#bcb5dc]',
    skills: ['Python', 'Spark', 'Kubernetes', 'GCP'],
    evidence:
      'Strong technical match. Public profile states willingness to relocate to Riyadh.',
    updated: 'Updated yesterday',
    sourceUrl: 'https://example.com/oliver-profile',
    retrievedAt: '2026-09-08T08:00:00Z',
    missingEvidence: ['Saudi work authorization'],
    scoreExplanation:
      'Matched the required technical skills; relocation evidence is explicit.',
  },
  {
    id: 'c',
    name: 'Hana Al-Mansour',
    title: 'Lead Analytics Engineer',
    company: 'Careem',
    location: 'Dubai, UAE',
    locationType: 'Outside Saudi Arabia',
    score: 81,
    confidence: 'Medium confidence',
    initials: 'HM',
    tone: 'from-[#f2dfd1] to-[#d5b09a]',
    skills: ['SQL', 'dbt', 'Snowflake', 'Python'],
    evidence:
      'Relevant role history and skills are cited. Work authorization is not stated.',
    updated: 'Updated 3 days ago',
    sourceUrl: 'https://example.com/hana-profile',
    retrievedAt: '2026-09-06T08:00:00Z',
    missingEvidence: ['Work authorization', 'Airflow'],
    scoreExplanation:
      'Strong adjacent analytics experience, with two requested evidence gaps.',
  },
  {
    id: 'd',
    name: 'Yusuf Rahman',
    title: 'Cloud Data Engineer',
    company: 'Aramco',
    location: 'Dhahran, Saudi Arabia',
    locationType: 'Saudi Arabia',
    score: 78,
    confidence: 'Medium confidence',
    initials: 'YR',
    tone: 'from-[#d5e5e8] to-[#9ebfc4]',
    skills: ['Azure', 'Databricks', 'SQL'],
    evidence:
      'Current employer and cloud experience are supported; Airflow evidence is missing.',
    updated: 'Updated 5 days ago',
    sourceUrl: 'https://example.com/yusuf-profile',
    retrievedAt: '2026-09-04T08:00:00Z',
    missingEvidence: ['Python', 'Spark', 'Airflow'],
    scoreExplanation:
      'Cloud experience is relevant, but several required data-engineering skills are not evidenced.',
  },
];

export default function Home() {
  const [selected, setSelected] = useState('a');
  const [shortlisted, setShortlisted] = useState<string[]>(['a']);
  const [query, setQuery] = useState('');
  const [liveCandidates, setLiveCandidates] = useState<Candidate[]>([]);
  const [_liveSearchState, setLiveSearchState] = useState<
    'idle' | 'loading' | 'ready' | 'error'
  >('idle');
  const [liveUrl, setLiveUrl] = useState('');
  const [liveCandidate, setLiveCandidate] = useState<{
    sourceUrl: string;
    retrievedAt: string;
    extractionMethod: string;
    confidence: number;
    profile: {
      headline: string | null;
      role: string;
      skills: string[];
      locationClassification: string;
    };
  } | null>(null);
  const [liveError, setLiveError] = useState('');
  const [sortBy, setSortBy] = useState<'match' | 'recent' | 'name'>('match');
  const [location, setLocation] = useState('All locations');
  const [showFilters] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [industry, setIndustry] = useState('Technology');
  const [role, setRole] = useState('Data engineering');
  useEffect(() => {
    const open = () => {
      setShowBuilder(true);
      setRole((current) =>
        current === 'Data engineering'
          ? 'AI engineering'
          : current === 'AI engineering'
            ? 'Machine learning engineering'
            : current === 'Machine learning engineering'
              ? 'DevOps engineering'
              : current === 'DevOps engineering'
                ? 'Data science'
                : current === 'Data science'
                  ? 'Software engineering'
                  : current === 'Software engineering'
                    ? 'Security engineering'
                    : 'Data engineering',
      );
    };
    window.addEventListener('candidate-finder:open-filters', open);
    return () =>
      window.removeEventListener('candidate-finder:open-filters', open);
  }, []);
  useEffect(() => {
    const term = query.trim();
    if (term.length < 3) {
      setLiveCandidates([]);
      setLiveSearchState('idle');
      return;
    }
    const timer = setTimeout(async () => {
      setLiveSearchState('loading');
      try {
        const response = await fetch(
          `http://localhost:3103/api/v1/providers/github/search?q=${encodeURIComponent(term)}`,
          { headers: { Authorization: 'Bearer dev-recruiter-token' } },
        );
        const body = (await response.json()) as {
          error?: string;
          candidates?: Candidate[];
        };
        if (!response.ok) throw new Error(body.error || 'live_search_failed');
        setLiveCandidates(
          (body.candidates || []).map((c: Candidate) => ({
            ...c,
            initials: c.name.slice(0, 2).toUpperCase(),
            tone: 'from-[#dbe8de] to-[#a9c5b1]',
            updated: 'Live just now',
            retrievedAt: c.retrievedAt,
            scoreExplanation: c.evidence,
          })),
        );
        setLiveSearchState('ready');
      } catch {
        setLiveCandidates([]);
        setLiveSearchState('error');
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [query]);
  const [education, setEducation] = useState("Bachelor's degree or higher");
  const [experience, setExperience] = useState('5–12 years');
  const [geography, setGeography] = useState(
    'Saudi Arabia or outside Saudi Arabia',
  );
  const [mustHave, setMustHave] = useState<string[]>(['Python', 'Spark']);
  const [excluded, setExcluded] = useState<string[]>([]);
  const visible = useMemo(() => {
    if (liveCandidates.length) return liveCandidates;
    const selectedRole = role.toLowerCase().includes('data science')
      ? 'data_science'
      : role.toLowerCase().includes('data')
        ? 'data_engineer'
        : role.toLowerCase().includes('software')
          ? 'software_engineer'
          : role.toLowerCase().includes('security')
            ? 'security_engineer'
            : '';
    const selectedGeography =
      geography === 'Saudi Arabia only'
        ? 'Saudi Arabia'
        : geography === 'Outside Saudi Arabia'
          ? 'Outside Saudi Arabia'
          : geography === 'Remote availability'
            ? 'remote'
            : geography === 'Willing to relocate'
              ? 'relocate'
              : '';
    const minExperience = experience.startsWith('5')
      ? 5
      : experience.startsWith('3')
        ? 3
        : experience.startsWith('12')
          ? 12
          : 0;
    const exp: Record<string, number> = { a: 8, b: 7, c: 6, d: 5 };
    const roleFor = (c: Candidate) =>
      c.roleCode ||
      (c.title.toLowerCase().includes('analytics')
        ? 'data_science'
        : c.title.toLowerCase().includes('data')
          ? 'data_engineer'
          : 'other');
    const isRemote = (c: Candidate) => c.remote ?? c.id === 'c';
    const canRelocate = (c: Candidate) => c.relocation ?? c.id === 'b';
    return candidates
      .filter(
        (c) =>
          (!query ||
            `${c.name} ${c.title} ${c.skills.join(' ')}`
              .toLowerCase()
              .includes(query.toLowerCase())) &&
          (!selectedRole || roleFor(c) === selectedRole) &&
          (location === 'All locations' || c.locationType === location) &&
          (!selectedGeography ||
            (selectedGeography === 'relocate'
              ? canRelocate(c)
              : selectedGeography === 'remote'
                ? isRemote(c)
                : c.locationType === selectedGeography)) &&
          (exp[c.id] ?? 0) >= minExperience &&
          mustHave.every((skill) =>
            c.skills.some((item) => item.toLowerCase() === skill.toLowerCase()),
          ),
      )
      .sort((a, b) =>
        sortBy === 'name'
          ? a.name.localeCompare(b.name)
          : sortBy === 'recent'
            ? a.updated.localeCompare(b.updated)
            : b.score - a.score,
      );
  }, [
    query,
    location,
    role,
    geography,
    experience,
    industry,
    education,
    mustHave,
    excluded,
    sortBy,
    liveCandidates,
  ]);
  const active =
    visible.find((c) => c.id === selected) ?? visible[0] ?? candidates[0];

  const toggleShortlist = (id: string) =>
    setShortlisted((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );
  const retrieveLive = async () => {
    setLiveError('');
    setLiveCandidate(null);
    try {
      const response = await fetch(
        'http://localhost:3103/api/v1/providers/ingest',
        {
          method: 'POST',
          headers: {
            Authorization: 'Bearer dev-recruiter-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: liveUrl }),
        },
      );
      const body = (await response.json()) as {
        error?: string;
        candidate?: NonNullable<typeof liveCandidate>;
      };
      if (!response.ok || !body.candidate)
        throw new Error(body.error || 'live_retrieval_failed');
      setLiveCandidate(body.candidate);
    } catch (error) {
      setLiveError(
        error instanceof Error ? error.message : 'live_retrieval_failed',
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f7f8] text-[#20252a]">
      <LiveRetrieval
        url={liveUrl}
        setUrl={setLiveUrl}
        candidate={liveCandidate}
        error={liveError}
        onRetrieve={retrieveLive}
      />
      <aside className="fixed inset-y-0 left-0 hidden w-[238px] border-r border-[#e2e5e7] bg-[#fbfcfc] px-4 py-5 lg:block">
        <div className="flex items-center gap-3 px-3">
          <div className="grid h-9 w-9 place-items-center rounded-[11px] bg-[#173f3b] text-sm font-bold text-white">
            CF
          </div>
          <div>
            <div className="text-[15px] font-bold tracking-tight">
              Candidate Finder
            </div>
            <div className="text-[11px] text-[#8b949b]">
              Talent intelligence
            </div>
          </div>
        </div>
        <div className="mt-10 space-y-1">
          <Nav icon={<LayoutDashboard size={17} />} label="Overview" />
          <Nav icon={<Search size={17} />} label="Candidate search" active />
          <Nav
            icon={<ClipboardList size={17} />}
            label="Requisitions"
            count="4"
          />
          <Nav
            icon={<Users size={17} />}
            label="Shortlists"
            count={String(shortlisted.length)}
          />
        </div>
        <div className="mt-9 px-3 text-[10px] font-bold uppercase tracking-[.14em] text-[#9da5aa]">
          Workspace
        </div>
        <div className="mt-3 space-y-1">
          <Nav icon={<Database size={17} />} label="Source center" />
          <Nav icon={<ShieldCheck size={17} />} label="Governance" />
          <Nav icon={<Settings size={17} />} label="Settings" />
        </div>
        <div className="absolute bottom-5 left-4 right-4 rounded-2xl border border-[#e1e5e4] bg-white p-3">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-[#e6d8c8] text-xs font-bold text-[#6f4e30]">
              AM
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold">Aisha Malik</div>
              <div className="text-[11px] text-[#89939a]">Recruiter</div>
            </div>
            <MoreHorizontal size={16} className="text-[#a1a9ae" />
          </div>
        </div>
      </aside>
      <main className="lg:ml-[238px]">
        <header className="flex h-[70px] items-center justify-between border-b border-[#e2e5e7] bg-white px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <button className="rounded-lg p-2 hover:bg-[#f1f3f3] lg:hidden">
              <MoreHorizontal size={19} />
            </button>
            <div>
              <div className="text-xs text-[#8c959b]">
                Workspace / Candidate search
              </div>
              <div className="text-[15px] font-semibold">
                Data Engineering — Riyadh
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 text-xs text-[#778187] sm:flex">
              <span className="h-2 w-2 rounded-full bg-[#52a27a]" /> All systems
              operational
            </div>
            <button className="relative rounded-lg p-2 text-[#68747a] hover:bg-[#f1f3f3]">
              <Bell size={18} />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#d2785d]" />
            </button>
            <button className="flex items-center gap-2 rounded-lg border border-[#e1e5e7] px-2.5 py-1.5 text-xs font-medium">
              <div className="grid h-5 w-5 place-items-center rounded-full bg-[#e6d8c8] text-[9px] font-bold text-[#6f4e30]">
                AM
              </div>
              <ChevronDown size={14} />
            </button>
          </div>
        </header>
        <div className="mx-auto max-w-[1540px] px-5 py-7 sm:px-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#5e8c7b]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#5eaa83]" />{' '}
                SEARCH COMPLETE{' '}
                <span className="font-normal text-[#9ba3a8]">
                  • 4 sources checked
                </span>
              </div>
              <h1 className="text-[27px] font-semibold tracking-[-.03em]">
                Find qualified candidates
              </h1>
              <p className="mt-1 text-sm text-[#78838a]">
                Reviewing matches for your open requisition
              </p>
            </div>
            <div className="flex gap-2">
              <button className="rounded-lg border border-[#dfe4e5] bg-white px-3 py-2 text-xs font-semibold text-[#58646a] shadow-sm">
                <FileText size={14} className="mr-2 inline" />
                Export
              </button>
              <button className="rounded-lg bg-[#173f3b] px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#24554f]">
                <Plus size={14} className="mr-1.5 inline" /> New search
              </button>
            </div>
          </div>
          <section className="mb-5 rounded-xl border border-[#dfe4e5] bg-white p-4 shadow-[0_2px_8px_rgba(20,30,35,.02)]">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[240px] flex-1">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#97a1a7]"
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search names, titles, skills..."
                  className="h-10 w-full rounded-lg border border-[#dfe4e5] bg-[#fbfcfc] pl-9 pr-3 text-sm outline-none ring-[#8cb7a2] focus:ring-2"
                />
              </div>
              <FilterButton
                icon={<BriefcaseBusiness size={15} />}
                label={role}
              />
              <FilterButton
                icon={<MapPin size={15} />}
                label={location}
                onClick={() =>
                  setLocation(
                    location === 'All locations'
                      ? 'Saudi Arabia'
                      : location === 'Saudi Arabia'
                        ? 'Outside Saudi Arabia'
                        : 'All locations',
                  )
                }
              />
              <button
                onClick={() => setShowBuilder(!showBuilder)}
                className={`flex h-10 items-center gap-2 rounded-lg border px-3 text-xs font-semibold ${showBuilder ? 'border-[#b9d2c6] bg-[#f0f7f2] text-[#276251]' : 'border-[#dfe4e5] bg-white text-[#657177]'}`}
              >
                <SlidersHorizontal size={15} /> Build filters{' '}
                <span className="grid h-4 min-w-4 place-items-center rounded-full bg-[#276251] px-1 text-[10px] text-white">
                  {mustHave.length + (excluded.length ? 1 : 0)}
                </span>
              </button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-[#7c878c]">
              <span>Active criteria:</span>
              <Chip label={experience} />
              <Chip label={mustHave.join(' · ')} />
              <Chip label={geography} />
              <button
                onClick={() => {
                  setMustHave([]);
                  setExcluded([]);
                  setQuery('');
                }}
                className="ml-1 font-semibold text-[#43816d]"
              >
                Clear all
              </button>
            </div>
          </section>
          {showBuilder && (
            <FilterBuilder
              industry={industry}
              setIndustry={setIndustry}
              role={role}
              setRole={setRole}
              education={education}
              setEducation={setEducation}
              experience={experience}
              setExperience={setExperience}
              geography={geography}
              setGeography={setGeography}
              mustHave={mustHave}
              setMustHave={setMustHave}
              excluded={excluded}
              setExcluded={setExcluded}
              onClose={() => setShowBuilder(false)}
            />
          )}
          {showBuilder && <RequirementProfileEditor />}
          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <CoverageCard
              label="Sources checked"
              value="4 / 4"
              detail="All submitted sources responded"
            />
            <CoverageCard
              label="Evidence coverage"
              value="92%"
              detail="Claims linked to source records"
            />
            <CoverageCard
              label="Latest retrieval"
              value="2 hours ago"
              detail="Timestamps retained per source"
            />
          </div>
          <div className="mb-5 grid gap-3 md:grid-cols-3">
            <SourceMeta
              url={active.sourceUrl}
              retrievedAt={active.retrievedAt}
            />
            <AtsExplanation
              score={active.score}
              confidence={active.confidence}
              explanation={active.scoreExplanation || active.evidence}
              missingEvidence={active.missingEvidence || []}
            />
            <EvidenceTimeline
              items={
                active.evidenceTimeline || [
                  {
                    claim: active.evidence,
                    date: active.retrievedAt.slice(0, 10),
                    confidence: active.confidence.replace(' confidence', ''),
                  },
                ]
              }
            />
          </div>
          <ComparisonPanel
            left={active}
            right={
              candidates.find((candidate) => candidate.id !== active.id) ||
              active
            }
          />
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
            <section>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold">
                    {visible.length} matches
                  </span>
                  <span className="ml-2 text-xs text-[#8d969b]">
                    filtered and ranked
                  </span>
                </div>
                <button
                  onClick={() =>
                    setSortBy(
                      sortBy === 'match'
                        ? 'recent'
                        : sortBy === 'recent'
                          ? 'name'
                          : 'match',
                    )
                  }
                  className="flex items-center gap-1 text-xs font-semibold text-[#68747a]"
                >
                  {sortBy === 'match'
                    ? 'Best match'
                    : sortBy === 'recent'
                      ? 'Most recent'
                      : 'Name'}{' '}
                  <ChevronDown size={14} />
                </button>
              </div>
              {showFilters && (
                <div className="mb-4 hidden gap-2 md:flex">
                  <div className="rounded-lg border border-[#e0e5e5] bg-white px-3 py-2 text-xs">
                    <span className="text-[#8d969b]">Experience</span>
                    <div className="mt-1 font-semibold">5–12 years</div>
                  </div>
                  <div className="rounded-lg border border-[#e0e5e5] bg-white px-3 py-2 text-xs">
                    <span className="text-[#8d969b]">Must-have skills</span>
                    <div className="mt-1 font-semibold">Python · Spark</div>
                  </div>
                  <div className="rounded-lg border border-[#e0e5e5] bg-white px-3 py-2 text-xs">
                    <span className="text-[#8d969b]">Evidence freshness</span>
                    <div className="mt-1 font-semibold">Last 12 months</div>
                  </div>
                </div>
              )}
              {visible.map((c) => (
                <CandidateRow
                  key={c.id}
                  candidate={c}
                  active={selected === c.id}
                  shortlisted={shortlisted.includes(c.id)}
                  onSelect={() => setSelected(c.id)}
                  onShortlist={() => toggleShortlist(c.id)}
                />
              ))}
            </section>
            <aside className="rounded-xl border border-[#dfe4e5] bg-white shadow-[0_2px_8px_rgba(20,30,35,.03)]">
              <div className="flex items-center justify-between border-b border-[#edf0f0] px-5 py-4">
                <div className="text-xs font-bold uppercase tracking-[.12em] text-[#748087]">
                  Candidate profile
                </div>
                <button
                  onClick={() => setSelected('')}
                  className="rounded-md p-1 text-[#9aa3a8] hover:bg-[#f4f6f6]"
                >
                  <X size={16} />
                </button>
              </div>
              {active && (
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br ${active.tone} text-sm font-bold text-[#315048]`}
                      >
                        {active.initials}
                      </div>
                      <div>
                        <h2 className="text-base font-semibold">
                          {active.name}
                        </h2>
                        <p className="text-xs text-[#738087]">{active.title}</p>
                        <p className="mt-0.5 text-xs text-[#98a1a6]">
                          {active.company}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleShortlist(active.id)}
                      className={`rounded-lg p-2 ${shortlisted.includes(active.id) ? 'bg-[#e8f3ec] text-[#43816d]' : 'bg-[#f3f5f5] text-[#7c878c]'}`}
                    >
                      <Check size={16} />
                    </button>
                  </div>
                  <div className="mt-5 flex items-center gap-4 rounded-xl bg-[#f3f8f4] p-3">
                    <div className="text-center">
                      <div className="text-[26px] font-semibold tracking-tight text-[#28604e]">
                        {active.score}
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-wide text-[#6d8980]">
                        ATS score
                      </div>
                    </div>
                    <div className="h-9 w-px bg-[#d9e7dd]" />
                    <div>
                      <div className="text-xs font-semibold text-[#3c6759]">
                        {active.confidence}
                      </div>
                      <div className="mt-1 text-[11px] text-[#7a9087]">
                        Based on 8 evidence items
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 space-y-4">
                    <Detail
                      label="Current location"
                      value={active.location}
                      icon={<MapPin size={15} />}
                    />
                    <Detail
                      label="Location classification"
                      value={active.locationType}
                      icon={<ShieldCheck size={15} />}
                    />
                    <Detail
                      label="Experience"
                      value="8 years · dated roles"
                      icon={<BriefcaseBusiness size={15} />}
                    />
                  </div>
                  <div className="mt-5">
                    <div className="mb-2 text-xs font-bold uppercase tracking-[.1em] text-[#7c878c]">
                      Skills evidence
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {active.skills.map((s) => (
                        <span
                          key={s}
                          className="rounded-md border border-[#dce8df] bg-[#f5faf6] px-2 py-1 text-[11px] font-medium text-[#39705b]"
                        >
                          <Check size={11} className="mr-1 inline" />
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-5 rounded-lg border border-[#e7e9e9] bg-[#fbfcfc] p-3">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#5d6b71]">
                      <ShieldCheck size={13} className="text-[#5e997f]" />{' '}
                      Evidence-backed match
                    </div>
                    <p className="mt-1.5 text-xs leading-5 text-[#69757b]">
                      {active.evidence}
                    </p>
                    <button className="mt-2 text-[11px] font-semibold text-[#43816d]">
                      View all evidence{' '}
                      <ArrowUpRight size={12} className="inline" />
                    </button>
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-[#edf0f0] pt-4 text-[11px] text-[#919ba0]">
                    <span>{active.updated}</span>
                    <button className="font-semibold text-[#43816d]">
                      Open full profile{' '}
                      <ExternalLink size={12} className="ml-1 inline" />
                    </button>
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

function Nav({
  icon,
  label,
  active,
  count,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  count?: string;
}) {
  return (
    <button
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium ${active ? 'bg-[#e7f1eb] text-[#276251]' : 'text-[#68747b] hover:bg-[#f0f3f3]'}`}
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
      {count && <span className="text-[11px] text-[#8c989d]">{count}</span>}
    </button>
  );
}
function FilterButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={
        onClick ||
        (() => window.dispatchEvent(new Event('candidate-finder:open-filters')))
      }
      className="flex h-10 items-center gap-2 rounded-lg border border-[#dfe4e5] bg-white px-3 text-xs font-semibold text-[#58646a] hover:border-[#b8cbc0]"
    >
      {icon}
      {label}
      <ChevronDown size={13} className="ml-1 text-[#9aa4a9]" />
    </button>
  );
}
function Chip({ label }: { label: string }) {
  return (
    <span className="rounded-md bg-[#f1f4f3] px-2 py-1 text-[#617078]">
      {label}
    </span>
  );
}
function FilterBuilder({
  industry,
  setIndustry,
  role,
  setRole,
  education,
  setEducation,
  experience,
  setExperience,
  geography,
  setGeography,
  mustHave,
  setMustHave,
  excluded,
  setExcluded,
  onClose,
}: {
  industry: string;
  setIndustry: (v: string) => void;
  role: string;
  setRole: (v: string) => void;
  education: string;
  setEducation: (v: string) => void;
  experience: string;
  setExperience: (v: string) => void;
  geography: string;
  setGeography: (v: string) => void;
  mustHave: string[];
  setMustHave: (v: string[]) => void;
  excluded: string[];
  setExcluded: (v: string[]) => void;
  onClose: () => void;
}) {
  const [customIndustries, setCustomIndustries] = useState<string[]>([]);
  const addCustomIndustry = () => {
    const value = window.prompt('Enter an industry');
    const customIndustry = value?.trim();
    if (customIndustry && !customIndustries.includes(customIndustry)) {
      setCustomIndustries([...customIndustries, customIndustry]);
      setIndustry(customIndustry);
    }
  };
  const [customRoles, setCustomRoles] = useState<string[]>([]);
  const addCustomRole = () => {
    const value = window.prompt('Enter a profession or role');
    const customRole = value?.trim();
    if (customRole && !customRoles.includes(customRole)) {
      setCustomRoles([...customRoles, customRole]);
      setRole(customRole);
    }
  };
  const skillOptions = [
    'Python',
    'Spark',
    'Airflow',
    'SQL',
    'AWS',
    'Kubernetes',
    '＋ Add custom skill',
  ];
  const addCustomSkill = () => {
    const value = window.prompt('Enter a skill');
    const skill = value?.trim();
    if (skill && !mustHave.includes(skill)) setMustHave([...mustHave, skill]);
  };
  const toggle = (
    value: string,
    values: string[],
    setter: (v: string[]) => void,
  ) => {
    if (value === '＋ Add custom skill') return addCustomSkill();
    setter(
      values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value],
    );
  };
  return (
    <section className="mb-5 rounded-xl border border-[#c9ddd0] bg-[#fbfefc] p-5 shadow-[0_8px_25px_rgba(30,75,55,.06)]">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="text-sm font-semibold">
            Structured search criteria
          </div>
          <p className="mt-1 text-xs text-[#7c8983]">
            Set job-relevant requirements. Unknown evidence stays unknown.
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-xs font-semibold text-[#43816d]"
        >
          Done
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Field label="Industry">
          <select
            className="h-10 w-full rounded-lg border border-[#dbe6df] bg-white px-3 text-xs font-medium text-[#4f6258]"
            value={industry}
            onChange={(e) => e.target.value === '__custom__' ? addCustomIndustry() : setIndustry(e.target.value)}
          >
            <option>Technology</option>
            <option>Financial services</option>
            <option>Telecommunications</option>
            <option>Energy</option>
            <option>Healthcare</option>
            {customIndustries.map((customIndustry) => <option key={customIndustry}>{customIndustry}</option>)}
            <option value="__custom__">＋ Add custom industry</option>
          </select>
        </Field>
        <Field label="Profession / role">
          <select
            className="h-10 w-full rounded-lg border border-[#dbe6df] bg-white px-3 text-xs font-medium text-[#4f6258]"
            value={role}
            onChange={(e) => e.target.value === '__custom__' ? addCustomRole() : setRole(e.target.value)}
          >
            <option>Data engineering</option>
            <option>Software engineering</option>
            <option>Data science</option>
            <option>Security engineering</option>
            <option>Product management</option>
            {customRoles.map((customRole) => <option key={customRole}>{customRole}</option>)}
            <option value="__custom__">＋ Add custom profession</option>
          </select>
        </Field>
        <Field label="Experience">
          <select
            className="h-10 w-full rounded-lg border border-[#dbe6df] bg-white px-3 text-xs font-medium text-[#4f6258]"
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
          >
            <option>Any experience</option>
            <option>0–3 years</option>
            <option>3–5 years</option>
            <option>5–12 years</option>
            <option>12+ years</option>
          </select>
        </Field>
        <Field label="Education">
          <select
            className="h-10 w-full rounded-lg border border-[#dbe6df] bg-white px-3 text-xs font-medium text-[#4f6258]"
            value={education}
            onChange={(e) => setEducation(e.target.value)}
          >
            <option>Any education</option>
            <option>Associate degree or higher</option>
            <option>Bachelor's degree or higher</option>
            <option>Master's degree or higher</option>
            <option>Professional certification</option>
          </select>
        </Field>
        <Field label="Preferred geography">
          <select
            className="h-10 w-full rounded-lg border border-[#dbe6df] bg-white px-3 text-xs font-medium text-[#4f6258]"
            value={geography}
            onChange={(e) => setGeography(e.target.value)}
          >
            <option>Saudi Arabia or outside Saudi Arabia</option>
            <option>Saudi Arabia only</option>
            <option>Outside Saudi Arabia</option>
            <option>Remote availability</option>
            <option>Willing to relocate</option>
            <option>Unknown only</option>
          </select>
        </Field>
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-[#7f8c87]">
            Skills · must have
          </label>
          <div className="flex flex-wrap gap-1.5">
            {skillOptions.map((skill) => (
              <button
                key={skill}
                onClick={() => toggle(skill, mustHave, setMustHave)}
                className={`rounded-md border px-2 py-1.5 text-[11px] font-medium ${mustHave.includes(skill) ? 'border-[#a9cdb6] bg-[#e9f5ed] text-[#36705a]' : 'border-[#dfe7e1] bg-white text-[#718078]'}`}
              >
                {mustHave.includes(skill) && (
                  <Check size={11} className="mr-1 inline" />
                )}
                {skill}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 border-t border-[#e5eee8] pt-4">
        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-[#7f8c87]">
          Skills · exclude
        </label>
        <div className="flex flex-wrap gap-1.5">
          {['On-site only', 'No relocation', 'Unverified profiles'].map(
            (item) => (
              <button
                key={item}
                onClick={() => toggle(item, excluded, setExcluded)}
                className={`rounded-md border px-2 py-1.5 text-[11px] font-medium ${excluded.includes(item) ? 'border-[#e8b8a9] bg-[#fff2ee] text-[#a45d48]' : 'border-[#dfe7e1] bg-white text-[#718078]'}`}
              >
                {excluded.includes(item) && (
                  <Check size={11} className="mr-1 inline" />
                )}
                {item}
              </button>
            ),
          )}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between text-[11px] text-[#839089]">
        <span>
          {industry} · {role} · {experience} · {geography}
        </span>
        <button
          onClick={onClose}
          className="rounded-lg bg-[#173f3b] px-3 py-2 text-xs font-semibold text-white"
        >
          Apply criteria
        </button>
      </div>
    </section>
  );
}
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-[#7f8c87]">
        {label}
      </span>
      {children}
    </label>
  );
}
function CandidateRow({
  candidate: c,
  active,
  shortlisted,
  onSelect,
  onShortlist,
}: {
  candidate: Candidate;
  active: boolean;
  shortlisted: boolean;
  onSelect: () => void;
  onShortlist: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`group mb-2.5 cursor-pointer rounded-xl border bg-white p-4 transition hover:border-[#b7cec0] hover:shadow-[0_5px_18px_rgba(34,80,60,.06)] ${active ? 'border-[#8eb8a1] ring-1 ring-[#d4e6da]' : 'border-[#e0e5e5]'}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br ${c.tone} text-xs font-bold text-[#315048]`}
        >
          {c.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">{c.name}</span>
            <span className="rounded-full bg-[#eef6f0] px-2 py-0.5 text-[10px] font-semibold text-[#4b856d]">
              {c.locationType}
            </span>
          </div>
          <div className="mt-0.5 text-xs text-[#5f6c72]">
            {c.title} <span className="text-[#9aa3a8]">at</span> {c.company}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#889399]">
            <span>
              <MapPin size={12} className="mr-1 inline text-[#9badb0]" />
              {c.location}
            </span>
            <span>
              <ShieldCheck size={12} className="mr-1 inline text-[#71a187]" />
              {c.confidence}
            </span>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="text-right">
            <div className="text-[22px] font-semibold tracking-tight text-[#28604e]">
              {c.score}
            </div>
            <div className="text-[10px] uppercase tracking-wide text-[#9ba5a9]">
              match
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShortlist();
            }}
            aria-label="Shortlist candidate"
            className={`mt-1 rounded-md p-1.5 ${shortlisted ? 'bg-[#e6f2e9] text-[#43816d]' : 'text-[#a0a8ac] hover:bg-[#f1f4f3]'}`}
          >
            {shortlisted ? <Check size={16} /> : <Plus size={16} />}
          </button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-[#eff1f1] pt-3">
        <span className="mr-1 text-[10px] font-bold uppercase tracking-wide text-[#a0a8ac]">
          Evidence
        </span>
        {c.skills.map((s) => (
          <span
            key={s}
            className="rounded bg-[#f5f6f6] px-1.5 py-1 text-[10px] text-[#68757a]"
          >
            {s}
          </span>
        ))}
        <span className="ml-auto text-[10px] text-[#a0a8ac]">{c.updated}</span>
      </div>
    </div>
  );
}
function Detail({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="text-[#7e9f90]">{icon}</div>
      <div>
        <div className="text-[10px] uppercase tracking-wide text-[#9aa3a7]">
          {label}
        </div>
        <div className="mt-0.5 text-xs font-medium text-[#4f5b61]">{value}</div>
      </div>
    </div>
  );
}
function SourceMeta({
  url,
  retrievedAt,
}: {
  url: string;
  retrievedAt: string;
}) {
  return (
    <div className="mt-3 rounded-lg border border-[#e5e9e8] bg-white p-3">
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#5d6b71]">
        <Database size={13} className="text-[#5e997f]" /> Source provenance
      </div>
      <a
        className="mt-1 block truncate text-[11px] font-medium text-[#43816d] underline-offset-2 hover:underline"
        href={url}
        target="_blank"
        rel="noreferrer"
      >
        {url}
      </a>
      <div className="mt-1 text-[10px] text-[#8a969b]">
        Retrieved{' '}
        {new Date(retrievedAt).toISOString().replace('T', ' ').slice(0, 16)} UTC
      </div>
    </div>
  );
}
function CoverageCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-[#dfe4e5] bg-white p-4">
      <div className="text-[10px] font-bold uppercase tracking-wide text-[#8a969b]">
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold text-[#28604e]">{value}</div>
      <div className="mt-0.5 text-[11px] text-[#7c878c]">{detail}</div>
    </div>
  );
}
function LiveRetrieval({
  url,
  setUrl,
  candidate,
  error,
  onRetrieve,
}: {
  url: string;
  setUrl: (value: string) => void;
  candidate: {
    sourceUrl: string;
    retrievedAt: string;
    extractionMethod: string;
    confidence: number;
    profile: { headline: string | null; role: string; skills: string[] };
  } | null;
  error: string;
  onRetrieve: () => void;
}) {
  return (
    <section className="fixed bottom-5 right-5 z-20 w-[min(420px,calc(100vw-2rem))] rounded-xl border border-[#b9d2c6] bg-white p-4 shadow-lg">
      <div className="text-sm font-semibold">Live public-profile retrieval</div>
      <div className="mt-1 text-xs text-[#6f8078]">
        Use a public URL you are permitted to access.
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://example.com/profile"
          className="h-9 min-w-0 flex-1 rounded-lg border border-[#dfe4e5] px-2 text-xs"
        />
        <button
          onClick={onRetrieve}
          disabled={!url.trim()}
          className="rounded-lg bg-[#173f3b] px-3 text-xs font-semibold text-white disabled:opacity-50"
        >
          Retrieve
        </button>
      </div>
      {error && <div className="mt-2 text-xs text-[#a45d48]">{error}</div>}
      {candidate && (
        <div className="mt-3 border-t border-[#edf0f0] pt-3">
          <div className="text-xs font-semibold text-[#28604e]">
            {candidate.profile.headline || 'Profile retrieved'}
          </div>
          <div className="mt-1 text-[11px] text-[#69757b]">
            {candidate.profile.role} ·{' '}
            {candidate.profile.skills.join(', ') || 'No skills detected'}
          </div>
          <div className="mt-1 text-[10px] text-[#8a969b]">
            {candidate.extractionMethod} · {candidate.retrievedAt}
          </div>
        </div>
      )}
    </section>
  );
}
function AtsExplanation({
  score,
  confidence,
  explanation,
  missingEvidence,
}: {
  score: number;
  confidence: string;
  explanation: string;
  missingEvidence: string[];
}) {
  return (
    <div className="rounded-xl border border-[#dfe4e5] bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#748087]">
          <ShieldCheck size={14} className="text-[#5e997f]" /> ATS explanation
        </div>
        <span className="text-xs font-semibold text-[#28604e]">
          {score}/100 · {confidence}
        </span>
      </div>
      <p className="mt-2 text-xs leading-5 text-[#5f6c72]">{explanation}</p>
      {missingEvidence.length > 0 && (
        <div className="mt-3">
          <div className="text-[10px] font-bold uppercase tracking-wide text-[#9a6b5b]">
            Missing evidence
          </div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {missingEvidence.map((item) => (
              <span
                key={item}
                className="rounded-md bg-[#fff3ef] px-2 py-1 text-[11px] text-[#a45d48]"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
function EvidenceTimeline({
  items,
}: {
  items: { claim: string; date: string; confidence: string }[];
}) {
  return (
    <div className="rounded-xl border border-[#dfe4e5] bg-white p-4">
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#748087]">
        <ClipboardList size={14} className="text-[#5e997f]" /> Evidence timeline
      </div>
      <div className="mt-2 space-y-2">
        {items.map((item) => (
          <div
            key={`${item.date}-${item.claim}`}
            className="border-l-2 border-[#c9ddd0] pl-2"
          >
            <div className="text-[11px] leading-4 text-[#5f6c72]">
              {item.claim}
            </div>
            <div className="mt-0.5 text-[10px] text-[#8a969b]">
              {item.date} · {item.confidence} confidence
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function ComparisonPanel({
  left,
  right,
}: {
  left: Candidate;
  right: Candidate;
}) {
  return (
    <section className="mb-5 rounded-xl border border-[#dfe4e5] bg-white p-4">
      <div className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#748087]">
        <Users size={14} className="text-[#5e997f]" /> Side-by-side comparison
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {[left, right].map((candidate) => (
          <div
            key={candidate.id}
            className="rounded-lg border border-[#edf0f0] bg-[#fbfcfc] p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">{candidate.name}</span>
              <span className="text-lg font-semibold text-[#28604e]">
                {candidate.score}
              </span>
            </div>
            <div className="mt-1 text-xs text-[#68757a]">
              {candidate.title} · {candidate.location}
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {candidate.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded bg-white px-1.5 py-1 text-[10px] text-[#68757a]"
                >
                  {skill}
                </span>
              ))}
            </div>
            <div className="mt-2 text-[11px] text-[#7c878c]">
              {candidate.confidence} · {candidate.missingEvidence?.length || 0}{' '}
              evidence gaps
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
function RequirementProfileEditor() {
  const [requirements, setRequirements] = useState([
    'python',
    'spark',
    '5+ years experience',
  ]);
  const [draft, setDraft] = useState('');
  const add = () => {
    const value = draft.trim();
    if (value && !requirements.includes(value))
      setRequirements([...requirements, value]);
    setDraft('');
  };
  return (
    <section className="mb-5 rounded-xl border border-[#c9ddd0] bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">
            Editable JD requirement profile
          </div>
          <div className="mt-1 text-xs text-[#7c878c]">
            Review and adjust extracted requirements before scoring.
          </div>
        </div>
        <span className="rounded-full bg-[#e9f5ed] px-2 py-1 text-[10px] font-semibold text-[#39705b]">
          Draft
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {requirements.map((requirement) => (
          <button
            key={requirement}
            onClick={() =>
              setRequirements(
                requirements.filter((item) => item !== requirement),
              )
            }
            className="rounded-md border border-[#dce8df] bg-[#f5faf6] px-2 py-1 text-[11px] text-[#39705b]"
          >
            {requirement} ×
          </button>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') add();
          }}
          placeholder="Add requirement"
          className="h-9 flex-1 rounded-lg border border-[#dfe4e5] px-3 text-xs"
        />
        <button
          onClick={add}
          className="rounded-lg bg-[#173f3b] px-3 text-xs font-semibold text-white"
        >
          Add
        </button>
      </div>
    </section>
  );
}
