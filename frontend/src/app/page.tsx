"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi, setToken, isAuthenticated } from "@/lib/api";

// Landing page = auto-enter the platform as a guest. No login, no Firebase.
// Reuses the already-deployed /auth/login (+ /auth/register fallback) endpoints.
export default function LandingPage() {
  const router = useRouter();
  const [error, setError] = useState(false);

  async function registerGuest(): Promise<string> {
    const rnd = Math.random().toString(36).slice(2, 10);
    const username = `guest_${rnd}`;
    const password = `Guest_${rnd}_2026`;
    const { data } = await authApi.register({
      username,
      email: `${username}@guest.app`,
      password,
    });
    // Remember this browser's own guest so return visits reuse the same account
    localStorage.setItem("ab_guest_u", username);
    localStorage.setItem("ab_guest_p", password);
    return data.access_token;
  }

  async function enterAsGuest() {
    setError(false);
    try {
      let token: string;
      const gu = localStorage.getItem("ab_guest_u");
      const gp = localStorage.getItem("ab_guest_p");
      if (gu && gp) {
        // Returning visitor — log into this browser's own private guest account
        try {
          const { data } = await authApi.login(gu, gp);
          token = data.access_token;
        } catch {
          token = await registerGuest();
        }
      } else {
        // First visit — create a private guest account just for this browser
        token = await registerGuest();
      }
      setToken(token);
      router.replace("/dashboard");
    } catch {
      setError(true);
    }
  }

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/dashboard");
    } else {
      enterAsGuest();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "1.25rem",
        background: "linear-gradient(135deg,#f8fafc,#eff6ff)",
        fontFamily: "system-ui, sans-serif",
        padding: "1rem",
      }}
    >
      <div
        style={{
          fontSize: "1.6rem",
          fontWeight: 800,
          background: "linear-gradient(135deg,#2563eb,#7c3aed)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        AbituriyentAI
      </div>

      {!error ? (
        <>
          <div
            style={{
              width: 42,
              height: 42,
              border: "4px solid #ddd6fe",
              borderTopColor: "#7c3aed",
              borderRadius: "50%",
              animation: "abspin 1s linear infinite",
            }}
          />
          <div style={{ color: "#64748b", fontSize: "0.95rem" }}>
            Platforma yuklanmoqda...
          </div>
          <style>{`@keyframes abspin{to{transform:rotate(360deg)}}`}</style>
        </>
      ) : (
        <>
          <div style={{ color: "#dc2626", fontSize: "0.95rem" }}>
            Kirishda xatolik yuz berdi. Qayta urinib ko&apos;ring.
          </div>
          <button
            onClick={enterAsGuest}
            style={{
              background: "#2563eb",
              color: "#fff",
              border: "none",
              padding: "0.75rem 1.75rem",
              borderRadius: "0.85rem",
              fontWeight: 600,
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            Platformaga kirish
          </button>
        </>
      )}
    </div>
  );
}
