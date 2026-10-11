import { PACKS, CREDIT_USD } from '@/lib/pricing';

export default async function Credits({ searchParams }: { searchParams: Promise<{ paid?: string; cancelled?: string }> }) {
  const q = await searchParams;
  return (
    <div className="page">
      <h1>Buy credits</h1>
      <p className="muted">1 credit = ${CREDIT_USD.toFixed(2)}. Credits never expire. Failed videos are refunded automatically.</p>
      {q.paid && <p className="msg msg--ok" role="status">Payment received. Your credits appear in a few seconds; refresh if the balance has not updated.</p>}
      {q.cancelled && <p className="msg" role="status">Checkout cancelled. Nothing was charged.</p>}
      <div className="grid grid--3">
        {PACKS.map((p) => (
          <form key={p.id} className="card" action="/api/checkout" method="post" style={{ display: 'grid', gap: 10 }}>
            <input type="hidden" name="pack" value={p.id} />
            <h2>{p.label}</h2>
            <p className="big">${p.usd}</p>
            <p><b>{p.credits.toLocaleString('en-US')}</b> credits {'note' in p ? <span className="muted">· {p.note}</span> : null}</p>
            <button className="btn btn--rec" type="submit">Buy {p.label}</button>
          </form>
        ))}
      </div>
    </div>
  );
}
