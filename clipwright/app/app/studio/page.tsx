import { MODELS } from '@/lib/pricing';
import Generator from './Generator';

export default function Studio() {
  const models = Object.entries(MODELS).map(([id, m]) => ({ id, label: m.label, creditsPerSec: m.creditsPerSec, minSec: m.minSec, maxSec: m.maxSec }));
  return (
    <div className="page">
      <h1>Studio</h1>
      <p className="muted">Generate one scene. The full scene-splitting studio plugs into this same credit and job system.</p>
      <Generator models={models} />
    </div>
  );
}
