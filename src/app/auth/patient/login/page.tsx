"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useLanguage } from "@/lib/language";

export default function PatientLoginWrapper() {
  return (
    <Suspense fallback={null}>
      <PatientLoginPage />
    </Suspense>
  );
}

function PatientLoginPage() {
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "1";
  const { lang, setLang, t } = useLanguage();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!identifier || !password) {
      setError(t("Enter both email and password", "أدخل البريد الإلكتروني وكلمة المرور"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await signIn("credentials", {
        email: identifier,
        password,
        redirect: false,
        callbackUrl: "/portal",
      });
      if (!res) {
        setError(t("No response from server", "لا استجابة من الخادم"));
      } else if (res.error) {
        setError(t("Invalid email or password", "بريد إلكتروني أو كلمة مرور غير صحيحة"));
      } else if (res.ok) {
        window.location.href = "/portal";
      } else {
        setError(t("Something went wrong", "حدث خطأ ما"));
      }
    } catch {
      setError(t("Connection error", "خطأ في الاتصال"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-base flex">
      {/* ─── LEFT DECORATIVE PANEL ─── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden text-white" style={{ background: "linear-gradient(135deg, #0F6E56 0%, #0A5743 50%, #084637 100%)" }}>
        {/* Decorative elements */}
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-15" style={{ background: "radial-gradient(circle, #1D9E75 0%, transparent 70%)" }} />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #FFFFFF 0%, transparent 70%)" }} />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

        <div className="relative z-10 flex flex-col justify-between p-14 w-full">
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

          {/* Center illustration + tagline */}
          <div className="flex flex-col items-start max-w-md">
            {/* Stylized illustration */}
            <div className="relative mb-8">
              <div className="w-44 h-44 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 flex items-center justify-center">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 2h6v6l4 11a2 2 0 0 1-2 3H7a2 2 0 0 1-2-3l4-11V2z" />
                  <path d="M8 14h8" />
                </svg>
              </div>
              {/* Floating chips */}
              <div className="absolute -top-4 -right-6 px-3 py-1.5 bg-white/15 backdrop-blur-sm border border-white/20 rounded-lg text-[10px] font-mono-data flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                <span>HGB 14.6 g/dL</span>
              </div>
              <div className="absolute -bottom-2 -left-8 px-3 py-1.5 bg-white/15 backdrop-blur-sm border border-white/20 rounded-lg text-[10px] font-mono-data flex items-center gap-1.5">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Released
              </div>
              <div className="absolute top-4 -left-12 px-3 py-1.5 bg-white/15 backdrop-blur-sm border border-white/20 rounded-lg text-[10px] font-mono-data flex items-center gap-1.5">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Tomorrow 9:00
              </div>
            </div>

            <h1 className="text-4xl font-semibold leading-tight">
              {t("Welcome back.", "مرحباً بعودتك.")}
            </h1>
            <p className="text-base text-white/75 mt-3 leading-relaxed">
              {t(
                "Sign in to view your test results, manage appointments, and stay on top of your health.",
                "سجّل دخولك لعرض نتائج فحوصاتك، إدارة المواعيد، ومتابعة صحتك."
              )}
            </p>

            {/* Feature bullets */}
            <ul className="mt-8 space-y-3 w-full">
              <Feature icon="results" text={t("View results the moment they're released", "اعرض النتائج فور إصدارها")} />
              <Feature icon="calendar" text={t("Book and manage your appointments", "احجز وأدر مواعيدك")} />
              <Feature icon="track" text={t("Track samples in real-time", "تتبع عيناتك في الوقت الفعلي")} />
              <Feature icon="download" text={t("Download lab reports as PDF", "حمّل تقارير المختبر بصيغة PDF")} />
            </ul>
          </div>

          <p className="text-[11px] text-white/40">© 2026 Klev Diagnostic Laboratory</p>
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
          <div className="w-full max-w-md">
            {/* Mobile-only logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3" style={{ background: "linear-gradient(135deg, #0F6E56 0%, #1D9E75 100%)" }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2h6v6l4 11a2 2 0 0 1-2 3H7a2 2 0 0 1-2-3l4-11V2z"/><path d="M8 14h8"/></svg>
              </div>
              <h1 className="text-xl font-semibold text-ink">Klev LIMS</h1>
            </div>

            <h2 className="text-2xl font-semibold text-ink">{t("Sign in to your account", "تسجيل الدخول إلى حسابك")}</h2>
            <p className="text-sm text-gray mt-1.5">
              {t("Enter your credentials to access your patient portal.", "أدخل بياناتك للوصول إلى بوابة المريض.")}
            </p>

            {justRegistered && (
              <div className="mt-5 flex items-start gap-2.5 p-3 bg-success-soft border border-success/20 rounded-lg">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
                <p className="text-[12px] text-success font-medium">{t("Account created successfully. Sign in to continue.", "تم إنشاء الحساب بنجاح. سجّل الدخول للمتابعة.")}</p>
              </div>
            )}

            <form onSubmit={submit} className="mt-7 space-y-4">
              <Input
                label={t("Email or National ID", "البريد الإلكتروني أو الهوية")}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="username"
              />

              {/* Password with show/hide */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-ink-soft">{t("Password", "كلمة المرور")} <span className="text-critical">*</span></label>
                  <Link href="#" className="text-[11px] text-teal font-medium hover:underline">
                    {t("Forgot password?", "نسيت كلمة المرور؟")}
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray hover:text-teal transition-colors p-1"
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 accent-teal"
                />
                <span className="text-[12px] text-ink-soft">{t("Remember me on this device", "تذكرني على هذا الجهاز")}</span>
              </label>

              {error && (
                <div className="bg-critical-soft border border-critical/20 rounded-lg px-3 py-2.5 text-xs text-critical flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {error}
                </div>
              )}

              <Button type="submit" loading={loading} className="w-full" size="lg">
                {t("Sign in", "تسجيل الدخول")}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center"><span className="bg-base px-3 text-[11px] text-gray uppercase tracking-wider font-semibold">{t("or", "أو")}</span></div>
            </div>

            <Link href="/auth/patient/register" className="block">
              <button type="button" className="w-full h-11 border border-border bg-surface text-ink-soft hover:border-teal/30 hover:text-teal transition-colors rounded-lg text-[13px] font-medium flex items-center justify-center gap-2">
                {t("New patient? Create an account", "مريض جديد؟ أنشئ حساباً")}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </button>
            </Link>

            <p className="text-center text-[11px] text-gray mt-6">
              {t("Lab staff?", "موظفي المختبر؟")}{" "}
              <Link href="/auth/login" className="text-teal hover:underline">{t("Staff sign-in", "تسجيل دخول الموظفين")}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, text }: { icon: string; text: string }) {
  const icons: Record<string, React.ReactNode> = {
    results: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    calendar: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    track: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2v17.5a3.5 3.5 0 1 1-7 0V2"/><line x1="6" y1="2" x2="16" y2="2"/></svg>,
    download: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  };
  return (
    <li className="flex items-center gap-3">
      <span className="w-7 h-7 rounded-lg bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center flex-shrink-0">{icons[icon]}</span>
      <span className="text-[13px] text-white/85">{text}</span>
    </li>
  );
}
