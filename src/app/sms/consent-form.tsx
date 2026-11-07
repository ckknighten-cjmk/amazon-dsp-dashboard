import {
  SMS_CONSENT_FREQUENCY,
  SMS_POLICY_EFFECTIVE_DATE,
  SMS_POLICY_EFFECTIVE_DATE_ISO,
  SMS_PRIVACY_URL,
  SMS_SUPPORT_EMAIL,
  SMS_TERMS_URL,
} from "@/lib/sms-policy";

const linkClass =
  "font-medium text-blue-900 underline decoration-blue-900/40 underline-offset-4 break-words focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-900";

const BLANK_FIELDS = [
  "Employee printed name",
  "Mobile telephone number",
  "Employee signature",
  "Date",
] as const;

export function BlankSmsConsentForm() {
  return (
    <article>
      <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        Employee SMS Opt-In & Written Consent
      </h1>
      <p className="mt-3 text-lg leading-7 text-neutral-800">Driver Scorecard Notification Program (SMS/MMS)</p>
      <p className="mt-2 text-sm leading-6 text-neutral-700">
        Blank form published{" "}
        <time dateTime={SMS_POLICY_EFFECTIVE_DATE_ISO}>{SMS_POLICY_EFFECTIVE_DATE}</time>. Print this page and
        complete it on paper. This website does not accept or store the form.
      </p>

      <section className="mt-8 space-y-3" aria-labelledby="consent-program">
        <h2 id="consent-program" className="text-xl font-semibold tracking-tight">
          Program
        </h2>
        <p className="text-base leading-7 text-neutral-900">
          CJMK Inc. offers optional employment-related SMS/MMS messages containing your individual driver performance
          scorecards and related image attachments. A message includes only your own scorecard. This program is
          informational and is not a marketing program. It does not include daily safety messages.
        </p>
      </section>

      <section className="mt-8 space-y-3" aria-labelledby="consent-frequency">
        <h2 id="consent-frequency" className="text-xl font-semibold tracking-tight">
          Frequency, charges, and help
        </h2>
        <p className="text-base leading-7 text-neutral-900">{SMS_CONSENT_FREQUENCY}</p>
        <p className="text-base leading-7 text-neutral-900">
          Support:{" "}
          <a className={linkClass} href={`mailto:${SMS_SUPPORT_EMAIL}`}>
            {SMS_SUPPORT_EMAIL}
          </a>
          .
        </p>
      </section>

      <section className="mt-8 space-y-3" aria-labelledby="consent-policies">
        <h2 id="consent-policies" className="text-xl font-semibold tracking-tight">
          Policies
        </h2>
        <p className="text-base leading-7 text-neutral-900">
          Privacy Policy:{" "}
          <a className={linkClass} href={SMS_PRIVACY_URL}>
            {SMS_PRIVACY_URL}
          </a>
        </p>
        <p className="text-base leading-7 text-neutral-900">
          SMS Terms & Conditions:{" "}
          <a className={linkClass} href={SMS_TERMS_URL}>
            {SMS_TERMS_URL}
          </a>
        </p>
      </section>

      <section className="mt-8 space-y-3" aria-labelledby="consent-voluntary">
        <h2 id="consent-voluntary" className="text-xl font-semibold tracking-tight">
          Voluntary consent
        </h2>
        <p className="text-base leading-7 text-neutral-900">
          Consent is voluntary. Declining SMS notifications will not, by itself, affect employment. CJMK Inc. may use
          other appropriate channels, including dispatch, to communicate necessary work information, and scorecards
          remain available through those channels.
        </p>
      </section>

      <section className="mt-8 space-y-3" aria-labelledby="consent-choice">
        <h2 id="consent-choice" className="text-xl font-semibold tracking-tight">
          Opt-in
        </h2>
        <p className="text-base leading-7 text-neutral-900">
          <span className="consent-box" role="img" aria-label="Unchecked"></span>
          YES — I voluntarily agree to receive my individual driver performance scorecards and related image
          attachments by SMS/MMS from CJMK Inc. at the number below, at the frequency disclosed above.
        </p>
        <p className="text-base leading-7 text-neutral-900">This box is intentionally unchecked.</p>
      </section>

      <section className="mt-8" aria-labelledby="consent-fields">
        <h2 id="consent-fields" className="text-xl font-semibold tracking-tight">
          Employee completion
        </h2>
        <p className="mt-3 text-base leading-7 text-neutral-900">
          Leave these lines empty on this published page. They are completed only on a printed copy.
        </p>
        <div className="mt-4 space-y-4">
          {BLANK_FIELDS.map((label) => (
            <p key={label} className="text-base leading-7 text-neutral-900">
              {`${label} (blank)`}
              <span className="consent-line" aria-hidden="true"></span>
            </p>
          ))}
        </div>
      </section>

      <section className="mt-8 space-y-3" aria-labelledby="consent-admin">
        <h2 id="consent-admin" className="text-xl font-semibold tracking-tight">
          For CJMK administration
        </h2>
        <p className="text-base leading-7 text-neutral-900">
          Retain a signed paper copy securely as the record of consent, including the date and phone number. Do not
          enroll an employee who leaves the box unchecked. Honor STOP requests promptly.
        </p>
        <p className="text-base leading-7 text-neutral-900">
          This blank page does not prove that any employee has consented. A signature on an earlier form does not by
          itself cover this scorecard-program wording.
        </p>
        <p className="text-base leading-7 text-neutral-900">Effective date: {SMS_POLICY_EFFECTIVE_DATE}.</p>
      </section>
    </article>
  );
}
