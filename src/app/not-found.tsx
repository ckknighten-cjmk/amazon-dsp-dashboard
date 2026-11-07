import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Not found · CJMK Inc." },
  description: "That page is not available.",
};

/** Unmatched URLs stay outside the operations shell so public policy responses do not carry station data. */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center bg-white px-6 py-16 text-neutral-950">
      <h1 className="text-2xl font-semibold tracking-tight">Not found</h1>
      <p className="mt-2 text-base leading-7 text-neutral-800">That page is not available.</p>
      <p className="mt-6 text-sm leading-6">
        <a
          href="/"
          className="font-medium text-blue-900 underline decoration-blue-900/40 underline-offset-4"
        >
          Back to overview
        </a>
      </p>
    </main>
  );
}
