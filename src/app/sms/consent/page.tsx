import type { Metadata } from "next";
import { BlankSmsConsentForm } from "../consent-form";

export const metadata: Metadata = {
  title: { absolute: "SMS Consent Form · CJMK Inc." },
  description:
    "Blank written consent form for the CJMK Inc. driver scorecard SMS/MMS program. The opt-in box is unchecked and the signature lines are empty.",
  robots: { index: true, follow: true },
};

export default function SmsConsentPage() {
  return <BlankSmsConsentForm />;
}
