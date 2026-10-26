"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, getErrorMessage } from "@/lib/api";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui";
import { inputClass } from "@/lib/styles";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
        try {
      await api.post("/auth/login", { email, password });
      setPassword("");
      router.push("/dashboard");
    } catch (err) {
      setError(getErrorMessage(err, "Login failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to your workflows."
      footer={
        <>
          No account?{" "}
          <Link href="/register" className="font-medium text-indigo-600 hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={inputClass}
          />
        </div>
        <Button type="submit" loading={loading} className="w-full">
          Log in
        </Button>
      </form>
    </AuthShell>
  );
}