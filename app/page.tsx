'use client';

import {
  AlertCircle,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  CircleGauge,
  Clock3,
  ExternalLink,
  FileText,
  GraduationCap,
  LayoutList,
  LoaderCircle,
  MapPin,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  UploadCloud,
  Users,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';

type Screen = 'search' | 'results' | 'settings';
type SearchState = 'idle' | 'loading' | 'error';

type Candidate = {
  id: string;
  name: string;
  title: string;
  skills: string[];
  experienceYears: number | null;
  education: string;
  location: string;
  locationClassification: string;
  atsScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  confidence: string;
  evidenceConfidence: string;
  explanation: string;
  recommendation: string;
  scoreBreakdown: Record<string, number>;
  sourceUrl: string;
  label: string;
};

const initialForm = {
  role: '',
  industry: '',
  skills: '',
  experienceMin: '',
  experienceMax: '',
  location: '',
};

const presets = [
  { name: 'Data Engineer', role: 'Data Engineer', industry: 'Technology', skills: 'Python, SQL, Spark', experienceMin: '3', experienceMax: '10', location: 'Saudi Arabia' },
  { name: 'Data Scientist', role: 'Data Scientist', industry: 'Technology', skills: 'Python, SQL, Machine Learning', experienceMin: '2', experienceMax: '8', location: 'Saudi Arabia' },
  { name: 'Software Engineer', role: 'Software Engineer', industry: 'Technology', skills: 'JavaScript, TypeScript, React', experienceMin: '2', experienceMax: '10', location: 'Outside Saudi Arabia' },
  { name: 'Security Engineer', role: 'Security Engineer', industry: 'Cybersecurity', skills: 'SIEM, Cloud Security, Incident Response', experienceMin: '3', experienceMax: '12', location: 'Saudi Arabia' },
];

const suggestedSkills = ['Python', 'SQL', 'Spark', 'Machine Learning', 'JavaScript', 'TypeScript', 'React', 'AWS'];
const breakdownLabels: Record<string, string> = {
  requiredSkills: 'Required skills',
  roleTitle: 'Role and title',
  experience: 'Experience range',
  education: 'Education',
  geography: 'Location / relocation',
  industry: 'Industry',
};
const breakdownMaximums: Record<string, number> = {
  requiredSkills: 40,
  roleTitle: 20,
  experience: 15,
  education: 10,
  geography: 10,
  industry: 5,
};

export default function Home() {
  const [screen, setScreen] = useState<Screen>('search');
  const [form, setForm] = useState(initialForm);
  const [profileUrl, setProfileUrl] = useState('');
  const [prompt, setPrompt] = useState('');
  const [jdFileName, setJdFileName] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [state, setState] = useState<SearchState>('idle');
  const [error, setError] = useState('');

  const metrics = useMemo(() => {
    const scores = candidates.map((candidate) => candidate.atsScore);
    return {
      top: scores.length ? Math.max(...scores) : 0,
      average: scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0,
      sourced: candidates.filter((candidate) => candidate.sourceUrl).length,
    };
  }, [candidates]);

  const addSkill = (skill: string) => {
    const current = form.skills.split(',').map((item) => item.trim()).filter(Boolean);
    if (!current.some((item) => item.toLowerCase() === skill.toLowerCase())) {
      setForm({ ...form, skills: [...current, skill].join(', ') });
    }
  };

  const resetSearch = () => {
    setForm(initialForm);
    setProfileUrl('');
    setPrompt('');
    setJdFileName('');
    setCustomLocation('');
    setError('');
    setState('idle');
  };

  const search = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    const minimum = Number(form.experienceMin);
    const maximum = Number(form.experienceMax);
    if (maximum < minimum) {
      setError('Maximum experience must be greater than or equal to minimum experience.');
      setState('error');
      return;
    }

    setState('loading');
    setError('');
    setCandidates([]);
    setSelected(null);
    try {
      const response = await fetch('http://localhost:3001/api/v1/candidate-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          role: form.role,
          industry: form.industry,
          skills: form.skills.split(',').map((skill) => skill.trim()).filter(Boolean),
          experienceMin: minimum,
          experienceMax: maximum,
          location: form.location === 'Custom' ? customLocation : form.location,
          limit: 10,
          publicProfileUrls: profileUrl.trim() ? [profileUrl.trim()] : [],
        }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        details?: string[];
        error?: string;
        detail?: string;
        candidates?: Candidate[];
      };
      if (!response.ok) throw new Error(body.details?.join(', ') || body.error || body.detail || 'Search failed');
      if (!Array.isArray(body.candidates) || body.candidates.some((candidate) => typeof candidate.atsScore !== 'number')) {
        throw new Error('Search response did not contain valid scored candidates.');
      }
      setCandidates(body.candidates);
      setScreen('results');
      setState('idle');
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Search failed';
      setError(message === 'Failed to fetch'
        ? 'Cannot reach the candidate-search API. Make sure the API is running on http://localhost:3001, then try again.'
        : message);
      setState('error');
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f6f8] text-[#12232f]">
      <Sidebar screen={screen} candidates={candidates.length} onNavigate={setScreen} />

      <main className="min-h-screen md:ml-[264px]">
        <Topbar screen={screen} />
        <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 md:px-8 md:py-8">
          {screen === 'search' && (
            <SearchWorkspace
              form={form}
              setForm={setForm}
              profileUrl={profileUrl}
              setProfileUrl={setProfileUrl}
              prompt={prompt}
              setPrompt={setPrompt}
              jdFileName={jdFileName}
              setJdFileName={setJdFileName}
              customLocation={customLocation}
              setCustomLocation={setCustomLocation}
              state={state}
              error={error}
              addSkill={addSkill}
              resetSearch={resetSearch}
              search={search}
            />
          )}
          {screen === 'results' && (
            <ResultsWorkspace
              candidates={candidates}
              metrics={metrics}
              onNewSearch={() => setScreen('search')}
              onSelect={setSelected}
            />
          )}
          {screen === 'settings' && <SettingsWorkspace />}
        </div>
      </main>

      {selected && <CandidateSheet candidate={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function Sidebar({ screen, candidates, onNavigate }: { screen: Screen; candidates: number; onNavigate: (screen: Screen) => void }) {
  const items = [
    { id: 'search' as const, label: 'Candidate search', icon: Search },
    { id: 'results' as const, label: 'Results', icon: LayoutList },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];
  return (
    <aside className="relative z-20 w-full bg-[#0d2230] text-white md:fixed md:inset-y-0 md:left-0 md:w-[264px]">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-5 md:block md:border-b-0 md:px-6 md:py-7">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#35d0a0] text-[#09221d] shadow-[0_8px_24px_rgba(53,208,160,.25)]">
            <Target size={21} strokeWidth={2.4} />
          </div>
          <div>
            <div className="text-[15px] font-bold tracking-tight">Candidate Finder</div>
            <div className="text-xs text-slate-400">Recruiting intelligence</div>
          </div>
        </div>
        <div className="mt-8 hidden border-t border-white/10 pt-6 text-[11px] font-semibold uppercase tracking-[.18em] text-slate-500 md:block">Workspace</div>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-4 md:block md:space-y-1 md:px-4 md:pb-0">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.id === screen;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`flex min-w-max items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition md:w-full ${active ? 'bg-white text-[#102732] shadow-lg' : 'text-slate-300 hover:bg-white/7 hover:text-white'}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
              {item.id === 'results' && candidates > 0 && <span className="ml-auto rounded-full bg-[#dff9ee] px-2 py-0.5 text-xs text-[#087455]">{candidates}</span>}
            </button>
          );
        })}
      </nav>
      <div className="absolute inset-x-5 bottom-6 hidden rounded-2xl border border-white/10 bg-white/[.06] p-4 md:block">
        <div className="flex items-center gap-2 text-sm font-semibold"><span className="h-2 w-2 rounded-full bg-[#35d0a0]" /> Local service online</div>
        <p className="mt-2 text-xs leading-5 text-slate-400">Public evidence only. Authentication is disabled for local development.</p>
      </div>
    </aside>
  );
}

function Topbar({ screen }: { screen: Screen }) {
  const titles: Record<Screen, string> = { search: 'Search workspace', results: 'Ranked results', settings: 'Local settings' };
  return (
    <header className="hidden h-[72px] items-center justify-between border-b border-[#dce5e9] bg-white/85 px-8 backdrop-blur md:flex">
      <div className="flex items-center gap-2 text-sm text-slate-500"><span>Candidate Finder</span><ChevronRight size={14} /><span className="font-semibold text-[#153342]">{titles[screen]}</span></div>
      <div className="flex items-center gap-2 rounded-full border border-[#d8e6e2] bg-[#f4fbf8] px-3 py-1.5 text-xs font-semibold text-[#176950]"><ShieldCheck size={15} /> Job-relevant scoring only</div>
    </header>
  );
}

type FormState = typeof initialForm;
type SearchWorkspaceProps = {
  form: FormState;
  setForm: (form: FormState) => void;
  profileUrl: string;
  setProfileUrl: (value: string) => void;
  prompt: string;
  setPrompt: (value: string) => void;
  jdFileName: string;
  setJdFileName: (value: string) => void;
  customLocation: string;
  setCustomLocation: (value: string) => void;
  state: SearchState;
  error: string;
  addSkill: (skill: string) => void;
  resetSearch: () => void;
  search: (event: { preventDefault: () => void }) => Promise<void>;
};

function SearchWorkspace(props: SearchWorkspaceProps) {
  const { form, setForm, profileUrl, setProfileUrl, prompt, setPrompt, jdFileName, setJdFileName, customLocation, setCustomLocation, state, error, addSkill, resetSearch, search } = props;
  return (
    <>
      <section className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-[#087455]"><Sparkles size={17} /> Evidence-first talent search</div>
          <h1 className="max-w-3xl text-3xl font-bold tracking-[-.035em] text-[#0d2633] sm:text-4xl">Find qualified candidates with evidence you can review.</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">Define the role, add the must-have skills, and receive up to ten ranked public profiles with transparent ATS scoring.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <TrustPill icon={ShieldCheck} text="Public sources" />
          <TrustPill icon={CircleGauge} text="Explainable ATS" />
          <TrustPill icon={Users} text="Human review" />
        </div>
      </section>

      <form onSubmit={search} className="overflow-hidden rounded-3xl border border-[#d9e3e7] bg-white shadow-[0_18px_55px_rgba(16,44,58,.07)]">
        <div className="border-b border-[#e5ecef] bg-[#fbfcfd] px-5 py-5 sm:px-7">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-[#102d3b]">Start with a search template</h2>
              <p className="mt-1 text-sm text-slate-500">Choose a common role or build your own search.</p>
            </div>
            <button type="button" onClick={resetSearch} className="flex items-center gap-2 self-start rounded-xl border border-[#dbe5e8] px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white"><RotateCcw size={15} /> Clear all</button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {presets.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => { setForm({ role: preset.role, industry: preset.industry, skills: preset.skills, experienceMin: preset.experienceMin, experienceMax: preset.experienceMax, location: preset.location }); setCustomLocation(''); }}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${form.role === preset.role ? 'border-[#159773] bg-[#e7f8f1] text-[#087455]' : 'border-[#dce6e9] bg-white text-slate-600 hover:border-[#9ccabd]'}`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-8 px-5 py-7 sm:px-7 xl:grid-cols-[minmax(0,1.55fr)_minmax(310px,.75fr)]">
          <div className="space-y-8">
            <FormSection number="01" title="Role requirements" description="Set the criteria that determine candidate relevance.">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Job title" icon={BriefcaseBusiness}>
                  <input required list="job-title-suggestions" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} placeholder="e.g. Data Engineer" />
                  <datalist id="job-title-suggestions">{presets.map((preset) => <option key={preset.role} value={preset.role}>{preset.role}</option>)}<option value="Product Manager">Product Manager</option></datalist>
                </Field>
                <Field label="Industry" icon={Target}>
                  <input required list="industry-suggestions" value={form.industry} onChange={(event) => setForm({ ...form, industry: event.target.value })} placeholder="e.g. Technology" />
                  <datalist id="industry-suggestions"><option value="Technology">Technology</option><option value="Financial services">Financial services</option><option value="Healthcare">Healthcare</option><option value="Energy">Energy</option><option value="Telecommunications">Telecommunications</option><option value="Cybersecurity">Cybersecurity</option></datalist>
                </Field>
                <Field label="Minimum experience" icon={Clock3}>
                  <input required type="number" min="0" max="60" value={form.experienceMin} onChange={(event) => setForm({ ...form, experienceMin: event.target.value })} placeholder="3" />
                </Field>
                <Field label="Maximum experience" icon={Clock3}>
                  <input required type="number" min="0" max="60" value={form.experienceMax} onChange={(event) => setForm({ ...form, experienceMax: event.target.value })} placeholder="10" />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Location" icon={MapPin}>
                    <select required value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })}>
                      <option value="" disabled>Select a location scope</option>
                      <option>Saudi Arabia</option><option>Outside Saudi Arabia</option><option>Custom</option>
                    </select>
                    {form.location === 'Custom' && <input required className="mt-3" value={customLocation} onChange={(event) => setCustomLocation(event.target.value)} placeholder="Enter city, country, or region" />}
                  </Field>
                </div>
              </div>
            </FormSection>

            <FormSection number="02" title="Required skills" description="Separate must-have skills with commas. These carry 40% of the ATS score.">
              <Field label="Required skills" icon={Check}>
                <input required value={form.skills} onChange={(event) => setForm({ ...form, skills: event.target.value })} placeholder="Python, SQL, Spark" />
              </Field>
              <div className="mt-3 flex flex-wrap gap-2">
                {suggestedSkills.map((skill) => <button key={skill} type="button" onClick={() => addSkill(skill)} className="rounded-lg bg-[#eff6f5] px-2.5 py-1.5 text-xs font-bold text-[#286a5a] transition hover:bg-[#ddf1eb]">+ {skill}</button>)}
              </div>
              {/(phython|pyhton)/i.test(form.skills) && <button type="button" onClick={() => setForm({ ...form, skills: form.skills.replace(/phython|pyhton/gi, 'Python') })} className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm font-bold text-amber-800"><Sparkles size={15} /> Suggestion: replace misspelling with Python</button>}
            </FormSection>

            <FormSection number="03" title="Search brief" description="Add context from the job description to guide public-source discovery.">
              <Field label="Optional search prompt" icon={FileText}>
                <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Describe the team, responsibilities, certifications, or other job-relevant priorities…" rows={5} />
              </Field>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="group flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#a9c8c0] bg-[#f7fbfa] p-5 text-center transition hover:border-[#159773] hover:bg-[#eff9f5]">
                  <UploadCloud className="text-[#168060]" size={24} />
                  <span className="mt-2 text-sm font-bold text-[#173b45]">Job description upload</span>
                  <span className="mt-1 text-xs text-slate-500">Text or Markdown · loads into the prompt</span>
                  <input type="file" accept=".txt,.md,.text" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; setJdFileName(file.name); const reader = new FileReader(); reader.onload = () => { if (typeof reader.result === 'string') setPrompt(reader.result); }; reader.readAsText(file); }} />
                  {jdFileName && <span className="mt-2 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[#087455] shadow-sm">Loaded: {jdFileName}</span>}
                </label>
                <Field label="Optional authorized profile/provider URL" icon={ExternalLink} hint="Use a public profile URL you are permitted to access.">
                  <input type="url" value={profileUrl} onChange={(event) => setProfileUrl(event.target.value)} placeholder="https://provider.example/profile" />
                </Field>
              </div>
            </FormSection>
          </div>

          <aside className="h-fit rounded-2xl bg-[#102c3a] p-6 text-white xl:sticky xl:top-24">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#35d0a0] text-[#0b2c26]"><Sparkles size={20} /></div>
            <h2 className="mt-5 text-xl font-bold">Search intelligence</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">Claude discovers public evidence. Candidate Finder applies the same deterministic rubric to every result.</p>
            <div className="mt-6 space-y-3 border-y border-white/10 py-5">
              <SummaryLine label="Role" value={form.role || 'Not set'} />
              <SummaryLine label="Skills" value={form.skills ? `${form.skills.split(',').filter(Boolean).length} selected` : 'Not set'} />
              <SummaryLine label="Experience" value={form.experienceMin && form.experienceMax ? `${form.experienceMin}–${form.experienceMax} years` : 'Not set'} />
              <SummaryLine label="Location" value={form.location === 'Custom' ? customLocation || 'Custom' : form.location || 'Not set'} />
            </div>
            <ul className="mt-5 space-y-3 text-sm text-slate-300">
              <li className="flex gap-2"><Check className="mt-0.5 shrink-0 text-[#35d0a0]" size={16} /> Up to 10 ranked profiles</li>
              <li className="flex gap-2"><Check className="mt-0.5 shrink-0 text-[#35d0a0]" size={16} /> Duplicate sources removed</li>
              <li className="flex gap-2"><Check className="mt-0.5 shrink-0 text-[#35d0a0]" size={16} /> No age or protected traits</li>
            </ul>
            <button disabled={state === 'loading'} className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-[#35d0a0] px-5 py-3.5 text-base font-extrabold text-[#092b25] shadow-[0_12px_30px_rgba(53,208,160,.2)] transition hover:bg-[#52ddb3] disabled:cursor-wait disabled:opacity-70">
              {state === 'loading' ? <><LoaderCircle className="animate-spin" size={19} /> Searching public sources…</> : <>Find candidates <ArrowRight size={18} /></>}
            </button>
            <p className="mt-3 text-center text-xs text-slate-400">Live searches usually take 45–90 seconds.</p>
          </aside>
        </div>
      </form>

      {state === 'error' && <div role="alert" className="mt-5 flex max-w-4xl items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><AlertCircle className="mt-0.5 shrink-0" size={18} /><div><strong className="block">Search could not be completed</strong><span className="mt-1 block">{error}</span></div></div>}
    </>
  );
}

function ResultsWorkspace({ candidates, metrics, onNewSearch, onSelect }: { candidates: Candidate[]; metrics: { top: number; average: number; sourced: number }; onNewSearch: () => void; onSelect: (candidate: Candidate) => void }) {
  return (
    <>
      <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-[#087455]"><span>Ranked shortlist</span>{candidates.length > 0 && <span className="rounded-full bg-[#e4f7ef] px-2.5 py-1 text-xs">Top {candidates.length} verified</span>}</div>
          <h1 className="text-3xl font-bold tracking-[-.035em] text-[#0d2633] sm:text-4xl">Top candidates</h1>
          <p className="mt-2 text-base text-slate-600">Compare match strength with the public evidence behind every score.</p>
        </div>
        <button type="button" onClick={onNewSearch} className="flex items-center gap-2 self-start rounded-xl bg-[#102c3a] px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-[#173e50]"><Search size={17} /> New search</button>
      </section>

      {candidates.length > 0 && (
        <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Candidates" value={String(candidates.length)} detail="Unique public profiles" icon={Users} />
          <MetricCard label="Top ATS score" value={`${metrics.top}`} detail="Out of 100" icon={Target} />
          <MetricCard label="Average score" value={`${metrics.average}`} detail="Across this result set" icon={CircleGauge} />
          <MetricCard label="Verified sources" value={`${metrics.sourced}/${candidates.length}`} detail="Links available to review" icon={ShieldCheck} />
        </div>
      )}

      {candidates.length === 0 ? (
        <div className="mt-7 grid min-h-[430px] place-items-center rounded-3xl border border-dashed border-[#b9cdd4] bg-white p-8 text-center">
          <div className="max-w-md">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#e9f6f2] text-[#168060]"><Search size={27} /></div>
            <h2 className="mt-5 text-2xl font-bold">No results yet</h2>
            <p className="mt-2 leading-7 text-slate-600">Run a candidate search to receive up to 10 verified, scored results.</p>
            <button type="button" onClick={onNewSearch} className="mt-6 rounded-xl bg-[#102c3a] px-5 py-3 text-sm font-bold text-white">Go to candidate search</button>
          </div>
        </div>
      ) : (
        <div className="mt-7 grid gap-4 lg:grid-cols-2">
          {candidates.map((candidate, index) => <CandidateCard key={candidate.id} candidate={candidate} rank={index + 1} onSelect={onSelect} />)}
        </div>
      )}
    </>
  );
}

function CandidateCard({ candidate, rank, onSelect }: { candidate: Candidate; rank: number; onSelect: (candidate: Candidate) => void }) {
  const scoreTone = candidate.atsScore >= 75 ? 'text-[#087455] bg-[#e4f7ef]' : candidate.atsScore >= 50 ? 'text-amber-700 bg-amber-50' : 'text-slate-600 bg-slate-100';
  return (
    <article className="group overflow-hidden rounded-2xl border border-[#dae4e8] bg-white shadow-[0_10px_30px_rgba(16,44,58,.045)] transition hover:-translate-y-0.5 hover:border-[#9fc8bd] hover:shadow-[0_16px_38px_rgba(16,44,58,.09)]">
      <button type="button" onClick={() => onSelect(candidate)} className="block w-full p-5 text-left sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.12em] text-slate-400"><span>Rank #{rank}</span><span className="h-1 w-1 rounded-full bg-slate-300" /><span>{candidate.evidenceConfidence || candidate.confidence} evidence</span></div>
            <h2 className="mt-3 truncate text-xl font-bold text-[#102c3a]">{candidate.name}</h2>
            <p className="mt-1 text-sm font-semibold text-slate-600">{candidate.title}</p>
          </div>
          <div className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl ${scoreTone}`}><div className="text-center"><div className="text-2xl font-black leading-none">{candidate.atsScore}</div><div className="mt-1 text-[10px] font-extrabold uppercase">ATS</div></div></div>
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-[#159773] to-[#35d0a0]" style={{ width: `${candidate.atsScore}%` }} /></div>
        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <CardFact icon={Clock3} label="Experience" value={candidate.experienceYears === null ? 'Not verified' : `${candidate.experienceYears} years`} />
          <CardFact icon={MapPin} label="Location" value={candidate.location} />
        </div>
        <div className="mt-5 flex flex-wrap gap-2">{candidate.matchedSkills.slice(0, 4).map((skill) => <span key={skill} className="rounded-lg bg-[#edf8f4] px-2.5 py-1 text-xs font-bold text-[#176950]">{skill}</span>)}{candidate.missingSkills.length > 0 && <span className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">{candidate.missingSkills.length} missing</span>}</div>
        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm"><span className="font-semibold text-slate-500">Review match evidence</span><span className="grid h-8 w-8 place-items-center rounded-full bg-[#102c3a] text-white transition group-hover:translate-x-0.5"><ArrowRight size={15} /></span></div>
      </button>
      <div className="border-t border-slate-100 bg-[#fbfcfc] px-5 py-3 sm:px-6">
        {candidate.sourceUrl ? <a href={candidate.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-[#087455] hover:underline"><ExternalLink size={15} />{candidate.sourceUrl.includes('linkedin.com/') ? 'Open LinkedIn profile' : 'Open public source'}</a> : <span className="text-sm font-semibold text-amber-700">No public profile link was verified.</span>}
      </div>
    </article>
  );
}

function CandidateSheet({ candidate, onClose }: { candidate: Candidate; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-[#06151d]/45 backdrop-blur-[2px]">
      <button type="button" aria-label="Dismiss candidate details" onClick={onClose} className="absolute inset-0 h-full w-full cursor-default" />
      <dialog open aria-label={`${candidate.name} details`} className="absolute inset-y-0 right-0 left-auto m-0 h-full max-h-none w-full max-w-[540px] overflow-y-auto border-0 bg-white p-0 text-[#12232f] shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur">
          <div className="text-sm font-bold text-slate-500">Candidate evidence</div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200" aria-label="Close"><X size={18} /></button>
        </div>
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-5">
            <div><div className="text-xs font-extrabold uppercase tracking-[.14em] text-[#087455]">{candidate.label}</div><h2 className="mt-2 text-3xl font-bold tracking-tight text-[#0d2633]">{candidate.name}</h2><p className="mt-1 font-semibold text-slate-600">{candidate.title}</p></div>
            <div className="rounded-2xl bg-[#e3f7ef] px-4 py-3 text-center text-[#087455]"><div className="text-3xl font-black">{candidate.atsScore}</div><div className="text-[10px] font-extrabold uppercase">ATS / 100</div></div>
          </div>

          <div className="mt-7 rounded-2xl bg-[#f3f7f8] p-5"><div className="text-xs font-extrabold uppercase tracking-[.12em] text-slate-400">Recruiter suggestion</div><p className="mt-2 text-sm font-semibold leading-6 text-[#173b45]">{candidate.recommendation}</p></div>

          <DetailSection title="Match summary"><p className="text-sm leading-7 text-slate-600">{candidate.explanation}</p><div className="mt-4 flex flex-wrap gap-2">{candidate.matchedSkills.map((skill) => <span key={skill} className="inline-flex items-center gap-1 rounded-lg bg-[#e7f8f1] px-2.5 py-1.5 text-xs font-bold text-[#087455]"><Check size={13} />{skill}</span>)}{candidate.missingSkills.map((skill) => <span key={skill} className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-700"><X size={13} />{skill}</span>)}</div></DetailSection>

          <DetailSection title="ATS score breakdown">
            <div className="space-y-4">{Object.entries(candidate.scoreBreakdown || {}).map(([criterion, points]) => { const maximum = breakdownMaximums[criterion] || points || 1; return <div key={criterion}><div className="mb-1.5 flex justify-between text-sm"><span className="font-semibold text-slate-600">{breakdownLabels[criterion] || criterion}</span><strong className="text-[#173b45]">{points} / {maximum}</strong></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#21a77f]" style={{ width: `${Math.min(100, points / maximum * 100)}%` }} /></div></div>; })}</div>
          </DetailSection>

          <DetailSection title="Verified profile details">
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailFact icon={Clock3} label="Experience" value={candidate.experienceYears === null ? 'Not verified from public evidence' : `${candidate.experienceYears} years`} />
              <DetailFact icon={GraduationCap} label="Education" value={candidate.education} />
              <DetailFact icon={MapPin} label="Location" value={`${candidate.locationClassification} · ${candidate.location}`} />
              <DetailFact icon={ShieldCheck} label="Evidence confidence" value={candidate.evidenceConfidence || candidate.confidence} />
            </div>
          </DetailSection>

          <div className="mt-7 rounded-xl border border-[#dce8e4] bg-[#f7fbf9] p-4 text-sm text-slate-600"><strong className="text-[#173b45]">Age:</strong> Not collected or used in hiring scores.</div>
          {candidate.sourceUrl && <a href={candidate.sourceUrl} target="_blank" rel="noreferrer" className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#102c3a] px-5 py-3.5 text-sm font-bold text-white hover:bg-[#173e50]"><ExternalLink size={17} />{candidate.sourceUrl.includes('linkedin.com/') ? 'Open LinkedIn profile' : 'Open public source'}</a>}
        </div>
      </dialog>
    </div>
  );
}

function SettingsWorkspace() {
  return (
    <section className="max-w-4xl">
      <div className="text-sm font-bold text-[#087455]">Workspace configuration</div>
      <h1 className="mt-3 text-3xl font-bold tracking-[-.035em] text-[#0d2633] sm:text-4xl">Settings</h1>
      <p className="mt-2 text-base text-slate-600">Review the services and safeguards used by this local workspace.</p>
      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <SettingsCard icon={Sparkles} title="Candidate provider" status="Claude web search" description="Discovers job-relevant evidence from publicly available sources." />
        <SettingsCard icon={CircleGauge} title="ATS scoring" status="Deterministic rubric" description="Scores role, skills, experience, education, geography, and industry." />
        <SettingsCard icon={ShieldCheck} title="Local access" status="Authentication disabled" description="Local development opens directly. Production security remains isolated." />
        <SettingsCard icon={Users} title="Candidate records" status="Stateless" description="Search results are not stored in a candidate database." />
      </div>
      <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5"><div className="flex gap-3"><AlertCircle className="mt-0.5 shrink-0 text-amber-700" size={20} /><div><h2 className="font-bold text-amber-900">Human review required</h2><p className="mt-1 text-sm leading-6 text-amber-800">ATS scores support recruiter review; they should not make automatic employment decisions. Age and protected characteristics are never collected or ranked.</p></div></div></div>
    </section>
  );
}

function FormSection({ number, title, description, children }: { number: string; title: string; description: string; children: React.ReactNode }) {
  return <section><div className="mb-5 flex items-start gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#e8f7f2] text-xs font-black text-[#087455]">{number}</span><div><h2 className="font-bold text-[#153442]">{title}</h2><p className="mt-0.5 text-sm text-slate-500">{description}</p></div></div>{children}</section>;
}

function Field({ label, icon: Icon, hint, children }: { label: string; icon: React.ComponentType<{ size?: number; className?: string }>; hint?: string; children: React.ReactNode }) {
  return <label className="block"><span className="flex items-center gap-2 text-sm font-bold text-[#294754]"><Icon size={15} className="text-[#168060]" />{label}</span>{hint && <span className="mt-1 block text-xs leading-5 text-slate-500">{hint}</span>}<div className="mt-2">{children}</div></label>;
}

function TrustPill({ icon: Icon, text }: { icon: React.ComponentType<{ size?: number }>; text: string }) { return <span className="inline-flex items-center gap-2 rounded-full border border-[#d9e7e3] bg-white px-3 py-2 text-xs font-bold text-[#31555b] shadow-sm"><Icon size={14} />{text}</span>; }
function SummaryLine({ label, value }: { label: string; value: string }) { return <div className="flex items-start justify-between gap-4 text-sm"><span className="text-slate-400">{label}</span><span className="max-w-[170px] text-right font-bold text-white">{value}</span></div>; }
function MetricCard({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: React.ComponentType<{ size?: number }> }) { return <div className="rounded-2xl border border-[#dce5e9] bg-white p-5 shadow-[0_8px_24px_rgba(16,44,58,.04)]"><div className="flex items-center justify-between"><span className="text-sm font-bold text-slate-500">{label}</span><span className="grid h-9 w-9 place-items-center rounded-lg bg-[#eaf6f2] text-[#168060]"><Icon size={17} /></span></div><div className="mt-3 text-3xl font-black text-[#102c3a]">{value}</div><div className="mt-1 text-xs text-slate-500">{detail}</div></div>; }
function CardFact({ icon: Icon, label, value }: { icon: React.ComponentType<{ size?: number }>; label: string; value: string }) { return <div className="min-w-0 rounded-xl bg-[#f6f8f9] p-3"><div className="flex items-center gap-1.5 text-xs font-bold text-slate-400"><Icon size={13} />{label}</div><div className="mt-1 truncate font-semibold text-[#294754]">{value}</div></div>; }
function DetailSection({ title, children }: { title: string; children: React.ReactNode }) { return <section className="mt-7 border-t border-slate-100 pt-6"><h3 className="mb-4 text-xs font-extrabold uppercase tracking-[.13em] text-slate-400">{title}</h3>{children}</section>; }
function DetailFact({ icon: Icon, label, value }: { icon: React.ComponentType<{ size?: number }>; label: string; value: string }) { return <div className="rounded-xl border border-slate-100 p-3"><div className="flex items-center gap-2 text-xs font-bold text-slate-400"><Icon size={14} />{label}</div><div className="mt-2 text-sm font-semibold leading-5 text-[#294754]">{value}</div></div>; }
function SettingsCard({ icon: Icon, title, status, description }: { icon: React.ComponentType<{ size?: number }>; title: string; status: string; description: string }) { return <div className="rounded-2xl border border-[#dce5e9] bg-white p-6 shadow-[0_8px_24px_rgba(16,44,58,.04)]"><div className="grid h-11 w-11 place-items-center rounded-xl bg-[#e8f7f2] text-[#168060]"><Icon size={20} /></div><h2 className="mt-5 text-lg font-bold text-[#102c3a]">{title}</h2><div className="mt-2 inline-flex rounded-full bg-[#eff6f5] px-2.5 py-1 text-xs font-bold text-[#176950]">{status}</div><p className="mt-3 text-sm leading-6 text-slate-600">{description}</p></div>; }
