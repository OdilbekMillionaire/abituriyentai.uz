"use client";

import React from "react";
import Link from "next/link";

interface State {
  hasError: boolean;
  error: Error | null;
}

function ErrorFallback({ error, onRetry }: { error: Error | null; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm max-w-md w-full p-8 text-center">
        <div className="text-5xl mb-4">😔</div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Xatolik yuz berdi</h2>
        <p className="text-slate-500 text-sm mb-6">
          Kutilmagan muammo yuzaga keldi. Iltimos, qayta urinib ko&apos;ring yoki sahifani yangilang.
        </p>
        {process.env.NODE_ENV === "development" && error && (
          <pre className="text-left text-xs bg-red-50 border border-red-200 rounded-lg p-3 mb-4 overflow-auto max-h-32 text-red-700">
            {error.message}
          </pre>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={onRetry}
            className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            Qayta urinish
          </button>
          <Link
            href="/dashboard"
            className="px-5 py-2.5 bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-200 transition-colors"
          >
            Bosh sahifa
          </Link>
        </div>
      </div>
    </div>
  );
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (process.env.NODE_ENV !== "production") {
      console.error("ErrorBoundary caught:", error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          onRetry={() => this.setState({ hasError: false, error: null })}
        />
      );
    }
    return this.props.children;
  }
}
