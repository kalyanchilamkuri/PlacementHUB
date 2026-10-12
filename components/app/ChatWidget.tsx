'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import { ArrowUp, Bot, RotateCcw, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type Msg = { role: 'user' | 'assistant'; text: string };

const SUGGESTIONS = {
  STUDENT: ['What is my status?', 'Which drives can I apply to?', 'Which companies hired from my branch?'],
  ADMIN: [
    'How many students are placed this year?',
    'List unplaced CSE students with CGPA above 8',
    'Give me a placement report for the 4th year',
  ],
};

function inline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

/** Just enough markdown for chat answers: bullets, bold and pipe tables. */
function Rich({ text }: { text: string }) {
  const lines = text.split('\n');
  const out: React.ReactNode[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (line.trim().startsWith('|')) {
      const block: string[] = [];
      while (i < lines.length && lines[i]!.trim().startsWith('|')) block.push(lines[i++]!);
      i--;
      const rows = block
        .filter((l) => !/^\s*\|?\s*:?-{2,}/.test(l))
        .map((l) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
      out.push(
        <div key={i} className="my-2 overflow-x-auto rounded-lg border border-line">
          <table className="w-full text-xs">
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri} className={ri === 0 ? 'bg-surface-2 font-medium' : 'border-t border-line'}>
                  {r.map((c, ci) => (
                    <td key={ci} className="px-2 py-1.5">
                      {inline(c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
    } else if (/^\s*[-*]\s+/.test(line)) {
      out.push(
        <p key={i} className="flex gap-2 pl-1">
          <span className="text-blue">•</span>
          <span>{inline(line.replace(/^\s*[-*]\s+/, ''))}</span>
        </p>,
      );
    } else if (line.trim()) {
      out.push(<p key={i}>{inline(line)}</p>);
    }
  }
  return <div className="space-y-1.5 text-sm leading-relaxed">{out}</div>;
}

export function ChatWidget({ role, storageKey }: { role: 'ADMIN' | 'STUDENT'; storageKey: string }) {
  const key = `placementhub-chat:${storageKey}`;
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  const loaded = useRef(false);

  function openPanel() {
    if (!loaded.current) {
      loaded.current = true;
      try {
        const raw = localStorage.getItem(key);
        if (raw) setMsgs(JSON.parse(raw));
      } catch {}
    }
    setOpen(true);
  }

  useEffect(() => {
    if (loaded.current) {
      try {
        localStorage.setItem(key, JSON.stringify(msgs.slice(-40)));
      } catch {}
    }
    end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [msgs, busy, key, open]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    const next: Msg[] = [...msgs, { role: 'user', text: q }];
    setMsgs(next);
    setInput('');
    setBusy(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: next.slice(-12) }),
      });
      const data = (await res.json().catch(() => ({}))) as { reply?: string; error?: string };
      setMsgs([
        ...next,
        { role: 'assistant', text: data.reply ?? data.error ?? 'Something went wrong. Try again.' },
      ]);
    } catch {
      setMsgs([...next, { role: 'assistant', text: 'I could not reach the server. Check your connection.' }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={openPanel}
        aria-label="Ask the placement assistant"
        className={cn(
          'ping-soft fixed bottom-5 right-5 z-50 flex h-14 items-center gap-2 rounded-full bg-blue px-5 text-on-blue shadow-[var(--shadow-float)] transition-transform hover:scale-105 active:scale-95',
          open && 'pointer-events-none scale-0',
        )}
      >
        <Sparkles size={20} />
        <span className="hidden text-sm font-medium sm:inline">Ask AI</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[70]">
          <button
            aria-label="Close assistant"
            onClick={() => setOpen(false)}
            className="fade-in absolute inset-0 bg-[rgb(2_11_19/0.4)] backdrop-blur-[2px]"
          />
          <aside
            role="dialog"
            aria-label="Placement assistant"
            className="slide-in-right glass-deep absolute right-0 top-0 flex h-dvh w-full flex-col sm:w-[420px]"
          >
            <header className="flex items-center gap-3 border-b px-5 py-4">
              <span className="niche grid size-10 place-items-center bg-blue text-on-blue">
                <Bot size={20} />
              </span>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="font-medium">Placement assistant</p>
                <p className="text-xs text-muted">
                  {role === 'ADMIN' ? 'Ask about any student or company' : 'Ask about your own status'}
                </p>
              </div>
              {msgs.length > 0 && (
                <button
                  onClick={() => setMsgs([])}
                  aria-label="Clear chat"
                  className="grid size-8 place-items-center rounded-lg text-muted hover:bg-surface-2"
                >
                  <RotateCcw size={15} />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="grid size-8 place-items-center rounded-lg text-muted hover:bg-surface-2"
              >
                <X size={18} />
              </button>
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {msgs.length === 0 && (
                <div className="fade-in pt-6 text-center">
                  <span className="niche mx-auto grid size-14 place-items-center bg-blue-wash text-blue">
                    <Sparkles size={24} />
                  </span>
                  <p className="display mt-4 text-xl">How can I help?</p>
                  <p className="mx-auto mt-1 max-w-[30ch] text-sm text-muted">
                    I answer from the real placement data, so what I tell you matches the portal.
                  </p>
                  <div className="mt-6 space-y-2">
                    {SUGGESTIONS[role].map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="lift block w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-left text-sm"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {msgs.map((m, i) => (
                <div key={i} className={cn('pop flex', m.role === 'user' && 'justify-end')}>
                  <div
                    className={cn(
                      'max-w-[88%] rounded-2xl px-4 py-2.5',
                      m.role === 'user'
                        ? 'rounded-br-md bg-blue text-sm text-on-blue'
                        : 'rounded-bl-md border border-line bg-surface',
                    )}
                  >
                    {m.role === 'user' ? m.text : <Rich text={m.text} />}
                  </div>
                </div>
              ))}

              {busy && (
                <div className="flex">
                  <div className="flex gap-1 rounded-2xl rounded-bl-md border border-line bg-surface px-4 py-3">
                    {[0, 1, 2].map((d) => (
                      <span
                        key={d}
                        className="size-1.5 animate-bounce rounded-full bg-faint"
                        style={{ animationDelay: `${d * 120}ms` }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={end} />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="border-t p-4"
            >
              <div className="flex items-center gap-2 rounded-2xl border border-line bg-surface py-1.5 pl-4 pr-1.5 focus-within:border-blue">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything about placements"
                  maxLength={500}
                  className="h-9 min-w-0 flex-1 bg-transparent text-sm placeholder:text-faint focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={busy || !input.trim()}
                  aria-label="Send"
                  className="grid size-9 place-items-center rounded-xl bg-blue text-on-blue transition-opacity disabled:opacity-40"
                >
                  <ArrowUp size={18} />
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}
    </>
  );
}
