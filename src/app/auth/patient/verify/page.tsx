"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/lib/language";

export default function PatientVerifyPage() {
  const router = useRouter();
  const { lang, setLang, t } = useLanguage();
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [seconds, setSeconds] = useState(45);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mobile, setMobile] = useState("+961 •••• 1234");
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  // Restore mobile from step 1
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("patient-register-step1");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        const last4 = (data.mobile || "").slice(-4).padStart(4, "•");
        setMobile(`${data.countryCode || "+961"} •••• ${last4}`);
      } catch {}
    }
    setTimeout(() => inputs.current[0]?.focus(), 100);
  }, []);

  // Countdown
  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  function setDigit(i: number, val: string) {
    const v = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    setError("");
    if (v && i < 5) inputs.current[i + 1]?.focus();
  }

  function onKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && i > 0) inputs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < 5) inputs.current[i + 1]?.focus();
  }

  function onPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      setDigits(text.split(""));
      inputs.current[5]?.focus();
    }
  }

  function resend() {
    if (seconds > 0) return;
    setSeconds(45);
    setDigits(["", "", "", "", "", ""]);
    inputs.current[0]?.focus();
  }

  const verify = useCallback(() => {
    const code = digits.join("");
    if (code.length !== 6) {
      setError(t("Please enter all 6 digits", "يرجى إدخال جميع الأرقام الستة"));
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push("/auth/patient/complete");
    }, 600);
  }, [digits, router, t]);

  // Auto-submit when all 6 digits filled
  useEffect(() => {
    if (digits.every((d) => d) && !loading) {
      verify();
    }
  }, [digits, loading, verify]);

  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-mist via-base to-teal-soft flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <Link href="/auth/patient/register" className="flex items-center gap-2 text-[12px] text-gray hover:text-teal transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          {t("Back", "رجوع")}
        </Link>
        <div className="flex items-center bg-surface rounded-lg p-0.5 border border-border shadow-sm">
          <button onClick={() => setLang("en")} className={`px-3 py-1.5 text-[11px] font-medium rounded-md transition-colors ${lang === "en" ? "bg-teal text-white" : "text-gray"}`}>EN</button>
          <button onClick={() => setLang("ar")} className={`px-3 py-1.5 text-[11px] font-medium rounded-md transition-colors ${lang === "ar" ? "bg-teal text-white" : "text-gray"}`}>العربية</button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Brand */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ background: "linear-gradient(135deg, #0F6E56 0%, #1D9E75 100%)" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </div>
          </div>

          {/* Card */}
          <div className="bg-surface rounded-2xl border border-border shadow-card-lg p-8">
            {/* Step indicator */}
            <StepIndicator current={2} />

            <div className="text-center mt-7">
              <h2 className="text-xl font-semibold text-ink">{t("Verify your number", "تحقق من رقمك")}</h2>
              <p className="text-sm text-gray mt-2">
                {t("We sent a 6-digit code to", "أرسلنا رمزاً مكوناً من 6 أرقام إلى")}
              </p>
              <p className="text-base font-mono-data text-ink font-semibold mt-1.5 select-all">{mobile}</p>
            </div>

            {/* OTP boxes */}
            <div className="mt-7">
              <div className="flex items-center justify-center gap-2.5">
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => setDigit(i, e.target.value)}
                    onKeyDown={(e) => onKey(i, e)}
                    onPaste={i === 0 ? onPaste : undefined}
                    className={`!w-12 !h-14 text-center !text-xl !font-bold font-mono-data ${error ? "!border-critical" : ""}`}
                  />
                ))}
              </div>
              {error && <p className="text-[11px] text-critical text-center mt-3">{error}</p>}
            </div>

            {/* Resend / countdown */}
            <div className="mt-6 text-center">
              {seconds > 0 ? (
                <p className="text-[12px] text-gray">
                  {t("Resend code in", "إعادة الإرسال خلال")}{" "}
                  <span className="font-mono-data font-semibold text-ink-soft">{minutes}:{secs}</span>
                </p>
              ) : (
                <button onClick={resend} className="text-[12px] text-teal font-semibold hover:underline">
                  {t("Resend code", "إعادة إرسال الرمز")}
                </button>
              )}
            </div>

            {/* CTA */}
            <Button onClick={verify} loading={loading} className="w-full mt-6" size="lg">
              {t("Verify & Continue", "تحقق ومتابعة")}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Button>

            <p className="text-[11px] text-gray text-center mt-4">
              {t("Didn't receive a code? Check your SMS or", "لم تتلق الرمز؟ تحقق من الرسائل أو")}{" "}
              <button onClick={resend} disabled={seconds > 0} className="text-teal font-semibold hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline">
                {t("try again", "حاول مرة أخرى")}
              </button>
            </p>
          </div>

          <p className="text-center text-[11px] text-gray mt-6">
            <Link href="/auth/patient/register" className="hover:text-teal">← {t("Edit phone number", "تعديل رقم الهاتف")}</Link>
          </p>
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
      <div className="flex items-center gap-2">
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
    </div>
  );
}
