"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { authApi, setToken } from "@/lib/api";
import { loginWithEmail, signInWithGoogle } from "@/lib/firebase";
import { useLang } from "@/lib/lang";
import { LangToggle } from "@/components/ui/LangToggle";

export default function LoginPage() {
  const router = useRouter();
  const { tr } = useLang();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  async function exchangeToken(idToken: string, displayName?: string | null, retries = 2) {
    try {
      const response = await authApi.firebaseAuth(idToken, displayName);
      const { access_token } = response.data;
      setToken(access_token);
      router.push("/dashboard");
    } catch (err: any) {
      if (retries > 0 && (!err.response || err.response.status >= 500)) {
        await new Promise((res) => setTimeout(res, 2000));
        return exchangeToken(idToken, displayName, retries - 1);
      }
      throw err;
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const { idToken, displayName } = await loginWithEmail(email, password);
      await exchangeToken(idToken, displayName);
    } catch (err: any) {
      const code = err?.code ?? "";
      if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
        setError(tr("auth_login_error"));
      } else if (code === "auth/too-many-requests") {
        setError(tr("auth_login_error"));
      } else {
        setError(tr("auth_login_error"));
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogle() {
    try {
      // Execute immediately to preserve user gesture context (fixes Safari popup blocks)
      const authPromise = signInWithGoogle();
      
      setError(null);
      setIsGoogleLoading(true);
      
      const { idToken, displayName } = await authPromise;
      await exchangeToken(idToken, displayName);
    } catch (err: any) {
      if (err?.code !== "auth/popup-closed-by-user" && err?.code !== "auth/cancelled-popup-request") {
        setError(tr("auth_google_error"));
      }
    } finally {
      setIsGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <Logo size={40} showName light={false} />
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <div className="flex justify-end mb-4">
            <LangToggle />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-1">{tr("login_title")}</h1>
          <p className="text-slate-500 text-sm mb-6">{tr("login_subtitle")}</p>

          <button
            onClick={handleGoogle}
            disabled={isGoogleLoading || isLoading}
            className="w-full flex items-center justify-center gap-3 border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60 mb-5"
          >
            {isGoogleLoading ? (
              <span className="w-5 h-5 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {tr("google_login")}
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400">{tr("or")}</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{tr("field_email")}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="email@example.com"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 placeholder-slate-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{tr("field_password")}</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 pr-12"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? tr("auth_loading_login") : tr("auth_submit_login")}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            {tr("no_account")}{" "}
            <Link href="/register" className="text-blue-600 font-medium hover:text-blue-700">{tr("register_title")}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
