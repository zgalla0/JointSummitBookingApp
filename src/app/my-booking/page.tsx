import { NoticeBannerShort } from "@/components/ui/NoticeBanner";
import ResendLinkForm from "@/components/ResendLinkForm";

export default function MyBookingLookupPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <div className="space-y-6">
        <div className="animate-in space-y-1">
          <p className="eyebrow">Manage your booking</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Find your booking</h1>
        </div>
        <NoticeBannerShort />
        <ResendLinkForm />
      </div>
    </main>
  );
}
