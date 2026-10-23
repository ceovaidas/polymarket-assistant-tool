'use client';
import { useState } from 'react';

/** A prompt block with a copy button. */
export default function Copy({ label, text }: { label: string; text: string }) {
  const [done, setDone] = useState(false);
  if (!text) return null;
  return (
    <div className="copy">
      <div className="copy__bar">
        <span>{label}</span>
        <button type="button" className="btn btn--sm" onClick={async () => {
          await navigator.clipboard.writeText(text);
          setDone(true); setTimeout(() => setDone(false), 1500);
        }}>{done ? 'Copied' : 'Copy'}</button>
      </div>
      <pre>{text}</pre>
    </div>
  );
}
