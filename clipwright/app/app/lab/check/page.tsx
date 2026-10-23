import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase/server';
import { labAllowed } from '@/lib/lab/worker';
import type { Check } from '@/lib/lab/schema';
import CheckForm from './CheckForm';

export default async function ViralityCheck() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!labAllowed(user)) {
    return <div className="page"><h1>Viralumo patikra</h1><p className="muted">Laboratorija šiai paskyrai neįjungta.</p></div>;
  }
  const { data: rows } = await supabase.from('lab_checks')
    .select('id, title, result, created_at').order('created_at', { ascending: false }).limit(30);

  return (
    <div className="page" lang="lt">
      <p><Link href="/lab">← Laboratorija</Link></p>
      <h1>Viralumo patikra</h1>
      <p className="muted">Įkelk savo video prieš keldamas. Gausi balą, hook&apos;o įvertinimą, kas veikia ir ką pataisyti
        pirmiausia. Video ištrinamas iškart po patikros.</p>
      <div className="grid grid--2">
        <CheckForm />
        <div className="card">
          <h2>Ankstesnės patikros</h2>
          {!rows?.length && <p className="muted">Kol kas nieko. Rezultatus matai tik tu.</p>}
          <ul className="list">
            {rows?.map((r) => {
              const c = r.result as Check;
              return (
                <li key={r.id}>
                  <Link href={`/lab/check/${r.id}`}><strong>{c.score}/100</strong> · {r.title || 'Video'}</Link>
                  <span className="muted"> · {c.verdict}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
