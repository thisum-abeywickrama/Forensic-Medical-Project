import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Activity, AlertCircle, MailCheck } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { api } from "@/lib/api";
import { toast } from "sonner";

const RESEND_COOLDOWN = 60;

export function VerifyEmailPage() {
  const { setCurrentUser } = useApp();
  const navigate = useNavigate();

  // The login step stores the pending address here so a page refresh keeps working.
  const email = sessionStorage.getItem("pendingVerificationEmail") || "";

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);

  // No pending email means the user landed here directly; send them back.
  useEffect(() => {
    if (!email) navigate("/login", { replace: true });
  }, [email, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.auth.verifyEmail({ email, code: code.trim() });
      sessionStorage.removeItem("pendingVerificationEmail");
      setCurrentUser(res.user);
      toast.success(`Email verified. Welcome, ${res.user.name}!`);
      navigate("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      const res = await api.auth.resendVerification(email);
      toast.success(res?.message || "A new verification code has been sent.");
      setCooldown(RESEND_COOLDOWN);
    } catch (err: any) {
      setError(err.message || "Could not resend the verification code.");
    }
  };

  const handleBack = () => {
    sessionStorage.removeItem("pendingVerificationEmail");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4 border border-white/20">
            <Activity size={32} className="text-blue-300" />
          </div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-family-heading)" }}>
            Forensic Medical Department
          </h1>
          <p className="text-blue-300 text-sm mt-1">Medico-Legal Records Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-7">
          <div className="flex items-center gap-2 mb-1">
            <MailCheck size={18} className="text-primary" />
            <h2 className="text-lg font-bold text-slate-800" style={{ fontFamily: "var(--font-family-heading)" }}>
              Verify Your Email
            </h2>
          </div>
          <p className="text-sm text-slate-500 mb-6">
            We sent a 6-digit code to <span className="font-semibold text-slate-700">{email}</span>.
            Enter it below to activate your account.
          </p>

          <div className="mb-5">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Verification Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={e => { setCode(e.target.value.replace(/\D/g, "")); setError(""); }}
              placeholder="000000"
              className="w-full border border-slate-300 rounded-lg px-3 py-3 text-center text-xl font-semibold tracking-[0.5em] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 mb-4 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle size={14} className="flex-shrink-0" />{error}
            </div>
          )}

          <button
            type="submit"
            disabled={code.length !== 6 || loading}
            className="w-full bg-primary text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {loading ? "Verifying…" : "Verify & Continue"}
          </button>

          <div className="flex items-center justify-between mt-5 text-xs">
            <button type="button" onClick={handleBack} className="text-slate-500 hover:text-slate-700 font-medium">
              Back to sign in
            </button>
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0}
              className="text-primary hover:text-blue-700 font-semibold disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
