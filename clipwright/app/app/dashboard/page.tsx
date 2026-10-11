import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase/server';

const REASON: Record<string, string> = { signup_bonus: 'Welcome bonus', purchase: 'Credits bought', generation: 'Video generated', refund: 'Refund (failed video)', admin: 'Adjustment' };

export default async function Dashboard() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: profile }, { data: ledger }, { data: jobs }] = await Promise.all([
    supabase.from('profiles').select('credits, email, created_at').eq('id', user!.id).single(),
    supabase.from('credit_ledger').select('id, delta, reason, created_at').order('created_at', { ascending: false }).limit(25),
    supabase.from('jobs').select('id, model, seconds, cost, status, result_url, created_at').order('created_at', { ascending: false }).limit(25),
  ]);
  return (
    <div className="page">
      <h1>Your account</h1>
      <div className="grid grid--3">
        <div className="card"><p className="muted">Balance</p><p className="big">{profile?.credits ?? 0}</p><Link className="btn btn--rec" href="/credits">Buy credits</Link></div>
        <div className="card"><p className="muted">Videos made</p><p className="big">{(jobs || []).filter((j) => j.status === 'success').length}</p><Link className="btn" href="/studio">Open studio</Link></div>
        <div className="card"><p className="muted">Signed in as</p><p style={{ fontWeight: 700, wordBreak: 'break-all' }}>{profile?.email}</p></div>
      </div>
      <div className="grid grid--2">
        <div className="card"><h2>Videos</h2><div className="scroll"><table>
          <thead><tr><th>Date</th><th>Model</th><th>Length</th><th>Status</th><th></th></tr></thead>
          <tbody>{(jobs || []).map((j) => (
            <tr key={j.id}><td>{new Date(j.created_at).toLocaleDateString()}</td><td>{j.model}</td><td className="num">{j.seconds}s</td><td>{j.status}</td>
              <td>{j.result_url ? <a href={j.result_url} target="_blank" rel="noreferrer">Download</a> : null}</td></tr>
          ))}{!jobs?.length && <tr><td colSpan={5} className="muted">No videos yet. Your first render will show up here.</td></tr>}</tbody>
        </table></div></div>
        <div className="card"><h2>Credit history</h2><div className="scroll"><table>
          <thead><tr><th>Date</th><th>What</th><th>Credits</th></tr></thead>
          <tbody>{(ledger || []).map((l) => (
            <tr key={l.id}><td>{new Date(l.created_at).toLocaleDateString()}</td><td>{REASON[l.reason] || l.reason}</td>
              <td className={`num ${l.delta > 0 ? 'plus' : 'minus'}`}>{l.delta > 0 ? '+' : ''}{l.delta}</td></tr>
          ))}</tbody>
        </table></div></div>
      </div>
    </div>
  );
}
