"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { fmtDate, fmtDateTime, fmtRelative } from "@/lib/format";

type Share = {
  id: string;
  doctorName: string;
  specialty: string;
  email: string;
  accessLevel: "VIEW" | "DOWNLOAD" | "FULL";
  expiresAt: string;
  createdAt: string;
};

const INITIAL_SHARES: Share[] = [
  { id: "s1", doctorName: "Dr. Karim Mansour", specialty: "Internal Medicine", email: "k.mansour@bmc.lb", accessLevel: "FULL", expiresAt: "2026-05-15", createdAt: "2026-04-01" },
  { id: "s2", doctorName: "Dr. Yara Fares", specialty: "Endocrinology", email: "yara.f@auh.lb", accessLevel: "DOWNLOAD", expiresAt: "2026-04-30", createdAt: "2026-03-15" },
  { id: "s3", doctorName: "Dr. Tarek Aoun", specialty: "Cardiology", email: "t.aoun@hd.lb", accessLevel: "VIEW", expiresAt: "2026-04-20", createdAt: "2026-04-05" },
];

const ACCESS_LOG = [
  { id: "a1", who: "Dr. Karim Mansour", action: "Viewed CBC + BMP results", ip: "212.98.x.x · Beirut", time: new Date(Date.now() - 2 * 3600000) },
  { id: "a2", who: "Dr. Karim Mansour", action: "Downloaded report PDF", ip: "212.98.x.x · Beirut", time: new Date(Date.now() - 2 * 3600000 - 60000) },
  { id: "a3", who: "Dr. Yara Fares", action: "Viewed HbA1c trend", ip: "94.187.x.x · Beirut", time: new Date(Date.now() - 1 * 86400000) },
  { id: "a4", who: "You", action: "Generated share link for Dr. Aoun", ip: "Mobile · Beirut", time: new Date(Date.now() - 5 * 86400000) },
  { id: "a5", who: "Dr. Tarek Aoun", action: "Viewed Lipid Panel results", ip: "185.42.x.x · Beirut", time: new Date(Date.now() - 5 * 86400000 + 7200000) },
];

export default function PrivacyAccessPage() {
  const [shares, setShares] = useState<Share[]>(INITIAL_SHARES);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [consents, setConsents] = useState({
    research: false,
    marketing: false,
    sms: true,
    thirdParty: false,
    aiAnalysis: true,
  });

  function revoke(id: string) {
    setShares((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Privacy & Access"
        description="Control who can see your results and how your data is used"
      />

      {/* Section 1: Active Shares */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Active Shares</CardTitle>
            <p className="text-xs text-gray mt-0.5">Doctors and parties currently authorized to view your results</p>
          </div>
          <span className="text-xs text-gray font-mono-data">{shares.length} active</span>
        </CardHeader>
        <div className="overflow-auto">
          <table className="lims-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Specialty</th>
                <th>Access Level</th>
                <th>Expires</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shares.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12">
                  <div className="w-12 h-12 mx-auto rounded-full bg-success-soft text-success flex items-center justify-center mb-3">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
                  </div>
                  <p className="text-sm font-medium text-ink">No active shares</p>
                  <p className="text-xs text-gray mt-1">You haven&apos;t granted access to anyone</p>
                </td></tr>
              ) : shares.map((s) => {
                const daysLeft = Math.floor((new Date(s.expiresAt).getTime() - Date.now()) / 86400000);
                const expiringSoon = daysLeft < 7;
                return (
                  <tr key={s.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-teal-soft text-teal flex items-center justify-center text-[11px] font-semibold flex-shrink-0">
                          {s.doctorName.split(" ").slice(-2).map((n) => n[0]).join("")}
                        </div>
                        <div>
                          <p className="font-medium text-ink">{s.doctorName}</p>
                          <p className="text-[10px] text-gray font-mono-data">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-gray text-[12px]">{s.specialty}</td>
                    <td>
                      <StatusBadge tone={s.accessLevel === "FULL" ? "teal" : s.accessLevel === "DOWNLOAD" ? "info" : "neutral"}>
                        {s.accessLevel === "FULL" ? "Full Access" : s.accessLevel === "DOWNLOAD" ? "View + Download" : "View Only"}
                      </StatusBadge>
                    </td>
                    <td>
                      <p className={`text-[12px] font-mono-data ${expiringSoon ? "text-warning font-semibold" : "text-ink-soft"}`}>{fmtDate(s.expiresAt)}</p>
                      <p className={`text-[10px] ${expiringSoon ? "text-warning" : "text-gray"}`}>
                        {daysLeft < 0 ? "Expired" : daysLeft === 0 ? "Expires today" : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`}
                      </p>
                    </td>
                    <td className="text-right">
                      <button onClick={() => revoke(s.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-md border border-critical/20 text-critical hover:bg-critical-soft transition-colors">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                        Revoke
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Section 2: Share Results */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Share Results</CardTitle>
            <p className="text-xs text-gray mt-0.5">Generate a secure link to share specific results with someone</p>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select label="Results to share">
              <option>Last 30 days (recent results)</option>
              <option>All available results</option>
              <option>Specific tests…</option>
            </Select>
            <Select label="Access level">
              <option value="VIEW">View only</option>
              <option value="DOWNLOAD">View + Download PDF</option>
              <option value="FULL">Full access</option>
            </Select>
            <Input label="Expires in" type="date" defaultValue={new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Recipient email" type="email" placeholder="doctor@clinic.com" />
            <Input label="PIN protection (optional)" placeholder="6-digit code" hint="Recipient will need this PIN to view" />
          </div>
          <div className="flex items-center justify-between p-3 bg-info-soft border border-info/15 rounded-lg">
            <div className="flex items-start gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
              <p className="text-[11px] text-info">
                Shared links are encrypted and one-time generated. The recipient will receive an email with the secure link and PIN if set.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button variant="ghost">Cancel</Button>
            <Button onClick={() => setShareModalOpen(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              Generate Secure Link
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Section 3: Access Log */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Access Log</CardTitle>
            <p className="text-xs text-gray mt-0.5">Recent activity on your medical records</p>
          </div>
          <button className="text-xs text-teal hover:underline">View all →</button>
        </CardHeader>
        <CardBody>
          <ol className="relative border-l-2 border-border space-y-4 ml-2">
            {ACCESS_LOG.map((a) => {
              const isYou = a.who === "You";
              return (
                <li key={a.id} className="ml-5">
                  <span className={`absolute -left-[7px] w-3 h-3 rounded-full border-2 border-surface ${isYou ? "bg-teal" : "bg-info"}`} />
                  <div className="bg-gray-lighter/40 rounded-lg p-3 border border-border">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${isYou ? "bg-teal text-white" : "bg-info text-white"}`}>
                          {isYou ? "Y" : a.who.split(" ").slice(-2).map((n) => n[0]).join("")}
                        </div>
                        <p className="text-[12px] font-medium text-ink">{a.who}</p>
                      </div>
                      <span className="text-[10px] text-gray font-mono-data">{fmtRelative(a.time)}</span>
                    </div>
                    <p className="text-[12px] text-ink-soft mt-1.5 ml-9">{a.action}</p>
                    <p className="text-[10px] text-gray mt-0.5 ml-9 font-mono-data">{a.ip} · {fmtDateTime(a.time)}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </CardBody>
      </Card>

      {/* Section 4: Consent Management */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Consent Management</CardTitle>
            <p className="text-xs text-gray mt-0.5">Control how your anonymized data may be used</p>
          </div>
        </CardHeader>
        <CardBody className="space-y-2">
          <ConsentRow
            checked={consents.research}
            onChange={(v) => setConsents({ ...consents, research: v })}
            title="Anonymous research participation"
            desc="Allow your de-identified data to be used in academic medical research and population health studies."
          />
          <ConsentRow
            checked={consents.aiAnalysis}
            onChange={(v) => setConsents({ ...consents, aiAnalysis: v })}
            title="AI-assisted result interpretation"
            desc="Enable smart insights and trend detection on your results using machine learning models. Data stays within Klev."
          />
          <ConsentRow
            checked={consents.sms}
            onChange={(v) => setConsents({ ...consents, sms: v })}
            title="Health reminders via SMS"
            desc="Receive periodic reminders for routine checkups and preventive care based on your test history."
          />
          <ConsentRow
            checked={consents.marketing}
            onChange={(v) => setConsents({ ...consents, marketing: v })}
            title="Marketing communications"
            desc="Receive emails about new services, promotions, and lab updates."
          />
          <ConsentRow
            checked={consents.thirdParty}
            onChange={(v) => setConsents({ ...consents, thirdParty: v })}
            title="Third-party data sharing"
            desc="Share data with affiliated insurance and clinical partners for billing and care coordination."
          />
        </CardBody>
        <div className="px-6 py-3 border-t border-border bg-gray-lighter/40 flex items-center justify-between gap-2">
          <p className="text-[11px] text-gray">Changes take effect immediately. You can update preferences at any time.</p>
          <Button size="sm">Save Preferences</Button>
        </div>
      </Card>

      <ShareLinkModal open={shareModalOpen} onClose={() => setShareModalOpen(false)} />
    </div>
  );
}

function ConsentRow({ checked, onChange, title, desc }: { checked: boolean; onChange: (v: boolean) => void; title: string; desc: string }) {
  return (
    <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
      checked ? "bg-teal-soft border-teal/30" : "bg-surface border-border hover:border-teal/30"
    }`}>
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] font-semibold ${checked ? "text-teal" : "text-ink"}`}>{title}</p>
        <p className="text-[11px] text-gray mt-0.5">{desc}</p>
      </div>
      <span className="relative inline-flex items-center flex-shrink-0 mt-0.5">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
        <span className="w-10 h-5 bg-gray-light rounded-full peer-checked:bg-teal transition-colors" />
        <span className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

function ShareLinkModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const link = "https://klevlab.com/s/9f3a-7c2e-1b8d";
  const pin = "428193";

  function copy() {
    navigator.clipboard?.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Secure Share Link Generated"
      description="Send this link to the recipient. It will expire automatically."
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button onClick={copy}>{copied ? "Copied!" : "Copy Link"}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-success-soft text-success mb-3">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <p className="text-sm font-medium text-ink">Link is ready</p>
        </div>
        <div>
          <label className="block text-[11px] font-medium text-gray mb-1.5">Secure URL</label>
          <input value={link} readOnly className="font-mono-data text-[11px] bg-gray-lighter/60" />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-gray mb-1.5">Access PIN</label>
          <div className="flex gap-2">
            {pin.split("").map((d, i) => (
              <div key={i} className="w-10 h-12 rounded-lg border-2 border-teal bg-teal-soft flex items-center justify-center text-lg font-bold font-mono-data text-teal">{d}</div>
            ))}
          </div>
        </div>
        <div className="bg-warning-soft border border-warning/15 rounded-lg p-3 flex items-start gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/></svg>
          <p className="text-[11px] text-warning">Share the link and PIN through separate channels for maximum security. The link expires in 7 days.</p>
        </div>
      </div>
    </Modal>
  );
}
