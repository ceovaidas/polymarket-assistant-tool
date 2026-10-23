import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase/server';
import { labAllowed } from '@/lib/lab/worker';
import CleanForm from './CleanForm';

export default async function Clean() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!labAllowed(user)) {
    return <div className="page"><h1>Clean</h1><p className="muted">The Lab is not enabled for this account.</p></div>;
  }
  return (
    <div className="page">
      <p><Link href="/lab">← Lab</Link></p>
      <h1>Clean my clip</h1>
      <p className="muted">Blur baked-in text off your own generated or filmed clip and mirror it, so you can put new text on top.
        Only for videos you made or are licensed to edit. Other people&apos;s videos go through the Lab instead, which
        rebuilds them from scratch with your product.</p>
      <CleanForm />
    </div>
  );
}
