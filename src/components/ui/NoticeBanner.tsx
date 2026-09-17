import { NOTICE, NOTICE_SHORT } from "@/lib/copy";

export function NoticeBannerFull() {
  return (
    <div className="animate-in space-y-2 rounded-2xl bg-accent-soft p-5 sm:p-6">
      <p className="text-base font-medium text-foreground">{NOTICE.opener}</p>
      <p className="text-sm text-muted">{NOTICE.summitDetails}</p>
      <p className="text-sm text-muted">{NOTICE.pill}</p>
      <p className="text-sm font-semibold text-accent-dark">
        {NOTICE.playfulEmoji} {NOTICE.playful} {NOTICE.playfulEmoji}
      </p>
      <p className="text-sm text-muted">{NOTICE.closer}</p>
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
