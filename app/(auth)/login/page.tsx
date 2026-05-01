"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password.");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "#080809" }}
    >
      <div className="w-full max-w-md px-6">
        {/* Branding */}
        <div className="text-center mb-10">
          <h1
            className="text-4xl font-serif tracking-widest uppercase mb-2"
            style={{ color: "#C9A84C" }}
          >
            Midas OS
          </h1>
          <p className="text-sm tracking-widest uppercase" style={{ color: "rgba(232,228,220,0.45)" }}>
            Property Intelligence Platform
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-lg p-8"
          style={{
            backgroundColor: "#0F0F13",
            border: "1px solid rgba(201,168,76,0.18)",
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-xs tracking-widest uppercase mb-2"
                style={{ color: "rgba(232,228,220,0.45)" }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded px-4 py-3 text-sm outline-none transition-colors"
                style={{
                  backgroundColor: "#15151C",
                  border: "1px solid rgba(201,168,76,0.18)",
                  color: "#E8E4DC",
                }}
                placeholder="you@midaspropertyauctions.co.uk"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs tracking-widest uppercase mb-2"
                style={{ color: "rgba(232,228,220,0.45)" }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded px-4 py-3 text-sm outline-none transition-colors"
                style={{
                  backgroundColor: "#15151C",
                  border: "1px solid rgba(201,168,76,0.18)",
                  color: "#E8E4DC",
                }}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded text-sm font-semibold tracking-widest uppercase transition-opacity disabled:opacity-50"
              style={{
                backgroundColor: "#C9A84C",
                color: "#080809",
              }}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p
            className="mt-6 text-center text-xs"
            style={{ color: "rgba(232,228,220,0.25)" }}
          >
            Invite-only access
          </p>
        </div>
      </div>
    </main>
  );
}
