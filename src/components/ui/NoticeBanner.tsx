import { NOTICE, NOTICE_SHORT } from "@/lib/copy";

export function NoticeBannerFull() {
  return (
    <div className="animate-in rounded-2xl bg-accent-soft p-5 sm:p-6">
      <p className="text-base font-medium text-foreground">{NOTICE.opener}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-surface px-3 py-1 text-sm font-semibold text-foreground shadow-sm">
          {NOTICE.pill}
        </span>
        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-accent-dark">
          {NOTICE.playfulEmoji} {NOTICE.playful}
        </span>
      </div>
      <p className="mt-3 text-sm text-muted">{NOTICE.closer}</p>
    </div>
  );
}

export function NoticeBannerShort() {
  return (
    <p className="flex items-center gap-1.5 text-sm font-semibold text-accent-dark">
      <span aria-hidden>{NOTICE.playfulEmoji}</span>
      {NOTICE_SHORT}
    </p>
  );
}
