'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { uploadToLab, MAX_VIDEO_MB } from './upload';

export default function LabStart() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState('');
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');

  function pick(f: File | undefined) {
    setErr('');
    if (!f) return;
    if (!['video/mp4', 'video/quicktime', 'video/webm'].includes(f.type)) return setErr('Use an MP4, MOV or WebM file.');
    if (f.size > MAX_VIDEO_MB * 1024 * 1024) return setErr(`The file is over ${MAX_VIDEO_MB} MB.`);
    setFile(f); setLink('');
  }

  async function start(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (!file && !link.trim()) return setErr('Drop a video or paste a reel link.');
    try {
      let body: Record<string, string>;
      if (file) {
        setBusy('Uploading…');
        body = { path: await uploadToLab('video', file) };
      } else {
        body = { link: link.trim() };
      }
      setBusy('Watching the video: scenes, hook, speech, music… (about a minute)');
      const r = await fetch('/api/lab/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Analysis failed.');
      router.push(`/lab/${j.id}`);
    } catch (e) {
      setErr((e as Error).message);
      setBusy('');
    }
  }

  return (
    <form className="card stack" onSubmit={start}>
      <button
        type="button"
        className={`drop${drag ? ' drop--on' : ''}`}
        onClick={() => input.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}
      >
        <strong>{file ? file.name : 'Drop a viral video'}</strong>
        <span className="muted">{file ? `${(file.size / 1048576).toFixed(1)} MB · click to change` : `or click to choose one · MP4, MOV or WebM, up to ${MAX_VIDEO_MB} MB`}</span>
      </button>
      <input ref={input} type="file" accept="video/mp4,video/quicktime,video/webm" hidden onChange={(e) => pick(e.target.files?.[0])} />
      <p className="or">or a reel link</p>
      <label htmlFor="link" className="sr">Reel link</label>
      <input id="link" type="url" inputMode="url" placeholder="https://www.instagram.com/reel/…" value={link}
        onChange={(e) => { setLink(e.target.value); if (e.target.value) setFile(null); }} />
      {err && <p className="msg msg--err" role="alert">{err}</p>}
      {busy && <p className="msg" role="status">{busy}</p>}
      <button className="btn btn--rec" type="submit" disabled={!!busy}>{busy ? 'Working…' : 'Make the template'}</button>
    </form>
  );
}
