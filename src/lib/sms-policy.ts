/**
 * Public copy for the CJMK Inc. driver scorecard SMS/MMS program.
 * These pages are unauthenticated. Do not import station seeds, driver
 * records, or scorecard files from this module.
 *
 * Message cadence lives only in SMS_PROGRAM_FREQUENCY. Edit that string to
 * change the disclosure on both /sms/privacy and /sms/terms.
 * Approved cadence: every Friday, for the previous week's individual driver
 * performance scorecard, by SMS/MMS, including a scorecard image.
 * Do not add daily safety, marketing, or any other automatic send here.
 */

export const SMS_PRIVACY_PATH = "/sms/privacy";
export const SMS_TERMS_PATH = "/sms/terms";
export const SMS_CONSENT_PATH = "/sms/consent";

/** Live policy URLs for the blank consent form. Reviewers see these even on a preview host. */
export const SMS_PRIVACY_URL = "https://amazon-dsp-dashboard.vercel.app/sms/privacy";
export const SMS_TERMS_URL = "https://amazon-dsp-dashboard.vercel.app/sms/terms";

/**
 * Frequency disclosure printed on the blank consent form only.
 * The public privacy policy and SMS terms keep SMS_PROGRAM_FREQUENCY.
 * Weekly Friday notices are typically 4–5 messages in a month.
 */
export const SMS_CONSENT_FREQUENCY =
  "CJMK Inc. sends one scorecard notification each Friday for the previous week's individual driver performance scorecard, typically 4–5 messages a month. The Friday notice is sent by SMS/MMS and may include an image of that employee's own scorecard. Message and data rates may apply. Reply STOP to unsubscribe or HELP for assistance. This program does not send daily safety messages, marketing or promotional messages, or any other automatic messages, aside from a one-time confirmation if you reply STOP.";

export const SMS_SUPPORT_EMAIL = "hrcjmk@gmail.com";

export const SMS_POLICY_EFFECTIVE_DATE = "November 6, 2026";
export const SMS_POLICY_EFFECTIVE_DATE_ISO = "2026-11-06";

export const SMS_POLICY_ROUTES = [
  { href: SMS_PRIVACY_PATH, label: "Privacy Policy" },
  { href: SMS_TERMS_PATH, label: "SMS Terms & Conditions" },
] as const;

/**
 * Approved frequency disclosure. Edit this string to update both public pages.
 */
export const SMS_PROGRAM_FREQUENCY =
  "Message frequency is weekly: one scorecard notification each Friday for the previous week's individual driver performance scorecard. The Friday notice is sent by SMS/MMS and may include an image of that employee's own scorecard. Message and data rates may apply. This program does not send daily safety messages, marketing or promotional messages, or any other automatic messages, aside from a one-time confirmation if you reply STOP.";

export type PolicyInline =
  | { kind: "text"; text: string }
  | { kind: "link"; href: string; label: string }
  | { kind: "mail" };

export type PolicySection = {
  id: string;
  heading: string;
  paragraphs: PolicyInline[][];
};

export type PolicyDocumentModel = {
  title: string;
  programName: string;
  description: string;
  sections: PolicySection[];
};

const PROGRAM_NAME = "Driver Scorecard Notification Program (SMS/MMS)";

function text(value: string): PolicyInline {
  return { kind: "text", text: value };
}

function link(href: string, label: string): PolicyInline {
  return { kind: "link", href, label };
}

const mail: PolicyInline = { kind: "mail" };

export const privacyPolicy: PolicyDocumentModel = {
  title: "Privacy Policy",
  programName: PROGRAM_NAME,
  description:
    "Privacy policy for the CJMK Inc. Driver Scorecard Notification Program. It covers mobile numbers used to send an enrolled employee their own scorecard by SMS/MMS.",
  sections: [
    {
      id: "information-collected",
      heading: "Information collected",
      paragraphs: [
        [
          text(
            "CJMK Inc. collects the mobile number supplied for the employee SMS/MMS scorecard program, the employee’s opt-in choice, date and method of consent, and relevant messaging records (such as delivery status, HELP requests, and opt-out status).",
          ),
        ],
      ],
    },
    {
      id: "use-of-information",
      heading: "Use of information",
      paragraphs: [
        [
          text(
            "CJMK Inc. uses this information to send and administer each enrolled driver’s individual performance scorecard notifications and related image attachments by SMS/MMS, to respond to requests, and to maintain records of consent and opt-out preferences. This use is limited to the scorecard notification program described in these materials and is not for marketing or promotional purposes.",
          ),
        ],
      ],
    },
    {
      id: "sharing",
      heading: "Sharing and marketing",
      paragraphs: [
        [
          text(
            "We do not sell or share your SMS opt-in data or personal information with third parties for marketing purposes. SMS opt-in consent and mobile numbers are not shared with third parties or affiliates for their own marketing or promotional purposes. Authorized messaging service providers may process information solely to deliver and administer CJMK Inc. messages, subject to appropriate safeguards.",
          ),
        ],
      ],
    },
    {
      id: "frequency",
      heading: "Frequency, charges and choices",
      paragraphs: [
        [text(SMS_PROGRAM_FREQUENCY)],
        [
          text("Reply STOP to unsubscribe or HELP for assistance. For support, contact "),
          mail,
          text("."),
        ],
      ],
    },
    {
      id: "security",
      heading: "Security and retention",
      paragraphs: [
        [
          text(
            "CJMK Inc. limits access to employee messaging information to authorized personnel and service providers and uses reasonable administrative and technical safeguards. Consent and messaging records are retained as needed for lawful business and compliance purposes and then disposed of appropriately.",
          ),
        ],
      ],
    },
    {
      id: "contact",
      heading: "Contact and effective date",
      paragraphs: [
        [text("Questions about this policy: "), mail, text(".")],
        [
          text("SMS Terms & Conditions: "),
          link(SMS_TERMS_PATH, "SMS Terms & Conditions"),
          text("."),
        ],
        [text(`Effective date: ${SMS_POLICY_EFFECTIVE_DATE}.`)],
      ],
    },
  ],
};

export const termsPolicy: PolicyDocumentModel = {
  title: "SMS Terms & Conditions",
  programName: PROGRAM_NAME,
  description:
    "SMS terms for the optional CJMK Inc. Driver Scorecard Notification Program. Messages are limited to an enrolled employee’s own performance scorecard by SMS/MMS.",
  sections: [
    {
      id: "program",
      heading: "Program and eligibility",
      paragraphs: [
        [
          text(
            "The CJMK Inc. Driver Scorecard Notification Program sends optional employment-related SMS/MMS messages containing each enrolled driver’s own individual performance scorecards and related image attachments. Messages identify the reporting station and week and include only that recipient’s scorecard information. This program is informational and is not a marketing program. Enrollment is limited to employees who provide affirmative consent for this specific scorecard program.",
          ),
        ],
      ],
    },
    {
      id: "enrollment",
      heading: "Enrollment and frequency",
      paragraphs: [
        [
          text(
            "Employees enroll by completing and signing a separate SMS consent form during onboarding or another documented enrollment process.",
          ),
        ],
        [
          text(
            "A blank copy of that form, with the opt-in box unchecked and the name, mobile number, signature, and date lines empty, is published at ",
          ),
          link(SMS_CONSENT_PATH, "Blank SMS consent form"),
          text(". Publishing the blank form is not a record that any employee has signed it."),
        ],
        [text(SMS_PROGRAM_FREQUENCY)],
        [
          text(
            "Participation is voluntary. Consent is not a condition of employment; scorecards remain available through dispatch or other appropriate channels.",
          ),
        ],
      ],
    },
    {
      id: "charges",
      heading: "Charges and delivery",
      paragraphs: [
        [
          text(
            "Message and data rates may apply. Mobile carriers are not liable for any delayed or undelivered messages. Message delivery is not guaranteed.",
          ),
        ],
      ],
    },
    {
      id: "opt-out",
      heading: "Opt out and help",
      paragraphs: [
        [
          text(
            "STOP: Reply STOP to any program message to unsubscribe. After opt-out, no further program messages will be sent unless you enroll again, except for any necessary confirmation of your opt-out.",
          ),
        ],
        [text("HELP: Reply HELP for assistance or contact "), mail, text(".")],
      ],
    },
    {
      id: "privacy-contact",
      heading: "Privacy and contact",
      paragraphs: [
        [text("Privacy Policy: "), link(SMS_PRIVACY_PATH, "Privacy Policy"), text(".")],
        [text("Support contact: "), mail, text(".")],
        [text(`Effective date: ${SMS_POLICY_EFFECTIVE_DATE}.`)],
      ],
    },
  ],
};

export function policyPlainText(document: PolicyDocumentModel): string {
  const parts = [document.title, document.programName, SMS_POLICY_EFFECTIVE_DATE];
  for (const section of document.sections) {
    parts.push(section.heading);
    for (const paragraph of section.paragraphs) {
      parts.push(
        paragraph
          .map((part) => {
            if (part.kind === "text") return part.text;
            if (part.kind === "mail") return SMS_SUPPORT_EMAIL;
            return part.label;
          })
          .join(""),
      );
    }
  }
  return parts.join("\n");
}

export function policyHrefs(document: PolicyDocumentModel): string[] {
  const hrefs: string[] = [];
  for (const section of document.sections) {
    for (const paragraph of section.paragraphs) {
      for (const part of paragraph) {
        if (part.kind === "link") hrefs.push(part.href);
      }
    }
  }
  return hrefs;
}
