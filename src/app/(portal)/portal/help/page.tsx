import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Help & Support" description="Get answers and reach our patient services team" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ContactCard
          icon="phone"
          title="Call us"
          value="+961 1 234 567"
          desc="Mon–Sat 8:00 AM – 8:00 PM"
        />
        <ContactCard
          icon="mail"
          title="Email"
          value="support@klevlab.com"
          desc="We respond within 24 hours"
        />
        <ContactCard
          icon="message"
          title="WhatsApp"
          value="+961 70 999 888"
          desc="Quick questions and updates"
        />
      </div>

      <Card>
        <CardHeader><CardTitle>Frequently Asked Questions</CardTitle></CardHeader>
        <div className="divide-y divide-border">
          <FAQ q="How do I book a test?" a="You can book a test from the Appointments tab, or walk in to any of our branches during operating hours." />
          <FAQ q="When will my results be ready?" a="Most routine tests are ready within 24 hours. Specialized tests may take 3–7 days. Check the My Results section for live status." />
          <FAQ q="How do I share results with my doctor?" a="Open any result and click 'Share with Doctor'. We'll generate a secure 7-day link you can send to your physician." />
          <FAQ q="Are my results secure?" a="Yes. All data is encrypted, HIPAA compliant, and only accessible to you and the medical staff you authorize." />
          <FAQ q="Can I download a PDF report?" a="Yes — every released result has a PDF download button. You can also download invoices from the Billing section." />
        </div>
      </Card>
    </div>
  );
}

function ContactCard({ icon, title, value, desc }: { icon: string; title: string; value: string; desc: string }) {
  const icons: Record<string, React.ReactNode> = {
    phone: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
    mail: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
    message: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  };
  return (
    <Card>
      <div className="p-5">
        <div className="w-12 h-12 rounded-lg bg-teal-soft text-teal flex items-center justify-center mb-3">{icons[icon]}</div>
        <p className="text-[11px] uppercase tracking-wider text-gray font-semibold">{title}</p>
        <p className="text-base font-semibold text-ink mt-1 font-mono-data">{value}</p>
        <p className="text-[11px] text-gray mt-1">{desc}</p>
      </div>
    </Card>
  );
}

function FAQ({ q, a }: { q: string; a: string }) {
  return (
    <details className="group">
      <summary className="px-6 py-4 cursor-pointer flex items-center justify-between gap-3 hover:bg-gray-lighter/30 transition-colors">
        <p className="text-[13px] font-medium text-ink">{q}</p>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray transition-transform group-open:rotate-180">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </summary>
      <div className="px-6 pb-4 text-[12px] text-ink-soft leading-relaxed">{a}</div>
    </details>
  );
}
