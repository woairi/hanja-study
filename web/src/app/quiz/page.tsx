import { redirect } from 'next/navigation';

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function toQueryString(sp?: Record<string, string | string[] | undefined>) {
  if (!sp) return '';
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === 'string') params.set(k, v);
    else if (Array.isArray(v)) v.forEach((vv) => params.append(k, vv));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export default async function QuizRedirectPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  // Back-compat: /quiz?grade=... → /quiz/session?grade=...
  redirect(`/quiz/session${toQueryString(sp)}`);
}
