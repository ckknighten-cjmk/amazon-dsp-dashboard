export const RECONCILE_WEEKS = [37, 38, 39] as const;

export type ReconcileWeek = (typeof RECONCILE_WEEKS)[number];

export type ReconcileStatus = "match" | "mismatch" | "not_comparable";

export const RECONCILE_STATUS_LABEL: Record<ReconcileStatus, string> = {
  match: "Match",
  mismatch: "Mismatch",
  not_comparable: "Not comparable",
};

export interface ReconcileSide {
  text: string;
  /** Set when this side is one number. Units still have to match before a variance is shown. */
  numeric: number | null;
  unit: string | null;
}

export interface ReconcileRow {
  id: string;
  field: string;
  invoice: ReconcileSide;
  workSummary: ReconcileSide;
  status: ReconcileStatus;
  /** Invoice minus Work Summary. Blank unless both sides share a unit. */
  variance: number | null;
  varianceUnit: string | null;
  note: string;
}

export interface ServiceCompareRow {
  id: string;
  label: string;
  invoiceRoutePayments: number | null;
  invoiceAmountCents: number | null;
  completedRoutes: number | null;
  deliveredPackages: number | null;
  pickupPackages: number | null;
  amzlLateCancel: number | null;
  providerLateCancel: number | null;
  status: ReconcileStatus;
  note: string;
}

export interface InvoiceLineView {
  date: string | null;
  label: string;
  serviceType: string | null;
  quantity: number;
  rate: string;
  amount: string;
}

export interface InvoiceSectionView {
  name: string;
  quantityLabel: string;
  quantity: number;
  total: string;
  totalCents: number;
  lines: InvoiceLineView[];
}

export interface SourceCheck {
  id: string;
  source: "invoice" | "work_summary";
  kind: "holds" | "gap";
  label: string;
  detail: string;
}

export interface HeadlineCompare {
  label: string;
  invoice: string;
  workSummary: string;
}

export interface WeekReconcile {
  week: ReconcileWeek;
  period: string;
  invoiceListed: boolean;
  insight: string;
  listingNote: string;
  counts: { match: number; mismatch: number; notComparable: number };
  invoice: {
    invoiceId: string;
    invoiceType: string;
    station: string;
    period: string;
    status: string;
    disputeWindowCloses: string;
    total: string;
    totalCents: number;
    capturedAt: string;
    navPath: string;
    sections: InvoiceSectionView[];
  } | null;
  workSummary: {
    station: string;
    serviceArea: string;
    period: string;
    capturedAt: string;
    navPath: string;
    totalPackages: number;
    deliveredPackages: number;
    pickupPackages: number;
    completedRoutes: number;
    miles: number;
    unplannedDelayCount: number;
    ratesSentence: string;
    notes: string;
    routeDeliveredSum: number;
    routePickupSum: number;
    routeCompletedSum: number;
    quickCoverageSum: number;
    acceptedSum: number;
  };
  rows: ReconcileRow[];
  serviceRows: ServiceCompareRow[];
  checks: SourceCheck[];
}
