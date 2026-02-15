import { redirect } from 'next/navigation';

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function toQueryString(sp?: PageProps['searchParams']) {
  if (!sp) return '';
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === 'string') params.set(k, v);
    else if (Array.isArray(v)) v.forEach((vv) => params.append(k, vv));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export default function QuizRedirectPage({ searchParams }: PageProps) {
  // Back-compat: /quiz?grade=... → /quiz/session?grade=...
  redirect(`/quiz/session${toQueryString(searchParams)}`);
}
