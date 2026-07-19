import { useState } from "react";
import { useNavigate } from "react-router";
import { Activity, AlertCircle, User, Shield } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { api, ApiError } from "@/lib/api";
import { toast } from "sonner";

export function LoginPage() {
  const { setCurrentUser } = useApp();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.auth.login({ email: email.trim(), password });
      setCurrentUser(res.user);
      toast.success(`Welcome, ${res.user.name}! Login successful.`);
      navigate("/dashboard");
    } catch (err: any) {
      console.error(err);
      // Credentials were correct but the address is not confirmed yet — the
      // backend has already emailed a fresh code, so send them to the code step.
      if (err instanceof ApiError && err.data?.verificationRequired) {
        sessionStorage.setItem("pendingVerificationEmail", err.data.email || email.trim());
        toast.info("Please verify your email address to continue.");
        navigate("/verify-email");
        return;
      }
      setError(err.message || "Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
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
          <h2 className="text-lg font-bold text-slate-800 mb-1" style={{ fontFamily: "var(--font-family-heading)" }}>Sign In</h2>
          <p className="text-sm text-slate-500 mb-6">Enter your credentials to access the system.</p>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Email Address</label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="email" value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                placeholder="e.g. dr.perera@forensic.gov"
                className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
              />
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Password</label>
            <div className="relative">
              <Shield size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type={showPassword ? "text" : "password"} value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                placeholder="Enter your password"
                className="w-full border border-slate-300 rounded-lg pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
              />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-medium">
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 mb-4 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle size={14} className="flex-shrink-0" />{error}
            </div>
          )}

          <button type="submit" disabled={!email || !password || loading}
            className="w-full bg-primary text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm">
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
