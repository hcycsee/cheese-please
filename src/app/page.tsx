import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-8 px-6 text-center">
      <div>
        <img src="/logo.png" alt="unipixel" className="mx-auto h-auto w-full max-w-xl rounded-xl shadow-sm" />
        <p className="mt-6 text-lg text-stone-600">
          Meet people at your institution. See who&apos;s online right now, add friends, chat, and get matched
          into a group of people who are free at the same time as you.
        </p>
      </div>
      <div className="flex gap-4">
        <Link href="/register" className="btn-primary">
          Create an account
        </Link>
        <Link href="/login" className="btn-secondary">
          Log in
        </Link>
      </div>
    </main>
  );
}
