import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/chatbot/auth';
import { getActivePersona, listPersonaVersions, publishPersona } from '@/lib/chatbot/persona';

export const dynamic = 'force-dynamic';

// GET — active persona + full version history.
export async function GET(req: NextRequest) {
  const auth = requireAdminUser(req);
  if ('error' in auth) return auth.error;

  const [active, history] = await Promise.all([getActivePersona(), listPersonaVersions()]);
  return NextResponse.json({ active, history });
}

// POST — publish a new persona version (becomes active; previous deactivated).
export async function POST(req: NextRequest) {
  const auth = requireAdminUser(req);
  if ('error' in auth) return auth.error;

  try {
    const { promptText } = await req.json();
    if (!promptText || !String(promptText).trim()) {
      return NextResponse.json({ error: 'Prompt text is required.' }, { status: 400 });
    }
    await publishPersona(String(promptText), auth.user.email);
    const active = await getActivePersona();
    return NextResponse.json({ ok: true, active });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to publish persona.' }, { status: 500 });
  }
}
