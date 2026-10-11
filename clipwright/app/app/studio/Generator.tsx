'use client';
import { useEffect, useMemo, useState } from 'react';

type Model = { id: string; label: string; creditsPerSec: number; minSec: number; maxSec: number };
type Job = { id: string; status?: string; resultUrl?: string; error?: string };

export default function Generator({ models }: { models: Model[] }) {
  const [model, setModel] = useState(models[0].id);
  const [seconds, setSeconds] = useState(5);
  const [prompt, setPrompt] = useState('Candid iPhone video: a chubby bald grandpa with a grey moustache in a funny Christmas sweater steps out of an elevator while a woman laughs.');
  const [firstFrameUrl, setFirstFrameUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'err' | 'ok'; text: string } | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const m = models.find((x) => x.id === model)!;
  const cost = useMemo(() => Math.ceil(m.creditsPerSec * seconds), [m, seconds]);

  useEffect(() => {
    if (!job || job.status === 'success' || job.status === 'failed') return;
    const t = setInterval(async () => {
      const r = await fetch(`/api/jobs/${job.id}`, { cache: 'no-store' });
      if (r.ok) setJob(await r.json());
    }, 6000);
    return () => clearInterval(t);
  }, [job]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const r = await fetch('/api/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, seconds, prompt, firstFrameUrl: firstFrameUrl || undefined }),
    });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setMsg({ kind: 'err', text: j.error || 'Something went wrong.' }); return; }
    setMsg({ kind: 'ok', text: `Started. ${j.cost} credits used, ${j.balance} left.` });
    setJob({ id: j.jobId, status: 'running' });
  }

  return (
    <div className="grid grid--2">
      <form className="card stack" onSubmit={submit}>
        <label htmlFor="model">Model
          <select id="model" value={model} onChange={(e) => setModel(e.target.value)}>
            {models.map((x) => <option key={x.id} value={x.id}>{x.label} · {x.creditsPerSec} credits/s</option>)}
          </select>
        </label>
        <label htmlFor="seconds">Length: {seconds} s
          <input id="seconds" type="range" min={m.minSec} max={m.maxSec} value={seconds} onChange={(e) => setSeconds(+e.target.value)} />
        </label>
        <label htmlFor="prompt">What happens in the scene<textarea id="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} /></label>
        <label htmlFor="frame">Start frame image URL (optional)<input id="frame" type="url" value={firstFrameUrl} onChange={(e) => setFirstFrameUrl(e.target.value)} placeholder="https://…" /></label>
        {msg && <p className={`msg msg--${msg.kind}`} role="status">{msg.text}</p>}
        <button className="btn btn--rec" type="submit" disabled={busy}>{busy ? 'Starting…' : `Generate · ${cost} credits`}</button>
      </form>
      <div className="card">
        <h2>Result</h2>
        {!job && <p className="muted">Your video appears here. Most scenes take 3–8 minutes.</p>}
        {job && job.status !== 'success' && job.status !== 'failed' && <p className="msg" role="status">Rendering… this page checks every few seconds.</p>}
        {job?.status === 'failed' && <p className="msg msg--err" role="alert">{job.error || 'The video failed.'} Your credits were refunded.</p>}
        {job?.status === 'success' && job.resultUrl && (<>
          <video src={job.resultUrl} controls playsInline style={{ width: '100%', borderRadius: 12, background: '#000' }} />
          <p><a className="btn" href={job.resultUrl} target="_blank" rel="noreferrer">Open video</a></p>
        </>)}
      </div>
    </div>
  );
}
