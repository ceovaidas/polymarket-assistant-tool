import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { supabaseServer } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Clipwright', description: 'AI video studio for organic dropshippers' };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  let credits: number | null = null;
  if (user) credits = (await supabase.from('profiles').select('credits').eq('id', user.id).single()).data?.credits ?? 0;
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@800;900&family=Figtree:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap" />
      </head>
      <body>
        <header className="nav"><div className="wrap">
          <Link className="logo" href="/"><i aria-hidden="true" />Clipwright</Link>
          <nav aria-label="Main">
            {user ? (<>
              <Link href="/studio">Studio</Link>
              <Link href="/dashboard">Account</Link>
              <Link className="pill" href="/credits"><b>{credits}</b> credits</Link>
              <form action="/auth/signout" method="post"><button className="btn" type="submit">Sign out</button></form>
            </>) : (<>
              <Link href="/login">Sign in</Link>
              <Link className="btn btn--rec" href="/register">Start free</Link>
            </>)}
          </nav>
        </div></header>
        <main className="wrap">{children}</main>
      </body>
    </html>
  );
}
