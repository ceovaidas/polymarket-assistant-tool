'use client';
import { useState } from 'react';
import { uploadToLab, MAX_VIDEO_MB } from '../upload';

type Box = { x: number; y: number; w: number; h: number };
const PRESETS: { id: string; label: string; box: Box }[] = [
  { id: 'top', label: 'Text at the top', box: { x: 0.04, y: 0.08, w: 0.92, h: 0.16 } },
  { id: 'middle', label: 'Text in the middle', box: { x: 0.04, y: 0.42, w: 0.92, h: 0.16 } },
  { id: 'bottom', label: 'Text at the bottom', box: { x: 0.04, y: 0.74, w: 0.92, h: 0.16 } },
  { id: 'corner', label: 'Small mark, bottom right', box: { x: 0.68, y: 0.88, w: 0.3, h: 0.08 } },
];

export default function CleanForm() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [areas, setAreas] = useState<string[]>(['top']);
  const [mirror, setMirror] = useState(false);
  const [rights, setRights] = useState(false);
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const [result, setResult] = useState('');

  function pick(f: File | undefined) {
    setErr(''); setResult('');
    if (!f) return;
    if (!['video/mp4', 'video/quicktime', 'video/webm'].includes(f.type)) return setErr('Use an MP4, MOV or WebM file.');
    if (f.size > MAX_VIDEO_MB * 1024 * 1024) return setErr(`The file is over ${MAX_VIDEO_MB} MB.`);
    setFile(f); setPreview(URL.createObjectURL(f));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(''); setResult('');
    if (!file) return setErr('Choose your video.');
    if (!rights) return setErr('Confirm the video is yours or licensed to you.');
    try {
      setBusy('Uploading…');
      const path = await uploadToLab('clean', file);
      setBusy('Cleaning…');
      const boxes = PRESETS.filter((p) => areas.includes(p.id)).map((p) => p.box);
      const r = await fetch('/api/lab/clean', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, confirmRights: true, mirror, boxes }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Processing failed.');
      setResult(j.url);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy('');
    }
  }

  return (
    <form className="card stack" onSubmit={submit}>
      <label htmlFor="video">Your video (a clip you generated or filmed)
        <input id="video" type="file" accept="video/mp4,video/quicktime,video/webm" onChange={(e) => pick(e.target.files?.[0])} />
      </label>
      {preview && (
        <div className="cleanprev">
          <video src={preview} muted playsInline loop autoPlay />
          {PRESETS.filter((p) => areas.includes(p.id)).map((p) => (
            <i key={p.id} style={{ left: `${p.box.x * 100}%`, top: `${p.box.y * 100}%`, width: `${p.box.w * 100}%`, height: `${p.box.h * 100}%` }} />
          ))}
        </div>
      )}
      <fieldset>
        <legend>Areas to blur out</legend>
        {PRESETS.map((p) => (
          <label key={p.id} className="check">
            <input type="checkbox" checked={areas.includes(p.id)}
              onChange={(e) => setAreas(e.target.checked ? [...areas, p.id] : areas.filter((a) => a !== p.id))} />
            {p.label}
          </label>
        ))}
      </fieldset>
      <label className="check"><input type="checkbox" checked={mirror} onChange={(e) => setMirror(e.target.checked)} />Mirror left ↔ right</label>
      <label className="check"><input type="checkbox" checked={rights} onChange={(e) => setRights(e.target.checked)} />
        This video is mine (generated or filmed by me) or I have a licence to edit it.</label>
      {err && <p className="msg msg--err" role="alert">{err}</p>}
      {busy && <p className="msg" role="status">{busy}</p>}
      {result && <p className="msg msg--ok" role="status">Done. <a href={result}>Download the clean video</a> (link works for 1 hour).</p>}
      <button className="btn btn--rec" type="submit" disabled={!!busy}>{busy ? 'Working…' : 'Clean my video'}</button>
    </form>
  );
}
