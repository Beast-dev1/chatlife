"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";

const schema = z
  .object({
    newPassword: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "One uppercase letter")
      .regex(/[a-z]/, "One lowercase letter")
      .regex(/[0-9]/, "One number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    if (!token) return;
    setError(null);
    setIsLoading(true);
    try {
      await api.post<{ message: string }>("/api/auth/reset-password", {
        token,
        newPassword: data.newPassword,
      });
      router.push("/login?reset=success");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="w-full flex flex-col items-center justify-center bg-background text-foreground px-4">
        <div className="md:w-96 w-80 flex flex-col items-center justify-center p-6 rounded-2xl glass shadow-surface border border-border">
          <h2 className="text-display font-semibold text-foreground">Invalid link</h2>
          <p className="text-body text-muted-foreground mt-3 text-center">
            This reset link is invalid or has expired. Please request a new one.
          </p>
          <Link
            href="/forgot-password"
            className="mt-8 w-full h-11 rounded-xl text-white bg-primary-500 hover:bg-primary-600 transition-colors duration-normal flex items-center justify-center shadow-surface focus-visible:outline focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            Request new link
          </Link>
        </div>
      </div>
    );
  }

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

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="md:w-96 w-80 flex flex-col items-center justify-center p-6 rounded-2xl glass shadow-surface border border-border"
        >
          <h2 className="text-display font-semibold text-foreground">
            Set new password
          </h2>
          <p className="text-body text-muted-foreground mt-3">
            Enter your new password below
          </p>

          <div className="flex items-center gap-4 w-full my-6">
            <div className="w-full h-px bg-border" />
            <p className="text-nowrap text-caption font-medium text-muted-foreground">
              New password
            </p>
            <div className="w-full h-px bg-border" />
          </div>

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
              {...register("newPassword")}
              type="password"
              placeholder="New password"
              className="bg-transparent text-foreground placeholder-muted-foreground outline-none text-body w-full h-full"
              required
            />
          </div>
          {errors.newPassword && (
            <p className="mt-1 text-caption text-destructive w-full text-left md:w-96">
              {errors.newPassword.message}
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
              {...register("confirmPassword")}
              type="password"
              placeholder="Confirm password"
              className="bg-transparent text-foreground placeholder-muted-foreground outline-none text-body w-full h-full"
              required
            />
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-caption text-destructive w-full text-left md:w-96">
              {errors.confirmPassword.message}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-8 w-full h-11 rounded-xl text-white bg-primary-500 hover:bg-primary-600 transition-colors duration-normal disabled:opacity-50 disabled:cursor-not-allowed shadow-surface focus-visible:outline focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            {isLoading ? "Resetting..." : "Reset password"}
          </button>
          <p className="text-muted-foreground text-body mt-4">
            <Link className="text-primary-500 hover:underline" href="/login">
              Back to sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center bg-background">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
