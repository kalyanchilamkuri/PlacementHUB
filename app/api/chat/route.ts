import { NextResponse } from 'next/server';
import { getSession } from '@/lib/dal';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/ai/rate-limit';
import { TOOL_DECLARATIONS, runTool } from '@/lib/ai/tools';

export const maxDuration = 60;

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const MAX_STEPS = 5;

type Part = { text?: string; functionCall?: { name: string; args?: Record<string, unknown> }; functionResponse?: unknown };
type Content = { role: 'user' | 'model'; parts: Part[] };

function systemPrompt(role: 'ADMIN' | 'STUDENT', name: string | null) {
  const today = new Date().toISOString().slice(0, 10);
  return [
    `You are the placement assistant inside the IIIT Lucknow placement portal. Today is ${today}.`,
    `You are talking to ${name ?? 'a user'}, who is ${role === 'ADMIN' ? 'a member of the placement cell with access to everything' : 'a student who may only see their own record and public placement results'}.`,
    'Answer ONLY from tool results. Always call a tool for facts; never guess numbers, names or companies. If a tool returns nothing, say so plainly.',
    'Packages are already formatted in LPA; keep them as given. Offer types are 2-month intern, 6-month intern, winter intern, PPO and full-time.',
    'Placed means having at least one offer. 3rd year means internships; 4th year means winter interns, PPOs and full-time.',
    'Be brief and friendly. Use short bullet lists, or a markdown table when listing several students. Bold key numbers.',
    role === 'STUDENT'
      ? 'Never reveal other students\' CGPA, email or applications. Refuse politely if asked.'
      : 'When listing students include roll number and company.',
  ].join('\n');
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });

  const key = process.env.GEMINI_API_KEY;
  if (!key)
    return NextResponse.json({
      reply: 'AI chat is not configured yet. Ask the placement cell to add a GEMINI_API_KEY.',
    });

  const limit = rateLimit(session.user.id);
  if (!limit.ok)
    return NextResponse.json({
      reply: `You have used your 20 questions for this hour. Try again in about ${limit.retryInMin} minutes.`,
    });

  let body: { messages?: { role: string; text: string }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 });
  }
  const history = (body.messages ?? [])
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string')
    .slice(-12)
    .map<Content>((m) => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text.slice(0, 1000) }] }));
  if (history.length === 0 || history[history.length - 1]!.role !== 'user')
    return NextResponse.json({ error: 'Ask a question first.' }, { status: 400 });

  const role = session.user.role === 'ADMIN' ? 'ADMIN' : 'STUDENT';
  const student =
    role === 'STUDENT'
      ? await db.student.findUnique({ where: { userId: session.user.id }, select: { id: true } })
      : null;
  const ctx = { role, studentId: student?.id ?? null } as const;

  const contents = history;
  try {
    for (let step = 0; step < MAX_STEPS; step++) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt(role, session.user.name ?? null) }] },
            contents,
            tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
          }),
        },
      );
      if (!res.ok) {
        const status = res.status;
        console.error('Gemini error', status, await res.text().catch(() => ''));
        return NextResponse.json({
          reply:
            status === 429
              ? 'The AI is busy right now. Please try again in a minute.'
              : 'The AI service had a problem. Please try again shortly.',
        });
      }
      const data = (await res.json()) as { candidates?: { content?: Content }[] };
      const content = data.candidates?.[0]?.content;
      const parts = content?.parts ?? [];
      const calls = parts.filter((p) => p.functionCall);

      if (calls.length === 0) {
        const text = parts.map((p) => p.text ?? '').join('').trim();
        return NextResponse.json({ reply: text || 'I could not come up with an answer. Try rephrasing.' });
      }

      contents.push({ role: 'model', parts });
      const results = await Promise.all(
        calls.map(async (c) => ({
          functionResponse: {
            name: c.functionCall!.name,
            response: { result: await runTool(c.functionCall!.name, c.functionCall!.args ?? {}, ctx).catch(() => ({ error: 'Lookup failed.' })) },
          },
        })),
      );
      contents.push({ role: 'user', parts: results });
    }
    return NextResponse.json({ reply: 'That question needed too many lookups. Try asking something narrower.' });
  } catch (e) {
    console.error('chat failed', e);
    return NextResponse.json({ reply: 'Something went wrong on my side. Please try again.' });
  }
}
