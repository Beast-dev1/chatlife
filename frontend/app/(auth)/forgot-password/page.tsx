"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";

const schema = z.object({
  email: z.string().email("Invalid email address"),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [success, setSuccess] = useState(false);
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
    setError(null);
    setIsLoading(true);
    try {
      await api.post<{ message: string }>("/api/auth/forgot-password", {
        email: data.email,
      });
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setIsLoading(false);
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

        {success ? (
          <div className="md:w-96 w-80 flex flex-col items-center justify-center p-6 rounded-2xl glass shadow-surface border border-border">
            <h2 className="text-display font-semibold text-foreground">
              Check your email
            </h2>
            <p className="text-body text-muted-foreground mt-3 text-center">
              If an account exists with that email, we sent a password reset link.
            </p>
            <Link
              href="/login"
              className="mt-8 w-full h-11 rounded-xl text-white bg-primary-500 hover:bg-primary-600 transition-colors duration-normal flex items-center justify-center shadow-surface focus-visible:outline focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="md:w-96 w-80 flex flex-col items-center justify-center p-6 rounded-2xl glass shadow-surface border border-border"
          >
            <h2 className="text-display font-semibold text-foreground">
              Forgot password?
            </h2>
            <p className="text-body text-muted-foreground mt-3">
              Enter your email and we&apos;ll send you a reset link
            </p>

            <div className="flex items-center gap-4 w-full my-6">
              <div className="w-full h-px bg-border" />
              <p className="text-nowrap text-caption font-medium text-muted-foreground">
                Your email
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

            <button
              type="submit"
              disabled={isLoading}
              className="mt-8 w-full h-11 rounded-xl text-white bg-primary-500 hover:bg-primary-600 transition-colors duration-normal disabled:opacity-50 disabled:cursor-not-allowed shadow-surface focus-visible:outline focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              {isLoading ? "Sending..." : "Send reset link"}
            </button>
            <p className="text-muted-foreground text-body mt-4">
              Remember your password?{" "}
              <Link className="text-primary-500 hover:underline" href="/login">
                Sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
