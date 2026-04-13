"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/lib/language";

export default function PatientRegisterPage() {
  const router = useRouter();
  const { lang, setLang, t } = useLanguage();
  const [form, setForm] = useState({
    fullName: "",
    dateOfBirth: "",
    gender: "MALE",
    nationalId: "",
    countryCode: "+961",
    mobile: "",
    email: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  // Restore previously entered data
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("patient-register-step1") : null;
    if (saved) {
      try { setForm(JSON.parse(saved)); } catch {}
    }
  }, []);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.fullName) e.fullName = t("Required", "مطلوب");
    if (!form.dateOfBirth) e.dateOfBirth = t("Required", "مطلوب");
    if (!form.nationalId) e.nationalId = t("Required", "مطلوب");
    if (!form.mobile) e.mobile = t("Required", "مطلوب");
    else if (!/^\d{6,12}$/.test(form.mobile)) e.mobile = t("Invalid mobile number", "رقم جوال غير صالح");
    if (!form.email) e.email = t("Required", "مطلوب");
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = t("Invalid email", "بريد إلكتروني غير صالح");
    if (!otpSent) e._form = t("Please request a verification code first", "يرجى طلب رمز التحقق أولاً");
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function sendOtp() {
    if (!form.mobile || !/^\d{6,12}$/.test(form.mobile)) {
      setErrors({ mobile: t("Enter a valid mobile first", "أدخل رقم جوال صالح أولاً") });
      return;
    }
    setOtpSent(true);
    setErrors({});
  }

  function submit() {
    if (!validate()) return;
    setLoading(true);
    localStorage.setItem("patient-register-step1", JSON.stringify(form));
    router.push("/auth/patient/verify");
  }

  return (
    <div className="min-h-screen bg-base flex">
      {/* ─── LEFT BRAND PANEL ─── */}
      <div className="hidden lg:flex lg:w-[44%] relative overflow-hidden text-white" style={{ background: "linear-gradient(155deg, #0F6E56 0%, #0A5743 50%, #084637 100%)" }}>
        {/* Decorative blurs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #FFFFFF 0%, transparent 70%)" }} />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #1D9E75 0%, transparent 70%)" }} />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
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

          {/* Tagline */}
          <div>
            <h1 className="text-4xl font-semibold leading-tight">
              {t("Your health,", "صحتك،")}<br />
              {t("at your fingertips.", "في متناول يديك.")}
            </h1>
            <p className="text-base text-white/75 mt-4 max-w-md leading-relaxed">
              {t(
                "Access your lab results, book appointments, and manage your health records — anytime, anywhere.",
                "اطلع على نتائج فحوصاتك، احجز مواعيدك، وأدر سجلاتك الصحية — في أي وقت ومن أي مكان."
              )}
            </p>
          </div>

          {/* Trust indicators */}
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-widest text-white/50 font-semibold">{t("Trusted & Certified", "موثوق ومعتمد")}</p>
            <div className="flex items-center gap-3 flex-wrap">
              <TrustBadge icon="shield" text={t("ISO 15189 Certified", "معتمد ISO 15189")} />
              <TrustBadge icon="lock" text={t("Privacy Assured", "خصوصية مضمونة")} />
              <TrustBadge icon="check" text={t("HIPAA Compliant", "متوافق مع HIPAA")} />
            </div>
            <p className="text-[11px] text-white/40 mt-4">
              © 2026 Klev Diagnostic Laboratory. {t("All rights reserved.", "جميع الحقوق محفوظة.")}
            </p>
          </div>
        </div>
      </div>

      {/* ─── RIGHT FORM PANEL ─── */}
      <div className="flex-1 flex flex-col">
        {/* Top bar with lang toggle */}
        <div className="flex items-center justify-end px-6 py-4">
          <div className="flex items-center bg-gray-lighter rounded-lg p-0.5">
            <button onClick={() => setLang("en")} className={`px-3 py-1.5 text-[11px] font-medium rounded-md transition-colors ${lang === "en" ? "bg-surface text-teal shadow-sm" : "text-gray"}`}>EN</button>
            <button onClick={() => setLang("ar")} className={`px-3 py-1.5 text-[11px] font-medium rounded-md transition-colors ${lang === "ar" ? "bg-surface text-teal shadow-sm" : "text-gray"}`}>العربية</button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            {/* Step indicator */}
            <StepIndicator current={1} />

            <div className="mt-8">
              <h2 className="text-2xl font-semibold text-ink">{t("Create your account", "أنشئ حسابك")}</h2>
              <p className="text-sm text-gray mt-1.5">
                {t("Start by entering your personal details below.", "ابدأ بإدخال معلوماتك الشخصية أدناه.")}
              </p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="mt-7 space-y-4">
              <Input
                label={t("Full name", "الاسم الكامل")}
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                error={errors.fullName}
                placeholder={t("As shown on your ID", "كما هو مكتوب في الهوية")}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label={t("Date of birth", "تاريخ الميلاد")}
                  type="date"
                  required
                  value={form.dateOfBirth}
                  onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                  error={errors.dateOfBirth}
                />
                <div>
                  <label className="block text-xs font-medium text-ink-soft mb-1.5">{t("Gender", "الجنس")} <span className="text-critical">*</span></label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(["MALE", "FEMALE"] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setForm({ ...form, gender: g })}
                        className={`h-[38px] px-3 text-[12px] rounded-lg border transition-all ${
                          form.gender === g
                            ? "bg-teal-soft border-teal text-teal font-medium ring-1 ring-teal/20"
                            : "bg-surface border-border text-gray hover:border-teal/30"
                        }`}
                      >
                        {g === "MALE" ? t("Male", "ذكر") : t("Female", "أنثى")}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Input
                label={t("National ID / Passport", "الهوية الوطنية / جواز السفر")}
                required
                value={form.nationalId}
                onChange={(e) => setForm({ ...form, nationalId: e.target.value })}
                error={errors.nationalId}
              />

              {/* Mobile with country code */}
              <div>
                <label className="block text-xs font-medium text-ink-soft mb-1.5">{t("Mobile number", "رقم الجوال")} <span className="text-critical">*</span></label>
                <div className="flex gap-2">
                  <select
                    value={form.countryCode}
                    onChange={(e) => setForm({ ...form, countryCode: e.target.value })}
                    className="!w-[110px] flex-shrink-0 font-mono-data"
                  >
                    <option value="+961">🇱🇧 +961</option>
                    <option value="+962">🇯🇴 +962</option>
                    <option value="+963">🇸🇾 +963</option>
                    <option value="+966">🇸🇦 +966</option>
                    <option value="+971">🇦🇪 +971</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                  </select>
                  <input
                    type="tel"
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\D/g, "") })}
                    placeholder="71 234 567"
                    className="flex-1 font-mono-data"
                  />
                </div>
                {errors.mobile && <p className="text-[11px] text-critical mt-1">{errors.mobile}</p>}
              </div>

              <Input
                label={t("Email address", "البريد الإلكتروني")}
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                error={errors.email}
                placeholder="you@example.com"
              />

              {/* OTP send */}
              <div className={`rounded-lg border p-3 transition-colors ${otpSent ? "bg-success-soft border-success/20" : "bg-teal-soft border-teal/15"}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${otpSent ? "bg-success text-white" : "bg-teal text-white"}`}>
                      {otpSent ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-[12px] font-semibold ${otpSent ? "text-success" : "text-teal"}`}>
                        {otpSent ? t("Verification code sent", "تم إرسال رمز التحقق") : t("Verify your mobile number", "تحقق من رقم جوالك")}
                      </p>
                      <p className="text-[10px] text-gray truncate">
                        {otpSent
                          ? t(`Check SMS at ${form.countryCode} ${form.mobile}`, `تحقق من الرسائل على ${form.countryCode} ${form.mobile}`)
                          : t("We'll send a 6-digit code via SMS", "سنرسل رمزاً مكوناً من 6 أرقام عبر الرسائل القصيرة")}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={sendOtp}
                    className={`flex-shrink-0 px-3 py-1.5 text-[11px] font-semibold rounded-md transition-colors ${
                      otpSent ? "bg-surface text-success border border-success/20" : "bg-teal text-white hover:bg-teal-dark"
                    }`}
                  >
                    {otpSent ? t("Resend", "إعادة إرسال") : t("Send Code", "إرسال الرمز")}
                  </button>
                </div>
              </div>

              {errors._form && (
                <div className="bg-critical-soft border border-critical/20 rounded-lg px-3 py-2.5 text-xs text-critical">{errors._form}</div>
              )}

              <Button type="submit" loading={loading} className="w-full" size="lg">
                {t("Continue", "متابعة")}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </Button>
            </form>

            {/* Footer link */}
            <p className="text-center text-[12px] text-gray mt-6">
              {t("Already registered?", "مسجل بالفعل؟")}{" "}
              <Link href="/auth/patient/login" className="text-teal font-semibold hover:underline">
                {t("Sign in", "تسجيل الدخول")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  const { t } = useLanguage();
  const steps = [
    { n: 1, label: t("Info", "المعلومات") },
    { n: 2, label: t("Verify", "التحقق") },
    { n: 3, label: t("Profile", "الملف الشخصي") },
  ];
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        {steps.map((s, i) => {
          const isActive = s.n === current;
          const isDone = s.n < current;
          return (
            <div key={s.n} className="flex items-center flex-1">
              <div className={`flex items-center gap-2 ${i < steps.length - 1 ? "flex-1" : ""}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 transition-colors ${
                  isActive ? "bg-teal text-white ring-4 ring-teal/15" : isDone ? "bg-teal text-white" : "bg-gray-lighter text-gray"
                }`}>
                  {isDone ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : s.n}
                </div>
                <span className={`text-[11px] font-medium ${isActive ? "text-teal" : isDone ? "text-ink-soft" : "text-gray"}`}>
                  {s.label}
                </span>
                {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-2 rounded ${isDone ? "bg-teal" : "bg-gray-lighter"}`} />}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-gray font-mono-data">{t(`Step ${current} of 3`, `الخطوة ${current} من 3`)}</p>
    </div>
  );
}

function TrustBadge({ icon, text }: { icon: string; text: string }) {
  const icons: Record<string, React.ReactNode> = {
    shield: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>,
    lock: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    check: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  };
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 backdrop-blur-sm border border-white/15 text-[11px] text-white/90">
      {icons[icon]}
      {text}
    </span>
  );
}
