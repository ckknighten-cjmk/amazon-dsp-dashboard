import type { Metadata } from "next";
import { SmsPolicyDocument } from "../policy-document";
import { termsPolicy } from "@/lib/sms-policy";

export const metadata: Metadata = {
  title: { absolute: "SMS Terms & Conditions · CJMK Inc." },
  description: termsPolicy.description,
  robots: { index: true, follow: true },
};

export default function SmsTermsPage() {
  return <SmsPolicyDocument document={termsPolicy} />;
}
