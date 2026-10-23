'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { uploadToLab } from '../upload';

export default function PlanForm({ id, angles, hasPlan }: { id: string; angles: string[]; hasPlan: boolean }) {
  const router = useRouter();
  const [photo, setPhoto] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [angle, setAngle] = useState(angles[0] || '');
  const [custom, setCustom] = useState('');
  const [extras, setExtras] = useState('');
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (!photo) return setErr('Add one clear photo of your product.');
    try {
      setBusy('Uploading the photo…');
      const productPath = await uploadToLab('product', photo);
      setBusy('Writing your step-by-step plan… (about a minute)');
      const r = await fetch(`/api/lab/${id}/plan`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productPath, productNote: note, angle: custom.trim() || angle, extras }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Could not write the plan.');
      setBusy('');
      router.refresh();
    } catch (e) {
      setErr((e as Error).message); setBusy('');
    }
  }

  return (
    <form className="card stack" onSubmit={submit}>
      <h2>{hasPlan ? 'Make a new plan' : 'Put your product in'}</h2>
      <label htmlFor="photo">Product photo (one clear front shot, the exact colour you sell)
        <input id="photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
      </label>
      <label htmlFor="note">What it is, size, anything the photo doesn't show
        <input id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Cat sleeping-bag bed, about 60 cm long, sherpa inside" />
      </label>
      <label htmlFor="angle">New world for the same video
        <select id="angle" value={angle} onChange={(e) => setAngle(e.target.value)}>
          {angles.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </label>
      <label htmlFor="custom">…or your own idea
        <input id="custom" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Texas cat dad, pickup truck, BBQ" />
      </label>
      <label htmlFor="extras">Extra wishes (people, pet, shots)
        <textarea id="extras" value={extras} onChange={(e) => setExtras(e.target.value)} placeholder="Same big orange tabby in every shot; end on a close-up with a tiny hat" />
      </label>
      {err && <p className="msg msg--err" role="alert">{err}</p>}
      {busy && <p className="msg" role="status">{busy}</p>}
      <button className="btn btn--rec" type="submit" disabled={!!busy}>{busy ? 'Working…' : 'Write the step-by-step plan'}</button>
    </form>
  );
}
