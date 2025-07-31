import { v } from "convex/values";

// Reusable validators for payment attempt data
export const paymentAttemptValidators = {
  billing_date: v.number(),
  charge_type: v.string(),
  created_at: v.number(),
  failed_at: v.optional(v.number()),
  failed_reason: v.optional(v.object({
    code: v.string(),
    decline_code: v.optional(v.string()),
  })),
  invoice_id: v.string(),
  paid_at: v.optional(v.number()),
  payment_id: v.string(),
  statement_id: v.string(),
  status: v.string(),
  updated_at: v.number(),
  payer: v.object({
    email: v.string(),
    first_name: v.string(),
    last_name: v.string(),
    user_id: v.string(),
  }),
  payment_source: v.object({
    card_type: v.string(),
    last4: v.string(),
  }),
  subscription_items: v.array(v.object({
    amount: v.object({
      amount: v.number(),
      amount_formatted: v.string(),
      currency: v.string(),
      currency_symbol: v.string(),
    }),
    plan: v.object({
      id: v.string(),
      name: v.string(),
      slug: v.string(),
      amount: v.number(),
      currency: v.string(),
      period: v.string(),
      interval: v.number(),
    }),
    status: v.string(),
    period_start: v.number(),
    period_end: v.number(),
  })),
  totals: v.object({
    grand_total: v.object({
      amount: v.number(),
      amount_formatted: v.string(),
      currency: v.string(),
      currency_symbol: v.string(),
    }),
    subtotal: v.object({
      amount: v.number(),
      amount_formatted: v.string(),
      currency: v.string(),
      currency_symbol: v.string(),
    }),
    tax_total: v.object({
      amount: v.number(),
      amount_formatted: v.string(),
      currency: v.string(),
      currency_symbol: v.string(),
    }),
  }),
};

// Combined validator for the complete payment attempt data
export const paymentAttemptDataValidator = v.object(paymentAttemptValidators);

// Schema validator (includes the userId link)
export const paymentAttemptSchemaValidator = v.object({
  ...paymentAttemptValidators,
  userId: v.optional(v.id("users")),
});

// Helper function to transform webhook data to our format
export function transformWebhookData(data: any) {
  return {
    billing_date: data.billing_date,
    charge_type: data.charge_type,
    created_at: data.created_at,
    failed_at: data.failed_at || undefined,
    failed_reason: data.failed_reason || undefined,
    invoice_id: data.invoice_id,
    paid_at: data.paid_at || undefined,
    payment_id: data.payment_id,
    statement_id: data.statement_id,
    status: data.status,
    updated_at: data.updated_at,
    payer: {
      email: data.payer.email,
      first_name: data.payer.first_name,
      last_name: data.payer.last_name,
      user_id: data.payer.user_id,
    },
    payment_source: {
      card_type: data.payment_source.card_type,
      last4: data.payment_source.last4,
    },
    subscription_items: data.subscription_items.map((item: any) => ({
      amount: {
        amount: item.amount.amount,
        amount_formatted: item.amount.amount_formatted,
        currency: item.amount.currency,
        currency_symbol: item.amount.currency_symbol,
      },
      plan: {
        id: item.plan.id,
        name: item.plan.name,
        slug: item.plan.slug,
        amount: item.plan.amount,
        currency: item.plan.currency,
        period: item.plan.period,
        interval: item.plan.interval,
      },
      status: item.status,
      period_start: item.period_start,
      period_end: item.period_end,
    })),
    totals: {
      grand_total: {
        amount: data.totals.grand_total.amount,
        amount_formatted: data.totals.grand_total.amount_formatted,
        currency: data.totals.grand_total.currency,
        currency_symbol: data.totals.grand_total.currency_symbol,
      },
      subtotal: {
        amount: data.totals.subtotal.amount,
        amount_formatted: data.totals.subtotal.amount_formatted,
        currency: data.totals.subtotal.currency,
        currency_symbol: data.totals.subtotal.currency_symbol,
      },
      tax_total: {
        amount: data.totals.tax_total.amount,
        amount_formatted: data.totals.tax_total.amount_formatted,
        currency: data.totals.tax_total.currency,
        currency_symbol: data.totals.tax_total.currency_symbol,
      },
    },
  };
} 