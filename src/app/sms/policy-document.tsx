import type { ReactNode } from "react";
import {
  SMS_POLICY_EFFECTIVE_DATE,
  SMS_POLICY_EFFECTIVE_DATE_ISO,
  SMS_POLICY_ROUTES,
  SMS_SUPPORT_EMAIL,
  type PolicyDocumentModel,
  type PolicyInline,
} from "@/lib/sms-policy";

const linkClass =
  "font-medium text-blue-900 underline decoration-blue-900/40 underline-offset-4 hover:decoration-blue-900 focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-900";

function PolicyPart({ part }: { part: PolicyInline }) {
  if (part.kind === "text") return part.text;
  if (part.kind === "mail") {
    return (
      <a className={linkClass} href={`mailto:${SMS_SUPPORT_EMAIL}`}>
        {SMS_SUPPORT_EMAIL}
      </a>
    );
  }
  return (
    <a className={linkClass} href={part.href}>
      {part.label}
    </a>
  );
}

export function SmsPolicyDocument({ document }: { document: PolicyDocumentModel }) {
  return (
    <article>
      <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{document.title}</h1>
      <p className="mt-3 text-lg leading-7 text-neutral-800">{document.programName}</p>
      <p className="mt-2 text-sm leading-6 text-neutral-700">
        Published and effective{" "}
        <time dateTime={SMS_POLICY_EFFECTIVE_DATE_ISO}>{SMS_POLICY_EFFECTIVE_DATE}</time>.
      </p>
      <div className="mt-8 space-y-8">
        {document.sections.map((section) => (
          <section key={section.id} aria-labelledby={section.id} className="space-y-3">
            <h2 id={section.id} className="text-xl font-semibold tracking-tight">
              {section.heading}
            </h2>
            {section.paragraphs.map((paragraph, index) => (
              <p key={`${section.id}-${index}`} className="text-base leading-7 text-neutral-900">
                {paragraph.map((part, partIndex) => (
                  <PolicyPart key={`${section.id}-${index}-${partIndex}`} part={part} />
                ))}
              </p>
            ))}
          </section>
        ))}
      </div>
    </article>
  );
}

export function SmsPolicyFrame({ children }: { children: ReactNode }) {
  return (
    <div className="sms-policy min-h-screen bg-white text-neutral-950">
      <a
        href="#sms-policy"
        className="skip-link sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-blue-900 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-blue-900"
      >
        Skip to policy text
      </a>
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex w-full max-w-2xl flex-col items-start gap-4 px-4 py-6 sm:flex-row sm:items-center sm:px-6">
          {/* Direct file URL so this public page does not depend on the image optimizer. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/cjmk-logo.png"
            alt=""
            width={72}
            height={72}
            className="h-[4.5rem] w-[4.5rem] shrink-0 rounded-md bg-black"
          />
          <div className="min-w-0">
            <p className="text-lg font-semibold tracking-tight">CJMK Inc.</p>
            <p className="mt-1 text-sm leading-6 text-neutral-700">Driver Scorecard Notification Program</p>
            <p className="mt-2 text-sm leading-6 text-neutral-900">
              Support{" "}
              <a className={linkClass} href={`mailto:${SMS_SUPPORT_EMAIL}`}>
                {SMS_SUPPORT_EMAIL}
              </a>
            </p>
          </div>
        </div>
      </header>
      <main id="sms-policy" className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
      <footer className="border-t border-neutral-200 bg-white">
        <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6">
          <nav aria-label="SMS program policies">
            <ul className="flex flex-col gap-2 text-sm leading-6 sm:flex-row sm:gap-6">
              {SMS_POLICY_ROUTES.map((route) => (
                <li key={route.href}>
                  <a className={linkClass} href={route.href}>
                    {route.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <p className="mt-3 text-sm leading-6 text-neutral-900">
            Support{" "}
            <a className={linkClass} href={`mailto:${SMS_SUPPORT_EMAIL}`}>
              {SMS_SUPPORT_EMAIL}
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
