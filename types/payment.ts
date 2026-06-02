export type PublicPaymentStatus = "pending_payment" | "paid" | "failed" | "cancelled" | "expired" | "manual_review" | "refunded";

export type PublicPaymentOrder = {
  orderNo: string;
  businessType: string;
  applicationNo: string;
  payerName: string;
  amount: number;
  currency: string;
  paymentChannel: string;
  provider: "none" | "manual" | string;
  status: PublicPaymentStatus;
  receiptFileName?: string;
  receiptUploadedAt?: string | null;
  receiptReviewStatus?: "not_uploaded" | "pending_review" | "approved" | "rejected" | string;
  receiptReviewNote?: string;
  paidAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
};
