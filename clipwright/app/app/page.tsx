import Link from 'next/link';
import { MODELS } from '@/lib/pricing';

export default function Home() {
  return (
    <div className="page">
      <h1>Drop a viral video.<br />Get your version.</h1>
      <p className="muted" style={{ maxWidth: '58ch' }}>Split a reference clip into scenes, rebuild each one with your product and an AI cast, then export with a hook and music. New accounts get 50 free credits.</p>
      <div><Link className="btn btn--rec" href="/register">Create a free account</Link></div>
      <div className="card"><h2>Prices</h2>
        <div className="scroll"><table><thead><tr><th>Model</th><th>Credits / second</th><th>5 s scene</th></tr></thead><tbody>
          {Object.values(MODELS).map((m) => (<tr key={m.label}><td>{m.label}</td><td className="num">{m.creditsPerSec}</td><td className="num">{m.creditsPerSec * 5} credits · ${(m.creditsPerSec * 5 / 100).toFixed(2)}</td></tr>))}
        </tbody></table></div>
      </div>
    </div>
  );
}
