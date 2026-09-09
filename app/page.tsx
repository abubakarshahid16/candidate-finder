'use client'

import { useState } from 'react'

type Candidate = { id: string; name: string; title: string; skills: string[]; experienceYears: number; education: string; location: string; locationClassification: string; atsScore: number; matchedSkills: string[]; missingSkills: string[]; confidence: string; explanation: string; label: string }

const initialForm = { role: 'Data Engineer', skills: 'Python, SQL', experienceMin: '3', experienceMax: '10', location: 'Saudi Arabia' }

export default function Home() {
  const [screen, setScreen] = useState<'search' | 'results' | 'settings'>('search')
  const [form, setForm] = useState(initialForm)
  const [profileUrl, setProfileUrl] = useState('')
  const [prompt, setPrompt] = useState('')
  const [jdFileName, setJdFileName] = useState('')
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [selected, setSelected] = useState<Candidate | null>(null)
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState('')

  const search = async (event: { preventDefault: () => void }) => {
    event.preventDefault(); setState('loading'); setError(''); setCandidates([]); setSelected(null)
    try {
      const response = await fetch('http://localhost:3001/api/v1/candidate-search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, role: form.role, skills: form.skills.split(',').map((skill) => skill.trim()).filter(Boolean), experienceMin: Number(form.experienceMin), experienceMax: Number(form.experienceMax), location: form.location, profileUrl }) })
      const body = await response.json() as { details?: string[]; error?: string; candidates: Candidate[] }
      if (!response.ok) throw new Error(body.details?.join(', ') || body.error || 'Search failed')
      setCandidates(body.candidates); setScreen('results'); setState('idle')
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Search failed'); setState('error') }
  }

  return <div className="min-h-screen bg-[#f6f8f7] text-[#183d39]">
    <aside className="fixed inset-y-0 left-0 w-60 border-r border-[#dce6e2] bg-white p-5">
      <div className="mb-12 text-lg font-bold">Candidate Finder</div>
      <nav className="space-y-2">
        <Nav active={screen === 'search'} onClick={() => setScreen('search')}>Candidate search</Nav>
        <Nav active={screen === 'results'} onClick={() => setScreen('results')}>Results</Nav>
        <Nav active={screen === 'settings'} onClick={() => setScreen('settings')}>Settings</Nav>
      </nav>
      <div className="mt-12 rounded-lg bg-[#eef7f1] p-3 text-xs text-[#39705b]">Local development<br />Authentication disabled</div>
    </aside>
    <main className="ml-60 min-h-screen p-8">
      {screen === 'settings' ? <section className="mx-auto max-w-3xl"><h1 className="text-3xl font-semibold">Settings</h1><div className="mt-6 rounded-xl border border-[#dce6e2] bg-white p-6"><h2 className="font-semibold">Local development</h2><p className="mt-2 text-sm text-slate-600">This demo uses synthetic candidate records and does not require login. Production authentication remains isolated in the backend.</p></div></section> : <>
        <h1 className="text-3xl font-semibold">Find qualified candidates</h1>
        <p className="mt-2 text-slate-600">Search synthetic demo records using job-relevant criteria only.</p>
        <form onSubmit={search} className="mt-8 grid max-w-5xl gap-4 rounded-xl border border-[#dce6e2] bg-white p-6 md:grid-cols-2">
          <Field label="Job title"><input required value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} /></Field>
          <Field label="Required skills"><input required value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="Python, SQL" /></Field>
          <Field label="Minimum experience"><input required type="number" min="0" value={form.experienceMin} onChange={(e) => setForm({ ...form, experienceMin: e.target.value })} /></Field>
          <Field label="Maximum experience"><input required type="number" min="0" value={form.experienceMax} onChange={(e) => setForm({ ...form, experienceMax: e.target.value })} /></Field>
          <Field label="Location"><input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></Field>
          <Field label="Optional authorized profile/provider URL"><input value={profileUrl} onChange={(e) => setProfileUrl(e.target.value)} placeholder="https://provider.example/profile" /></Field>
          <div className="md:col-span-2"><Field label="Optional search prompt"><textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Example: Find senior data engineers with strong Python and SQL experience in Saudi Arabia." rows={3} className="block w-full resize-y rounded-lg border border-[#cbdad5] bg-white p-3 font-normal text-[#183d39]" /></Field></div>
          <div className="md:col-span-2"><label className="block text-sm font-semibold text-slate-600">Job description upload<div className="mt-2 rounded-lg border border-dashed border-[#9bbdb0] bg-[#f7fbf8] p-4"><input type="file" accept=".txt,.md,.text" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; setJdFileName(file.name); const reader = new FileReader(); reader.onload = () => setPrompt(String(reader.result || '')); reader.readAsText(file) }} className="border-0 bg-transparent p-0" /><p className="mt-2 text-xs font-normal text-slate-500">Upload a text or Markdown job description. Its contents will be loaded into the prompt field.</p>{jdFileName && <p className="mt-2 text-xs font-semibold text-[#39705b]">Loaded: {jdFileName}</p>}</div></label></div>
          <div className="flex items-end"><button disabled={state === 'loading'} className="w-full rounded-lg bg-[#164d48] px-5 py-3 font-semibold text-white disabled:opacity-50">{state === 'loading' ? 'Finding candidates…' : 'Find candidates'}</button></div>
        </form>
        {state === 'error' && <div className="mt-4 max-w-5xl rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        {screen === 'results' && <section className="mt-8 max-w-5xl"><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-semibold">Results</h2><span className="rounded-full bg-[#e8f5ec] px-3 py-1 text-xs font-semibold text-[#39705b]">Synthetic demo data · {candidates.length} candidates</span></div><div className="grid gap-4 lg:grid-cols-3">{candidates.map((candidate) => <button key={candidate.id} onClick={() => setSelected(candidate)} className="text-left rounded-xl border border-[#dce6e2] bg-white p-5 shadow-sm hover:border-[#5a9b7e]"><div className="text-xs font-semibold text-[#c2764f]">{candidate.label}</div><h3 className="mt-2 text-lg font-semibold">{candidate.name}</h3><p className="text-sm text-slate-600">{candidate.title} · {candidate.experienceYears} years</p><div className="mt-4 text-3xl font-bold text-[#26705a]">{candidate.atsScore}<span className="text-sm font-normal text-slate-500"> / 100 ATS</span></div><p className="mt-3 text-xs text-slate-600">{candidate.explanation}</p></button>)}</div></section>}
        {selected && <div className="fixed inset-y-0 right-0 w-[min(420px,100vw)] overflow-y-auto border-l border-[#dce6e2] bg-white p-7 shadow-xl"><button onClick={() => setSelected(null)} className="float-right text-sm text-slate-500">Close</button><div className="mt-8 text-xs font-semibold text-[#c2764f]">{selected.label}</div><h2 className="mt-2 text-2xl font-semibold">{selected.name}</h2><p className="text-slate-600">{selected.title}</p><Detail label="ATS score" value={`${selected.atsScore} / 100`} /><Detail label="Match explanation" value={selected.explanation} /><Detail label="Matched skills" value={selected.matchedSkills.join(', ') || 'None'} /><Detail label="Missing skills" value={selected.missingSkills.join(', ') || 'None'} /><Detail label="Evidence confidence" value={selected.confidence} /><Detail label="Location classification" value={`${selected.locationClassification} · ${selected.location}`} /></div>}
      </>}
    </main>
  </div>
}

function Nav({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) { return <button onClick={onClick} className={`w-full rounded-lg px-4 py-3 text-left font-medium ${active ? 'bg-[#e4f1e9] text-[#176052]' : 'text-slate-600 hover:bg-slate-50'}`}>{children}</button> }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm font-semibold text-slate-600">{label}<div className="mt-2">{children}</div></label> }
function Detail({ label, value }: { label: string; value: string }) { return <div className="mt-6 border-t border-slate-100 pt-4"><div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</div><div className="mt-1 text-sm text-slate-700">{value}</div></div> }
