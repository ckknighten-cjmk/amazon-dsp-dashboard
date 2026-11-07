import type { Metadata } from "next";
import { SmsPolicyDocument } from "../policy-document";
import { privacyPolicy } from "@/lib/sms-policy";

export const metadata: Metadata = {
  title: { absolute: "Privacy Policy · CJMK Inc." },
  description: privacyPolicy.description,
  robots: { index: true, follow: true },
};

export default function PrivacyPolicyPage() {
  return <SmsPolicyDocument document={privacyPolicy} />;
}
