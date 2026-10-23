import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase/server';
import { labAllowed } from '@/lib/lab/worker';
import type { Template } from '@/lib/lab/schema';
import LabStart from './LabStart';

export default async function Lab() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!labAllowed(user)) {
    return <div className="page"><h1>Lab</h1><p className="muted">The Lab is not enabled for this account.</p></div>;
  }
  const { data: rows } = await supabase.from('lab_templates')
    .select('id, template, source_link, created_at, plan').order('created_at', { ascending: false }).limit(50);

  return (
    <div className="page">
      <h1>Lab</h1>
      <p className="muted">Drop a viral video. The Lab copies its hook and structure 1:1 and turns it into a step-by-step
        plan for your product. Every shot is generated new, so the result is yours.</p>
      <div className="grid grid--2">
        <LabStart />
        <div className="card">
          <h2>Your templates</h2>
          {!rows?.length && <p className="muted">Only you see these. Your first template appears here.</p>}
          <ul className="list">
            {rows?.map((r) => {
              const t = r.template as Template;
              return (
                <li key={r.id}>
                  <Link href={`/lab/${r.id}`}><strong>{t.title}</strong></Link>
                  <span className="muted"> · {t.reference?.niche}{r.plan ? ' · plan ready' : ''}</span>
                </li>
              );
            })}
          </ul>
          <p className="row"><Link className="btn" href="/lab/check">Viralumo patikra</Link><Link className="btn" href="/lab/clean">Clean my own clip</Link></p>
        </div>
      </div>
    </div>
  );
}
