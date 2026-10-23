import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { labAllowed } from '@/lib/lab/worker';
import type { Plan, Template } from '@/lib/lab/schema';
import PlanForm from './PlanForm';
import Copy from '../Copy';

const sec = (n: number) => `${Math.round(n * 10) / 10}`;

export default async function LabTemplate({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!labAllowed(user)) notFound();
  const { data: row } = await supabase.from('lab_templates').select('*').eq('id', id).single();
  if (!row) notFound();
  const t = row.template as Template;
  const plan = row.plan as Plan | null;

  return (
    <div className="page">
      <p><Link href="/lab">← Lab</Link></p>
      <h1>{t.title}</h1>
      <p className="muted">{t.summary}</p>

      <div className="grid grid--2">
        <div className="stack-lg">
          <section className="card">
            <p className="eyebrow">The hook</p>
            <div className="hook">
              <b>Hook ({sec(t.hook.seconds)} s)</b>
              <span>
                {t.hook.said && <>Said: “{t.hook.said}” · </>}
                {t.hook.on_screen_text && <>On screen: {t.hook.on_screen_text} · </>}
                Seen: {t.hook.seen}
              </span>
            </div>
            <p className="muted small">{t.hook.mechanic}</p>
            <Copy label="Hook for your version" text={t.hook.reusable_text} />
            <ol className="beats">
              {t.beats.map((b) => (
                <li key={b.n}>
                  <strong>{sec(b.start)}–{sec(b.end)} s</strong> {b.action}
                  <span className="muted small">{[b.shot, b.emotion, b.on_screen_text && `“${b.on_screen_text}”`, b.sound].filter(Boolean).join(' · ')}</span>
                </li>
              ))}
            </ol>
            <h3>Why it works</h3>
            <p>{t.why_it_works}</p>
            <p className="muted small">Music: {t.music.original} · beat drop at {sec(t.music.beat_drop_s)} s{t.cta ? ` · CTA: ${t.cta}` : ''}</p>
          </section>

          <section className="card">
            <p className="eyebrow">Just a bit sharper</p>
            <h3>The mirror</h3>
            <dl className="kv">
              <dt>Kept</dt><dd>{t.mirror.kept}</dd>
              <dt>Stronger</dt><dd>{t.mirror.stronger}</dd>
              <dt>Visuals</dt><dd>{t.mirror.visuals}</dd>
              <dt>The set</dt><dd>{t.mirror.set}</dd>
            </dl>
            <h3>The reference, 1:1</h3>
            <dl className="kv">
              <dt>Niche</dt><dd>{t.reference.niche}</dd>
              <dt>Audience</dt><dd>{t.reference.audience}</dd>
            </dl>
            {t.risks.length > 0 && (<><h3>Watch out</h3><ul>{t.risks.map((r) => <li key={r}>{r}</li>)}</ul></>)}
          </section>
        </div>

        <div className="stack-lg">
          <PlanForm id={row.id} angles={t.angles.map((a) => `${a.setting}: ${a.concept}`)} hasPlan={!!plan} />
          <section className="card">
            <h3>Other worlds for this format</h3>
            <ul>{t.angles.map((a) => <li key={a.setting}><b>{a.setting}</b> · {a.concept} <span className="muted">· “{a.hook}”</span></li>)}</ul>
          </section>
        </div>
      </div>

      {plan && (
        <section className="stack-lg">
          <h2>Your step-by-step plan</h2>
          <div className="card">
            <Copy label="Product sentence (same in every prompt)" text={plan.product_sentence} />
            {plan.characters.map((c, i) => <Copy key={i} label={`Character ${i + 1}`} text={c} />)}
          </div>
          {plan.steps.map((s) => (
            <article key={s.n} className="card step">
              <h3>STEP {s.n} · {s.title}</h3>
              <p className="small"><b>Where:</b> {s.where}</p>
              {s.uploads.length > 0 && <p className="small"><b>Upload:</b> {s.uploads.map((u, i) => `${i + 1}) ${u}`).join('  ')}</p>}
              <Copy label="Prompt" text={s.prompt} />
              <Copy label="Negative" text={s.negative} />
              {s.length && <p className="small"><b>Length / trim:</b> {s.length}</p>}
              {s.checks.length > 0 && <ul className="checks">{s.checks.map((c) => <li key={c}>{c}</li>)}</ul>}
            </article>
          ))}
          <div className="card">
            <h3>Edit, text and post</h3>
            <ul>{plan.on_screen_texts.map((o) => <li key={o.time}><b>{o.time}</b> · {o.text}</li>)}</ul>
            <p><b>Music:</b> {plan.music.join(' · ')}</p>
            <Copy label="Caption" text={plan.caption} />
            <Copy label="Pinned comment" text={plan.pinned_comment} />
            <Copy label="Hashtags" text={plan.hashtags.join(' ')} />
            <p className="muted small">{plan.cost_note}</p>
          </div>
        </section>
      )}
    </div>
  );
}
