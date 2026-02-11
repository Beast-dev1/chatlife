"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/store/authStore";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    if (searchParams.get("reset") === "success") {
      setSuccess("Password reset successfully. You can now sign in.");
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      await login(data.email, data.password);
      router.push("/chat");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className="relative w-full h-full hidden md:block min-h-0">
        <Image
          className="object-cover"
          src="/loginandsignupimg.png"
          alt="Grandparents video calling their grandson studying abroad"
          fill
          sizes="(max-width: 768px) 0px, 50vw"
          priority
        />
      </div>

      <div className="w-full flex flex-col items-center justify-center bg-background text-foreground px-4">
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 text-destructive rounded-xl text-body max-w-md w-full md:w-96">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-xl text-body max-w-md w-full md:w-96">
            {success}
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="md:w-96 w-80 flex flex-col items-center justify-center p-6 rounded-2xl glass shadow-surface border border-border"
        >
          <h2 className="text-display font-semibold text-foreground">Sign in</h2>
          <p className="text-body text-muted-foreground mt-3">
            Welcome back! Please sign in to continue
          </p>

          <div className="flex items-center gap-4 w-full my-6">
            <div className="w-full h-px bg-border" />
            <p className="text-nowrap text-caption font-medium text-muted-foreground">
              Sign in with email
            </p>
            <div className="w-full h-px bg-border" />
          </div>

          <div className="flex items-center w-full bg-transparent border border-input h-12 rounded-xl overflow-hidden pl-6 gap-2 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all duration-normal">
            <svg
              width="16"
              height="11"
              viewBox="0 0 16 11"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-muted-foreground shrink-0"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M0 .55.571 0H15.43l.57.55v9.9l-.571.55H.57L0 10.45zm1.143 1.138V9.9h13.714V1.69l-6.503 4.8h-.697zM13.749 1.1H2.25L8 5.356z"
                fill="currentColor"
              />
            </svg>
            <input
              {...register("email")}
              type="email"
              placeholder="Email id"
              className="bg-transparent text-foreground placeholder-muted-foreground outline-none text-body w-full h-full"
              required
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-caption text-destructive w-full text-left md:w-96">
              {errors.email.message}
            </p>
          )}

          <div className="flex items-center mt-6 w-full bg-transparent border border-input h-12 rounded-xl overflow-hidden pl-6 gap-2 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all duration-normal">
            <svg
              width="13"
              height="17"
              viewBox="0 0 13 17"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-muted-foreground shrink-0"
            >
              <path
                d="M13 8.5c0-.938-.729-1.7-1.625-1.7h-.812V4.25C10.563 1.907 8.74 0 6.5 0S2.438 1.907 2.438 4.25V6.8h-.813C.729 6.8 0 7.562 0 8.5v6.8c0 .938.729 1.7 1.625 1.7h9.75c.896 0 1.625-.762 1.625-1.7zM4.063 4.25c0-1.406 1.093-2.55 2.437-2.55s2.438 1.144 2.438 2.55V6.8H4.061z"
                fill="currentColor"
              />
            </svg>
            <input
              {...register("password")}
              type="password"
              placeholder="Password"
              className="bg-transparent text-foreground placeholder-muted-foreground outline-none text-body w-full h-full"
              required
            />
          </div>
          {errors.password && (
            <p className="mt-1 text-caption text-destructive w-full text-left md:w-96">
              {errors.password.message}
            </p>
          )}

          <div className="w-full flex items-center justify-between mt-8 text-muted-foreground">
            <div className="flex items-center gap-2">
              <input
                className="h-5 w-5 rounded border-input text-primary-500 focus:ring-primary-500/20"
                type="checkbox"
                id="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label className="text-body cursor-pointer" htmlFor="checkbox">
                Remember me
              </label>
            </div>
            <Link
              className="text-body underline hover:text-primary-500 transition-colors duration-normal"
              href="/forgot-password"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-8 w-full h-11 rounded-xl text-white bg-primary-500 hover:bg-primary-600 transition-colors duration-normal disabled:opacity-50 disabled:cursor-not-allowed shadow-surface focus-visible:outline focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
          <p className="text-muted-foreground text-body mt-4">
            Don&apos;t have an account?{" "}
            <Link className="text-primary-500 hover:underline" href="/register">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex h-full w-full items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
