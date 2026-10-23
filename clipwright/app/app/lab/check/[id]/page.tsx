import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { labAllowed } from '@/lib/lab/worker';
import type { Check } from '@/lib/lab/schema';
import Copy from '../../Copy';

const FIT = ['', 'Silpnai', 'Tinka', 'Labai tinka'];

export default async function CheckResult({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!labAllowed(user)) notFound();
  const { data: row } = await supabase.from('lab_checks').select('*').eq('id', id).single();
  if (!row) notFound();
  const c = row.result as Check;
  const score = Math.max(0, Math.min(100, c.score));
  const tone = score >= 75 ? 'good' : score >= 50 ? 'mid' : 'low';
  const ring = 2 * Math.PI * 44;

  return (
    <div className="page check" lang="lt">
      <p><Link href="/lab/check">← Atgal</Link></p>
      <h1>Viralumo patikra</h1>
      {row.title && <p className="muted">{row.title} · {Number(row.duration).toFixed(1)} s</p>}

      <section className={`card score score--${tone}`}>
        <svg viewBox="0 0 100 100" className="gauge" role="img" aria-label={`Balas ${score} iš 100`}>
          <circle cx="50" cy="50" r="44" className="gauge__bg" />
          <circle cx="50" cy="50" r="44" className="gauge__fg" strokeDasharray={ring} strokeDashoffset={ring * (1 - score / 100)} />
          <text x="50" y="52" textAnchor="middle" className="gauge__num">{score}</text>
          <text x="50" y="68" textAnchor="middle" className="gauge__of">/ 100</text>
        </svg>
        <div>
          <span className="tag">{c.verdict}</span>
          <p>{c.summary}</p>
        </div>
      </section>

      <section className="card">
        <div className="row">
          <p className="eyebrow">Hook · pirmos 2 sekundės</p>
          <b className={`big-num score--${c.hook.score >= 8 ? 'good' : c.hook.score >= 5 ? 'mid' : 'low'}`}>{c.hook.score}<small>/10</small></b>
        </div>
        <div className="segs" aria-hidden="true">{Array.from({ length: 10 }, (_, i) => <i key={i} className={i < c.hook.score ? 'on' : ''} />)}</div>
        <p>{c.hook.note}</p>
      </section>

      <section className="card">
        <p className="eyebrow">Kas veikia</p>
        <ul className="ticks">{c.works.map((w) => <li key={w}>{w}</li>)}</ul>
      </section>

      <section className="card">
        <p className="eyebrow">Pataisyk pirmiausia</p>
        <ol className="fixes">
          {c.fixes.map((f, i) => (
            <li key={i}>
              <span className="pill pill--tag">{f.tag}</span> {f.text}
              <Copy label="Įklijuok (angliškai)" text={f.prompt} />
            </li>
          ))}
        </ol>
      </section>

      <section className="card">
        <p className="eyebrow">Kur tinka</p>
        <ul className="fits">
          {c.platforms.map((p) => (
            <li key={p.name}>
              <b>{p.name}</b>
              <span className="signal" aria-label={`${p.fit} iš 3`}>{[1, 2, 3].map((n) => <i key={n} className={n <= p.fit ? 'on' : ''} />)}</span>
              <span className={`fit fit--${p.fit}`}>{FIT[p.fit] || ''}</span>
              <span className="muted small">{p.note}</span>
            </li>
          ))}
        </ul>
      </section>

      <p><Link className="btn btn--rec" href="/lab/check">Tikrinti kitą video</Link></p>
    </div>
  );
}
