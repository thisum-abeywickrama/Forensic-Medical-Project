import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Activity, AlertCircle, KeyRound, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

const RESEND_COOLDOWN = 60;
const MIN_PASSWORD_LENGTH = 8;

type Step = "request" | "reset";

export function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const requestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.auth.forgotPassword(email.trim());
      toast.success(res?.message || "If an account exists for that address, a reset code has been sent.");
      setStep("reset");
      setCooldown(RESEND_COOLDOWN);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not send a reset code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setError("");
    try {
      await api.auth.forgotPassword(email.trim());
      toast.success("A new reset code has been sent.");
      setCooldown(RESEND_COOLDOWN);
    } catch (err: any) {
      console.error("Failed to resend reset code:", err);
      setError(err.message || "Could not resend the reset code.");
    }
  };

  const submitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
      return;
    }

    setLoading(true);
    try {
      await api.auth.resetPassword({ email: email.trim(), code: code.trim(), newPassword: password });
      toast.success("Password reset successfully. Please sign in.");
      navigate("/login");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Invalid or expired reset code.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors";

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

        <form onSubmit={step === "request" ? requestCode : submitReset} className="bg-white rounded-2xl shadow-2xl p-7">
          <div className="flex items-center gap-2 mb-1">
            <KeyRound size={18} className="text-primary" />
            <h2 className="text-lg font-bold text-slate-800" style={{ fontFamily: "var(--font-family-heading)" }}>
              {step === "request" ? "Reset Your Password" : "Choose a New Password"}
            </h2>
          </div>

          {step === "request" ? (
            <>
              <p className="text-sm text-slate-500 mb-6">
                Enter your account email and we'll send you a 6-digit reset code.
              </p>
              <div className="mb-5">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Email Address
                </label>
                <input
                  type="email" value={email}
                  onChange={e => { setEmail(e.target.value); setError(""); }}
                  placeholder="e.g. dr.perera@forensic.gov"
                  className={inputClass}
                />
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-500 mb-6">
                We sent a code to <span className="font-semibold text-slate-700">{email}</span>.
                Enter it along with your new password.
              </p>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Reset Code
                </label>
                <input
                  type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
                  value={code}
                  onChange={e => { setCode(e.target.value.replace(/\D/g, "")); setError(""); }}
                  placeholder="000000"
                  className={`${inputClass} text-center text-xl font-semibold tracking-[0.5em]`}
                />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"} value={password}
                    onChange={e => { setPassword(e.target.value); setError(""); }}
                    placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                    className={`${inputClass} pr-16`}
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-medium">
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? "text" : "password"} value={confirm}
                  onChange={e => { setConfirm(e.target.value); setError(""); }}
                  placeholder="Re-enter the new password"
                  className={inputClass}
                />
              </div>
            </>
          )}

          {error && (
            <div className="flex items-center gap-2 mb-4 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle size={14} className="flex-shrink-0" />{error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (step === "request" ? !email : !(code.length === 6 && password && confirm))}
            className="w-full bg-primary text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {loading
              ? (step === "request" ? "Sending…" : "Resetting…")
              : (step === "request" ? "Send Reset Code" : "Reset Password")}
          </button>

          <div className="flex items-center justify-between mt-5 text-xs">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="flex items-center gap-1 text-slate-500 hover:text-slate-700 font-medium"
            >
              <ArrowLeft size={12} /> Back to sign in
            </button>
            {step === "reset" && (
              <button
                type="button" onClick={resend} disabled={cooldown > 0}
                className="text-primary hover:text-blue-700 font-semibold disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
