"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  signOut as clientSignOut,
} from "firebase/auth";
import { clientAuth } from "@/lib/firebase/client";
import { signInWithIdToken } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Panel } from "@/components/ds/panel";
import { toast } from "sonner";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  async function establishSession(idToken: string) {
    const result = await signInWithIdToken(idToken);
    if (!result.ok && result.reason === "deactivated") {
      await clientSignOut(clientAuth);
      router.push(`/deactivated?uid=${result.uid}`);
      return;
    }
    // Keep a full-screen indicator up while the app navigates and refreshes —
    // this component stays mounted until the feed's server render lands.
    setRedirecting(true);
    router.push("/");
    router.refresh();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      let cred;
      if (mode === "signup") {
        cred = await createUserWithEmailAndPassword(clientAuth, email, password);
        if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() });
      } else {
        cred = await signInWithEmailAndPassword(clientAuth, email, password);
      }
      await establishSession(await cred.user.getIdToken(true));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message.replace("Firebase: ", "") : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setBusy(true);
    try {
      const cred = await signInWithPopup(clientAuth, new GoogleAuthProvider());
      await establishSession(await cred.user.getIdToken(true));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message.replace("Firebase: ", "") : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  if (redirecting) {
    return (
      <main className="flex min-h-[80vh] flex-col items-center justify-center gap-4 px-4">
        <span className="font-heading text-4xl font-bold">MyBlog</span>
        <div className="flex items-center gap-3 border-2 border-border px-6 py-4">
          <span className="size-3 animate-pulse bg-primary" />
          <span className="text-sm font-medium">
            {mode === "login" ? "Signing you in…" : "Setting up your account…"}
          </span>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-10">
      <Link href="/" className="mb-6 self-center font-heading text-4xl font-bold">
        MyBlog
      </Link>
      <Panel className="p-8">
        <h1 className="text-3xl font-bold">
          {mode === "login" ? "Sign in" : "Create account"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "login"
            ? "Welcome back to MyBlog."
            : "Join MyBlog to write, like and comment."}
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          <Button type="submit" variant="solid" className="w-full" disabled={busy}>
            {busy
              ? mode === "login" ? "Signing in…" : "Creating account…"
              : mode === "login" ? "Sign in" : "Sign up"}
          </Button>
        </form>
        <Button onClick={google} className="mt-3 w-full" disabled={busy}>
          Continue with Google
        </Button>
        <p className="mt-6 text-sm text-muted-foreground">
          {mode === "login" ? (
            <>No account? <Link href="/signup" className="text-foreground underline">Sign up</Link></>
          ) : (
            <>Have an account? <Link href="/login" className="text-foreground underline">Sign in</Link></>
          )}
        </p>
      </Panel>
    </main>
  );
}
