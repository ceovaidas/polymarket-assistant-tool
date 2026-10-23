'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { uploadToLab, MAX_VIDEO_MB } from '../upload';

const STEPS = [
  'Žiūriu tavo video kadras po kadro',
  'Vertinu hook\'ą: pirmos 2 sekundės',
  'Tikrinu tempą, tekstus ir produktą',
  'Lyginu su tuo, kas veikia TikTok, Reels ir Shorts',
  'Rašau, ką pataisyti pirmiausia',
];

export default function CheckForm() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [context, setContext] = useState('');
  const [drag, setDrag] = useState(false);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  function pick(f: File | undefined) {
    setErr('');
    if (!f) return;
    if (!['video/mp4', 'video/quicktime', 'video/webm'].includes(f.type)) return setErr('Tinka MP4, MOV arba WebM failai.');
    if (f.size > MAX_VIDEO_MB * 1024 * 1024) return setErr(`Failas didesnis nei ${MAX_VIDEO_MB} MB.`);
    setFile(f); setPreview(URL.createObjectURL(f));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (!file) return setErr('Įkelk savo video.');
    setRunning(true); setElapsed(0);
    try {
      let path: string;
      try { path = await uploadToLab('check', file); } catch { throw new Error('Nepavyko įkelti failo. Pabandyk dar kartą.'); }
      const r = await fetch('/api/lab/check', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, title: file.name.replace(/\.[^.]+$/, ''), context }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Patikrinti nepavyko.');
      router.push(`/lab/check/${j.id}`);
    } catch (e) {
      setErr((e as Error).message); setRunning(false);
    }
  }

  const step = Math.min(STEPS.length - 1, Math.floor(elapsed / 12));
  const mmss = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`;

  return (
    <form className="card stack" onSubmit={submit}>
      {!running ? (<>
        <button type="button" className={`drop${drag ? ' drop--on' : ''}`} onClick={() => input.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}>
          <strong>{file ? file.name : 'Įmesk savo video'}</strong>
          <span className="muted">{file ? 'spustelk, kad pakeistum' : `arba spustelk ir pasirink · MP4, MOV ar WebM, iki ${MAX_VIDEO_MB} MB`}</span>
        </button>
        <input ref={input} type="file" accept="video/mp4,video/quicktime,video/webm" hidden onChange={(e) => pick(e.target.files?.[0])} />
        <label htmlFor="ctx">Ką reklamuoja ir kam (nebūtina)
          <input id="ctx" value={context} onChange={(e) => setContext(e.target.value)} placeholder="Eightlegs voratinklio striukė, motociklininkams; muziką uždėsiu vėliau" />
        </label>
        {err && <p className="msg msg--err" role="alert">{err}</p>}
        <button className="btn btn--rec" type="submit">Tikrinti viralumą</button>
      </>) : (
        <div className="checking" aria-live="polite">
          {preview && <div className="checking__frame"><video src={preview} muted playsInline loop autoPlay /></div>}
          <p className="eyebrow">Žiūriu kaip žiūrovas · {step + 1}/{STEPS.length}</p>
          <ol className="steps">
            {STEPS.map((s, i) => <li key={s} className={i < step ? 'done' : i === step ? 'now' : ''}>{s}</li>)}
          </ol>
          <div className="bar"><i style={{ width: `${Math.min(95, (elapsed / 75) * 100)}%` }} /></div>
          <p className="muted small">{mmss} · patikrinimas trunka apie minutę</p>
          {err && <p className="msg msg--err" role="alert">{err}</p>}
        </div>
      )}
    </form>
  );
}
