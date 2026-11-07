import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import SmsPolicyLayout from "../app/sms/layout";
import PrivacyPolicyPage from "../app/sms/privacy/page";
import SmsTermsPage from "../app/sms/terms/page";
import {
  SMS_POLICY_EFFECTIVE_DATE,
  SMS_POLICY_EFFECTIVE_DATE_ISO,
  SMS_PRIVACY_PATH,
  SMS_PROGRAM_FREQUENCY,
  SMS_SUPPORT_EMAIL,
  SMS_TERMS_PATH,
  policyHrefs,
  policyPlainText,
  privacyPolicy,
  termsPolicy,
} from "./sms-policy";

const ROOT = path.resolve(import.meta.dirname, "../..");

const SENSITIVE = [
  "Arlando Harris",
  "Alex Reeves",
  "DNA4",
  "WTN2",
  "Delivery Execution",
  "Open navigation",
  "variable-invoice",
  "Seatbelt-Off",
  "Memphis",
  "generalManager",
];

const DRAFT_LANGUAGE = [
  "DRAFT",
  "FOR REVIEW",
  "To be added",
  "Pending approval",
  "frequency confirmation is pending",
  "not published",
  "not submitted",
  "all drivers",
  "every driver",
  "drivers have consented",
  "consent has been obtained",
  "guarantee compliance",
  "fully compliant",
  "weekly automation",
];

function pageHtml(page: () => ReactNode) {
  return renderToStaticMarkup(
    <SmsPolicyLayout>
      <>{page()}</>
    </SmsPolicyLayout>,
  );
}

test("published policy text uses the approved Friday cadence and effective date", () => {
  assert.match(SMS_PROGRAM_FREQUENCY, /weekly/);
  assert.match(SMS_PROGRAM_FREQUENCY, /Friday/);
  assert.match(SMS_PROGRAM_FREQUENCY, /previous week's individual driver performance scorecard/);
  assert.match(SMS_PROGRAM_FREQUENCY, /SMS\/MMS/);
  assert.match(SMS_PROGRAM_FREQUENCY, /image of that employee's own scorecard/);
  assert.match(SMS_PROGRAM_FREQUENCY, /Message and data rates may apply/);
  assert.match(SMS_PROGRAM_FREQUENCY, /does not send daily safety messages/);
  assert.match(SMS_PROGRAM_FREQUENCY, /marketing or promotional messages/);
  assert.match(SMS_PROGRAM_FREQUENCY, /any other automatic messages/);
  assert.match(SMS_PROGRAM_FREQUENCY, /one-time confirmation if you reply STOP/);
  assert.equal(SMS_POLICY_EFFECTIVE_DATE, "November 6, 2026");
  assert.equal(SMS_POLICY_EFFECTIVE_DATE_ISO, "2026-11-06");
  assert.equal(SMS_SUPPORT_EMAIL, "hrcjmk@gmail.com");

  for (const document of [privacyPolicy, termsPolicy]) {
    const plain = policyPlainText(document);
    assert.ok(plain.includes(SMS_PROGRAM_FREQUENCY));
    assert.ok(plain.includes(SMS_POLICY_EFFECTIVE_DATE));
    assert.ok(plain.includes("Reply STOP"));
    assert.ok(plain.includes("HELP"));
    assert.ok(plain.includes(SMS_SUPPORT_EMAIL));
    for (const phrase of DRAFT_LANGUAGE) {
      assert.equal(plain.toLowerCase().includes(phrase.toLowerCase()), false, phrase);
    }
    for (const phrase of SENSITIVE) {
      assert.equal(plain.includes(phrase), false, phrase);
    }
  }
});

test("privacy and terms keep consent limits, carrier liability, and cross-links", () => {
  const privacy = policyPlainText(privacyPolicy);
  const terms = policyPlainText(termsPolicy);

  assert.match(privacy, /not shared with third parties or affiliates/);
  assert.match(privacy, /Authorized messaging service providers/);
  assert.match(privacy, /not for marketing or promotional purposes/);
  assert.match(terms, /Participation is voluntary/);
  assert.match(terms, /Consent is not a condition of employment/);
  assert.match(terms, /affirmative consent for this specific scorecard program/);
  assert.match(terms, /only that recipient/);
  assert.match(terms, /Mobile carriers are not liable for any delayed or undelivered messages/);
  assert.match(terms, /Message and data rates may apply/);
  assert.match(terms, /Message delivery is not guaranteed/);

  assert.deepEqual(policyHrefs(privacyPolicy), [SMS_TERMS_PATH]);
  assert.deepEqual(policyHrefs(termsPolicy), [SMS_PRIVACY_PATH]);
  assert.equal(SMS_PRIVACY_PATH, "/sms/privacy");
  assert.equal(SMS_TERMS_PATH, "/sms/terms");
});

test("rendered policy pages are public documents without forms or dashboard data", () => {
  const privacyHtml = pageHtml(PrivacyPolicyPage);
  const termsHtml = pageHtml(SmsTermsPage);

  for (const html of [privacyHtml, termsHtml]) {
    const decoded = html.replace(/&#x27;/g, "'").replace(/&amp;/g, "&");
    assert.match(html, /hrcjmk@gmail\.com/);
    assert.match(html, /src="\/brand\/cjmk-logo\.png"/);
    assert.match(html, /href="\/sms\/privacy"/);
    assert.match(html, /href="\/sms\/terms"/);
    assert.match(html, /dateTime="2026-11-06"|datetime="2026-11-06"/);
    assert.ok(decoded.includes(SMS_PROGRAM_FREQUENCY));
    assert.equal(html.includes("<form"), false);
    assert.equal(html.includes("aria-label=\"Primary\""), false);
    assert.equal(html.includes("Open navigation"), false);
    for (const phrase of SENSITIVE) {
      assert.equal(html.includes(phrase), false, phrase);
    }
    for (const phrase of DRAFT_LANGUAGE) {
      assert.equal(html.toLowerCase().includes(phrase.toLowerCase()), false, phrase);
    }
  }

  assert.match(privacyHtml, /<h1[^>]*>Privacy Policy<\/h1>/);
  assert.match(termsHtml, /<h1[^>]*>SMS Terms &amp; Conditions<\/h1>/);
});

test("policy route modules do not import dashboard datasets or the ops shell", () => {
  const entrypoints = [
    "src/app/sms/layout.tsx",
    "src/app/sms/loading.tsx",
    "src/app/sms/policy-document.tsx",
    "src/app/sms/privacy/page.tsx",
    "src/app/sms/terms/page.tsx",
    "src/lib/sms-policy.ts",
  ];
  const seen = new Set<string>();

  function walk(relativeFile: string) {
    if (seen.has(relativeFile)) return;
    seen.add(relativeFile);
    const absolute = path.join(ROOT, relativeFile);
    const source = readFileSync(absolute, "utf8");
    const specs = source.matchAll(/from ["']([^"']+)["']/g);
    for (const match of specs) {
      const spec = match[1];
      if (spec === undefined) continue;
      const resolved = resolveImport(absolute, spec);
      if (!resolved) continue;
      const relative = path.relative(ROOT, resolved).split(path.sep).join("/");
      assert.equal(relative.includes("src/lib/data"), false, relative);
      assert.equal(relative.includes("src/components/layout"), false, relative);
      assert.equal(relative.includes("app-shell"), false, relative);
      assert.equal(relative.includes("station-seeds"), false, relative);
      assert.equal(relative.includes("/seed/"), false, relative);
      walk(relative);
    }
  }

  for (const entry of entrypoints) walk(entry);

  const rootLayout = readFileSync(path.join(ROOT, "src/app/layout.tsx"), "utf8");
  assert.equal(rootLayout.includes("AppShell"), false);
  assert.equal(rootLayout.includes("@/lib/data"), false);
  const rootNotFound = readFileSync(path.join(ROOT, "src/app/not-found.tsx"), "utf8");
  assert.equal(rootNotFound.includes("AppShell"), false);
  assert.equal(rootNotFound.includes("@/lib/data"), false);
  assert.equal(rootNotFound.includes("currentStation"), false);
  assert.ok(existsSync(path.join(ROOT, "public/brand/cjmk-logo.png")));

  const cadenceSources = [
    "src/app/sms/policy-document.tsx",
    "src/app/sms/privacy/page.tsx",
    "src/app/sms/terms/page.tsx",
  ];
  for (const relativeFile of cadenceSources) {
    const source = readFileSync(path.join(ROOT, relativeFile), "utf8");
    assert.equal(source.includes("Friday"), false, relativeFile);
  }
});

function resolveImport(fromFile: string, spec: string) {
  let base: string | null = null;
  if (spec.startsWith("@/")) base = path.join(ROOT, "src", spec.slice(2));
  else if (spec.startsWith(".")) base = path.resolve(path.dirname(fromFile), spec);
  if (!base) return null;
  const candidates = [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts"), path.join(base, "index.tsx")];
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}
