import type { ReactNode } from "react";
import { SmsPolicyFrame } from "./policy-document";

export default function SmsPolicyLayout({ children }: { children: ReactNode }) {
  return <SmsPolicyFrame>{children}</SmsPolicyFrame>;
}
