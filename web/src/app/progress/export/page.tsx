'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import Toast from '@/components/Toast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { ExportFormat, ExportKind, ExportSize } from '@/lib/progressExport';
import { buildExport, exportLabel, sizeToLimit } from '@/lib/progressExport';

type Step = 1 | 2 | 3 | 4;

type LastPick = {
  version: 1;
  kind: ExportKind;
  format: ExportFormat;
  size: ExportSize;
};

const LAST_KEY = 'hanja-study:progressExport:last';

function safeParseLast(raw: string | null): LastPick | null {
  if (!raw) return null;
  try {
    const x = JSON.parse(raw) as LastPick;
    if (!x || x.version !== 1) return null;
    if (!['weak', 'due'].includes(x.kind)) return null;
    if (!['ids', 'json'].includes(x.format)) return null;
    if (!['short', 'normal', 'long'].includes(x.size)) return null;
    return x;
  } catch {
    return null;
  }
}

function telegramHint(charCount: number): { level: 'ok' | 'warn'; text: string } {
  // Telegram message hard limit is 4096, but safe paste varies by device.
  if (charCount <= 3600) return { level: 'ok', text: '텔레그램에 붙여넣기 안전한 길이야.' };
  if (charCount <= 4096) return { level: 'warn', text: '텔레그램 한계(4096자) 근처야. 안 되면 “짧게”로 줄여줘.' };
  return { level: 'warn', text: '너무 길어! 텔레그램에 안 들어갈 수 있어. “짧게”로 줄이자.' };
}

export default function ProgressExportPage() {
  const [toast, setToast] = useState<string | null>(null);
  const [step, setStep] = useState<Step>(1);

  const [kind, setKind] = useState<ExportKind>('weak');
  const [format, setFormat] = useState<ExportFormat>('ids');
  const [size, setSize] = useState<ExportSize>('normal');

  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorReason, setErrorReason] = useState<string | null>(null);

  useEffect(() => {
    const last = safeParseLast(window.localStorage.getItem(LAST_KEY));
    if (last) {
      setKind(last.kind);
      setFormat(last.format);
      setSize(last.size);
    }
  }, []);

  useEffect(() => {
    const last: LastPick = { version: 1, kind, format, size };
    window.localStorage.setItem(LAST_KEY, JSON.stringify(last));
  }, [kind, format, size]);

  const exp = useMemo(() => {
    const now = Date.now();
    return buildExport({ kind, format, limit: sizeToLimit(size), now });
  }, [kind, format, size]);

  const hint = useMemo(() => telegramHint(exp.charCount), [exp.charCount]);

  async function doCopy() {
    setStatus('idle');
    setErrorReason(null);

    try {
      await navigator.clipboard.writeText(exp.text);
      setStatus('success');
      setToast('복사 완료! 이제 붙여넣기만 하면 돼.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setStatus('error');
      setErrorReason(msg);
      setToast('복사 실패 😭 (아래 미리보기에서 길게 눌러서 복사해줘)');
    }
  }

  function downloadFile() {
    try {
      const blob = new Blob([exp.text], { type: format === 'json' ? 'application/json;charset=utf-8' : 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = exp.filename;
      a.click();
      setToast('파일로 저장했어!');
      setStatus('success');
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setToast('저장 실패 😭 다시 시도해줘.');
      setStatus('error');
      setErrorReason('download_failed');
    }
  }

  async function shareText() {
    const anyNav = navigator as unknown as { share?: (data: { text?: string; title?: string }) => Promise<void> };
    if (!anyNav.share) {
      setToast('공유 기능이 없는 기기야. 텔레그램에 붙여넣기 해줘!');
      return;
    }

    try {
      await anyNav.share({ title: 'Hanja Study Export', text: exp.text });
      setToast('공유 창을 열었어!');
    } catch {
      // user cancelled etc.
    }
  }

  const title = exportLabel({ kind, format });

  return (
    <main className="mx-auto max-w-md p-4">
      {toast && <Toast text={toast} onDone={() => setToast(null)} />}

      <div className="mb-3 flex items-center justify-between">
        <Link className="text-sm text-blue-600 underline" href="/progress">
          ← 진도
        </Link>
        <h1 className="text-xl font-bold">내보내기</h1>
        <div />
      </div>

      <Card className="p-3">
        <div className="text-xs font-extrabold" style={{ color: 'var(--muted)' }}>
          4단계로 딱! (포맷 → 기간/양 → 미리보기 → 내보내기)
        </div>
        <div className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
          마지막 선택값은 저장돼서, 다시 와도 그대로야.
        </div>
      </Card>

      <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs" style={{ color: 'var(--muted)' }}>
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className={`rounded-2xl px-2 py-1 ${step === n ? 'bg-white/70 font-extrabold' : 'bg-white/40'}`}>
            {n}
          </div>
        ))}
      </div>

      {step === 1 && (
        <section className="mt-3 space-y-2">
          <Card className="p-4">
            <div className="text-sm font-extrabold">1) 포맷을 골라줘</div>
            <div className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
              ID는 텔레그램에 짧게 보내기 좋아. JSON은 자세한 정보(뜻/음/예시)까지 들어 있어.
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button variant={kind === 'weak' && format === 'ids' ? 'primary' : 'ghost'} onClick={() => (setKind('weak'), setFormat('ids'))}>
                약점 ID
              </Button>
              <Button variant={kind === 'due' && format === 'ids' ? 'primary' : 'ghost'} onClick={() => (setKind('due'), setFormat('ids'))}>
                due ID
              </Button>
              <Button variant={kind === 'weak' && format === 'json' ? 'primary' : 'ghost'} onClick={() => (setKind('weak'), setFormat('json'))}>
                약점 JSON
              </Button>
              <Button variant={kind === 'due' && format === 'json' ? 'primary' : 'ghost'} onClick={() => (setKind('due'), setFormat('json'))}>
                due JSON
              </Button>
            </div>

            <div className="mt-4 flex gap-2">
              <Button className="w-full" variant="primary" onClick={() => setStep(2)}>
                다음
              </Button>
            </div>
          </Card>
        </section>
      )}

      {step === 2 && (
        <section className="mt-3 space-y-2">
          <Card className="p-4">
            <div className="text-sm font-extrabold">2) 기간/양을 골라줘</div>
            <div className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
              텔레그램은 글자 수 제한이 있어. 길면 “짧게”로 줄이면 안전해.
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <Button variant={size === 'short' ? 'primary' : 'ghost'} onClick={() => setSize('short')}>
                짧게
                <span className="ml-1 text-xs" style={{ color: 'var(--muted)' }}>
                  (10)
                </span>
              </Button>
              <Button variant={size === 'normal' ? 'primary' : 'ghost'} onClick={() => setSize('normal')}>
                기본
                <span className="ml-1 text-xs" style={{ color: 'var(--muted)' }}>
                  (50)
                </span>
              </Button>
              <Button variant={size === 'long' ? 'primary' : 'ghost'} onClick={() => setSize('long')}>
                길게
                <span className="ml-1 text-xs" style={{ color: 'var(--muted)' }}>
                  (100)
                </span>
              </Button>
            </div>

            <div className="mt-4 flex gap-2">
              <Button className="w-full" variant="ghost" onClick={() => setStep(1)}>
                이전
              </Button>
              <Button className="w-full" variant="primary" onClick={() => setStep(3)}>
                다음
              </Button>
            </div>
          </Card>
        </section>
      )}

      {step === 3 && (
        <section className="mt-3 space-y-2">
          <Card className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-sm font-extrabold">3) 미리보기</div>
                <div className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
                  {title} · {exp.itemCount}개 · {exp.charCount.toLocaleString()}자
                </div>
              </div>
              <div className={`rounded-2xl px-3 py-1 text-xs ${hint.level === 'ok' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-800'}`}>
                {hint.level === 'ok' ? 'OK' : '주의'}
              </div>
            </div>
            <div className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>
              {hint.text}
            </div>

            <pre className="mt-3 max-h-72 overflow-auto rounded-2xl bg-white/60 p-3 text-[11px] leading-relaxed">
              {exp.text}
            </pre>

            {status === 'error' && errorReason && (
              <div className="mt-3 rounded-2xl bg-red-50 p-3 text-xs text-red-700">
                <div className="font-extrabold">왜 실패했을까?</div>
                <div className="mt-1 break-words">{errorReason}</div>
                <div className="mt-2">복사가 안 되면 위 미리보기에서 길게 눌러서 복사해줘.</div>
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <Button className="w-full" variant="ghost" onClick={() => setStep(2)}>
                이전
              </Button>
              <Button className="w-full" variant="primary" onClick={() => setStep(4)}>
                내보내기
              </Button>
            </div>
          </Card>
        </section>
      )}

      {step === 4 && (
        <section className="mt-3 space-y-2">
          <Card className="p-4">
            <div className="text-sm font-extrabold">4) 내보내기</div>
            <div className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
              {title} · {exp.itemCount}개
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button variant="primary" onClick={doCopy}>
                복사하기
              </Button>
              <Button variant="ghost" onClick={downloadFile}>
                파일로 저장
              </Button>
            </div>

            {status === 'success' && (
              <div className="mt-3 rounded-2xl bg-green-50 p-3 text-xs text-green-700">
                <div className="font-extrabold">완료!</div>
                <div className="mt-1">이제 공유하거나 닫아도 돼.</div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button variant="ghost" onClick={shareText}>
                    공유
                  </Button>
                  <Link className="btn btn-primary focus-ring inline-flex items-center justify-center" href="/progress">
                    닫기
                  </Link>
                </div>
              </div>
            )}

            {status !== 'success' && (
              <div className="mt-4 flex gap-2">
                <Button className="w-full" variant="ghost" onClick={() => setStep(3)}>
                  미리보기로
                </Button>
                <Link className="btn btn-primary focus-ring inline-flex w-full items-center justify-center" href="/progress">
                  닫기
                </Link>
              </div>
            )}

            {status === 'error' && (
              <div className="mt-3">
                <Button className="w-full" variant="primary" onClick={doCopy}>
                  다시 시도
                </Button>
              </div>
            )}
          </Card>
        </section>
      )}

      <Card className="mt-4 p-3">
        <div className="text-xs font-extrabold" style={{ color: 'var(--muted)' }}>
          팁
        </div>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs" style={{ color: 'var(--muted)' }}>
          <li>텔레그램에 보낼 땐 ID가 제일 가볍고 안전해.</li>
          <li>JSON은 길 수 있어. 길면 “짧게(10)”로 줄여봐.</li>
          <li>복사가 막히면 미리보기에서 길게 눌러서 복사하면 돼.</li>
        </ul>
      </Card>
    </main>
  );
}
