"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/lib/language";

const INSURANCES = [
  "Self-pay",
  "NSSF (National Social Security Fund)",
  "Allianz",
  "AXA",
  "Bupa Global",
  "Cigna",
  "Cumberland",
  "GlobeMed",
  "MedNet",
  "MSH International",
];

export default function PatientCompletePage() {
  const router = useRouter();
  const { lang, setLang, t } = useLanguage();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    insurance: "",
    insuranceNumber: "",
    emergencyName: "",
    emergencyPhone: "",
    preferredLang: "en" as "en" | "ar",
    notifySms: true,
    notifyEmail: true,
    notifyPush: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function pickPhoto() { fileRef.current?.click(); }
  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.emergencyName) e.emergencyName = t("Required", "مطلوب");
    if (!form.emergencyPhone) e.emergencyPhone = t("Required", "مطلوب");
    if (form.insurance && form.insurance !== "Self-pay" && !form.insuranceNumber) {
      e.insuranceNumber = t("Required for insurance", "مطلوب للتأمين");
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function submit() {
    if (!validate()) return;
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      // Clean up step data
      localStorage.removeItem("patient-register-step1");
      router.push("/auth/patient/login?registered=1");
    }, 800);
  }

  return (
    <div className="min-h-screen bg-base flex">
      {/* ─── LEFT PROGRESS PANEL ─── */}
      <div className="hidden lg:flex lg:w-[36%] relative overflow-hidden text-white" style={{ background: "linear-gradient(155deg, #0F6E56 0%, #0A5743 60%, #084637 100%)" }}>
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #FFFFFF 0%, transparent 70%)" }} />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #1D9E75 0%, transparent 70%)" }} />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-white/15 backdrop-blur-sm border border-white/20">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 2h6v6l4 11a2 2 0 0 1-2 3H7a2 2 0 0 1-2-3l4-11V2z" /><path d="M8 14h8" />
              </svg>
            </div>
            <div>
              <p className="text-base font-semibold">Klev LIMS</p>
              <p className="text-[10px] text-white/60 uppercase tracking-widest">{t("Patient Portal", "بوابة المرضى")}</p>
            </div>
          </div>

          {/* Vertical step list */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/50 font-semibold mb-6">{t("Registration Progress", "تقدم التسجيل")}</p>
            <ol className="space-y-1">
              <VStep n={1} title={t("Personal Information", "المعلومات الشخصية")} desc={t("Basic details and contact", "البيانات الأساسية والاتصال")} status="done" />
              <VStep n={2} title={t("Phone Verification", "التحقق من الهاتف")} desc={t("SMS code confirmed", "تم تأكيد رمز الرسائل")} status="done" />
              <VStep n={3} title={t("Profile Setup", "إعداد الملف الشخصي")} desc={t("Insurance & preferences", "التأمين والتفضيلات")} status="active" />
            </ol>
          </div>

          <div>
            <p className="text-[11px] text-white/40">{t("Almost done — just a few more details.", "اقتربنا من الانتهاء — بعض التفاصيل الإضافية فقط.")}</p>
          </div>
        </div>
      </div>

      {/* ─── RIGHT FORM PANEL ─── */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-end px-6 py-4">
          <div className="flex items-center bg-gray-lighter rounded-lg p-0.5">
            <button onClick={() => setLang("en")} className={`px-3 py-1.5 text-[11px] font-medium rounded-md transition-colors ${lang === "en" ? "bg-surface text-teal shadow-sm" : "text-gray"}`}>EN</button>
            <button onClick={() => setLang("ar")} className={`px-3 py-1.5 text-[11px] font-medium rounded-md transition-colors ${lang === "ar" ? "bg-surface text-teal shadow-sm" : "text-gray"}`}>العربية</button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-lg">
            {/* Mobile-only step indicator */}
            <div className="lg:hidden mb-6">
              <p className="text-[11px] text-gray font-mono-data">{t("Step 3 of 3", "الخطوة 3 من 3")}</p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-ink">{t("Complete your profile", "أكمل ملفك الشخصي")}</h2>
              <p className="text-sm text-gray mt-1.5">
                {t("Add insurance and emergency contact information.", "أضف معلومات التأمين وجهة الاتصال للطوارئ.")}
              </p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="mt-7 space-y-5">
              {/* Photo upload */}
              <div>
                <label className="block text-xs font-medium text-ink-soft mb-2">{t("Profile photo", "صورة الملف الشخصي")}</label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={pickPhoto}
                    className="relative w-20 h-20 rounded-full border-2 border-dashed border-border bg-gray-lighter/60 flex items-center justify-center overflow-hidden hover:border-teal/40 hover:bg-teal-soft transition-all flex-shrink-0 group"
                  >
                    {photoPreview ? (
                      <img src={photoPreview} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray group-hover:text-teal transition-colors">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                    )}
                    <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-teal text-white flex items-center justify-center border-2 border-surface">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </div>
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
                  <div>
                    <button type="button" onClick={pickPhoto} className="text-[12px] font-semibold text-teal hover:underline">
                      {photoPreview ? t("Change photo", "تغيير الصورة") : t("Upload photo", "تحميل صورة")}
                    </button>
                    <p className="text-[10px] text-gray mt-0.5">{t("JPG or PNG, max 5 MB", "JPG أو PNG، 5 ميغا كحد أقصى")}</p>
                  </div>
                </div>
              </div>

              {/* Insurance */}
              <div className="space-y-4 pt-2">
                <p className="text-[10px] uppercase tracking-wider text-gray font-semibold">{t("Insurance", "التأمين")}</p>
                <Select label={t("Insurance provider", "شركة التأمين")} value={form.insurance} onChange={(e) => setForm({ ...form, insurance: e.target.value })}>
                  <option value="">{t("— Select —", "— اختر —")}</option>
                  {INSURANCES.map((i) => <option key={i} value={i}>{i}</option>)}
                </Select>
                {form.insurance && form.insurance !== "Self-pay" && (
                  <Input
                    label={t("Insurance number", "رقم التأمين")}
                    value={form.insuranceNumber}
                    onChange={(e) => setForm({ ...form, insuranceNumber: e.target.value })}
                    error={errors.insuranceNumber}
                  />
                )}
              </div>

              {/* Emergency contact */}
              <div className="space-y-4 pt-2">
                <p className="text-[10px] uppercase tracking-wider text-gray font-semibold">{t("Emergency Contact", "جهة الاتصال للطوارئ")}</p>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label={t("Full name", "الاسم الكامل")}
                    required
                    value={form.emergencyName}
                    onChange={(e) => setForm({ ...form, emergencyName: e.target.value })}
                    error={errors.emergencyName}
                  />
                  <Input
                    label={t("Phone", "الهاتف")}
                    type="tel"
                    required
                    value={form.emergencyPhone}
                    onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })}
                    error={errors.emergencyPhone}
                  />
                </div>
              </div>

              {/* Preferences */}
              <div className="space-y-4 pt-2">
                <p className="text-[10px] uppercase tracking-wider text-gray font-semibold">{t("Preferences", "التفضيلات")}</p>

                <div>
                  <label className="block text-xs font-medium text-ink-soft mb-2">{t("Preferred language", "اللغة المفضلة")}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["en", "ar"] as const).map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setForm({ ...form, preferredLang: l })}
                        className={`h-[42px] px-3 text-[12px] rounded-lg border transition-all flex items-center justify-center gap-2 ${
                          form.preferredLang === l
                            ? "bg-teal-soft border-teal text-teal font-semibold ring-1 ring-teal/20"
                            : "bg-surface border-border text-gray hover:border-teal/30"
                        }`}
                      >
                        <span className="text-base">{l === "en" ? "🇬🇧" : "🇱🇧"}</span>
                        {l === "en" ? "English" : "العربية"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-soft mb-2">{t("Notification preferences", "تفضيلات الإشعارات")}</label>
                  <div className="space-y-2">
                    <ToggleRow
                      icon="sms"
                      title={t("SMS notifications", "إشعارات الرسائل")}
                      desc={t("Critical results and appointment reminders", "النتائج الحرجة وتذكير المواعيد")}
                      checked={form.notifySms}
                      onChange={(v) => setForm({ ...form, notifySms: v })}
                    />
                    <ToggleRow
                      icon="email"
                      title={t("Email notifications", "إشعارات البريد")}
                      desc={t("Result reports and account updates", "تقارير النتائج وتحديثات الحساب")}
                      checked={form.notifyEmail}
                      onChange={(v) => setForm({ ...form, notifyEmail: v })}
                    />
                    <ToggleRow
                      icon="push"
                      title={t("Push notifications", "إشعارات التطبيق")}
                      desc={t("Real-time updates in the mobile app", "تحديثات فورية في تطبيق الهاتف")}
                      checked={form.notifyPush}
                      onChange={(v) => setForm({ ...form, notifyPush: v })}
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" loading={saving} className="w-full" size="lg">
                {t("Complete Setup", "إكمال الإعداد")}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </Button>

              <p className="text-[11px] text-gray text-center">
                {t("By completing setup you agree to our", "بإكمال الإعداد فإنك توافق على")}{" "}
                <Link href="#" className="text-teal hover:underline">{t("Terms", "الشروط")}</Link>
                {" "}{t("and", "و")}{" "}
                <Link href="#" className="text-teal hover:underline">{t("Privacy Policy", "سياسة الخصوصية")}</Link>.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function VStep({ n, title, desc, status }: { n: number; title: string; desc: string; status: "done" | "active" | "pending" }) {
  return (
    <li className="relative pl-12 pb-6 last:pb-0">
      {/* Vertical line */}
      <span className={`absolute left-[14px] top-8 w-0.5 h-full ${status === "done" ? "bg-white/40" : "bg-white/10"} -z-0`} />

      {/* Number circle */}
      <span className={`absolute left-0 top-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${
        status === "done" ? "bg-white text-teal" :
        status === "active" ? "bg-white text-teal ring-4 ring-white/25" :
        "bg-white/15 text-white/50 border border-white/20"
      }`}>
        {status === "done" ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        ) : n}
      </span>

      <p className={`text-[13px] font-semibold ${status === "active" ? "text-white" : "text-white/85"}`}>{title}</p>
      <p className="text-[11px] text-white/55 mt-0.5">{desc}</p>
    </li>
  );
}

function ToggleRow({ icon, title, desc, checked, onChange }: { icon: string; title: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  const icons: Record<string, React.ReactNode> = {
    sms: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    email: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
    push: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>,
  };
  return (
    <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
      checked ? "bg-teal-soft border-teal/30" : "bg-surface border-border hover:border-teal/30"
    }`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${checked ? "bg-teal text-white" : "bg-gray-lighter text-gray"}`}>
        {icons[icon]}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] font-medium ${checked ? "text-teal" : "text-ink"}`}>{title}</p>
        <p className="text-[10px] text-gray">{desc}</p>
      </div>
      <span className="relative inline-flex items-center flex-shrink-0">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
        <span className="w-10 h-5 bg-gray-light rounded-full peer-checked:bg-teal transition-colors" />
        <span className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}
