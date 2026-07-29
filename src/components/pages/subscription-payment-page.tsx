"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { ArrowLeft, CreditCard, Loader2, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "@/lib/router-context"
import { useI18n } from "@/lib/i18n-context"
import {
  clearPendingSubscriptionId,
  getPendingSubscriptionId,
  getSelectedSubscriptionPlan,
  setPendingSubscriptionId,
  setPostAuthRedirect,
  setSelectedSubscriptionPlan,
} from "@/lib/post-auth-redirect"
import { hasPendingAdDraft } from "@/lib/ad-draft-storage"
import { pendingAdSuccessMessage, submitPendingAdDraft } from "@/lib/submit-pending-ad"
import { getPlanById, getPlanLabel, type SubscriptionPlan } from "@/lib/advertiser-subscription"
import {
  getPaymentMethodLabel,
  validatePaymentDetails,
  type SitePaymentField,
  type SitePaymentMethod,
} from "@/lib/site-payment-methods"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

function paymentErrorMessage(code: string | undefined, isAr: boolean): string {
  switch (code) {
    case "AUTH_REQUIRED":
      return isAr ? "يرجى تسجيل الدخول مجدداً" : "Please sign in again"
    case "NOT_FOUND":
      return isAr
        ? "انتهت صلاحية طلب الاشتراك — ارجع واختر الخطة من جديد"
        : "Subscription request expired — go back and select your plan again"
    case "INVALID_STATUS":
      return isAr ? "تم إرسال الدفع مسبقاً — انتظر موافقة الإدارة" : "Payment already submitted — await admin approval"
    case "METHOD_NOT_FOUND":
      return isAr ? "طريقة الدفع غير متاحة — اختر طريقة أخرى" : "Payment method unavailable — choose another"
    case "VALIDATION_FAILED":
      return isAr ? "يرجى تعبئة جميع الحقول المطلوبة" : "Please fill all required fields"
    case "PLAN_NOT_FOUND":
      return isAr ? "الخطة غير متاحة — ارجع واختر خطة أخرى" : "Plan unavailable — go back and choose another"
    case "SERVER_ERROR":
      return isAr ? "خطأ في الخادم — حاول مرة أخرى بعد قليل" : "Server error — try again shortly"
    default:
      return isAr ? "فشل إرسال الدفع — حاول مرة أخرى" : "Failed to submit payment — try again"
  }
}

function PaymentFieldInput({
  field,
  value,
  onChange,
  isAr,
  error,
}: {
  field: SitePaymentField
  value: string
  onChange: (value: string) => void
  isAr: boolean
  error?: boolean
}) {
  const label = isAr ? field.labelAr : field.labelEn
  const placeholder = isAr ? field.placeholderAr : field.placeholderEn
  const className = cn(
    "rounded-xl border-2 border-foreground/15 bg-background h-11",
    error && "border-destructive"
  )

  if (field.type === "textarea") {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <Textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(className, "h-auto min-h-[88px]")}
        />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type={field.type === "number" ? "text" : field.type}
        inputMode={field.type === "tel" ? "tel" : field.type === "number" ? "numeric" : undefined}
        dir={field.type === "email" || field.type === "tel" ? "ltr" : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
      />
    </div>
  )
}

export function SubscriptionPaymentPage() {
  const { locale } = useI18n()
  const { user, loading: authLoading } = useAuth()
  const { navigate } = useRouter()
  const isAr = locale === "ar"

  const [currency, setCurrency] = useState("SAR")
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null)
  const [methods, setMethods] = useState<SitePaymentMethod[]>([])
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null)
  const [planId, setPlanId] = useState<string | null>(null)
  const [selectedMethodId, setSelectedMethodId] = useState<string>("")
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [testPaymentMode, setTestPaymentMode] = useState(true)

  const selectedMethod = useMemo(
    () => methods.find((m) => m.id === selectedMethodId) || methods[0],
    [methods, selectedMethodId]
  )

  useEffect(() => {
    if (selectedMethod) {
      setFieldValues((prev) => {
        const next: Record<string, string> = {}
        for (const f of selectedMethod.fields) {
          next[f.id] = prev[f.id] || ""
        }
        return next
      })
      setFieldErrors({})
    }
  }, [selectedMethod?.id])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setPostAuthRedirect("subscription")
      navigate({ page: "user-auth" })
      return
    }

    const init = async () => {
      setLoading(true)
      try {
        const [plansRes, methodsRes] = await Promise.all([
          fetch("/api/subscriptions/plans", { cache: "no-store" }),
          fetch("/api/payment-methods", { cache: "no-store" }),
        ])
        const plansJson = await plansRes.json()
        const methodsJson = await methodsRes.json()
        if (!plansRes.ok) throw new Error("plans failed")
        if (!methodsRes.ok) throw new Error("methods failed")

        setCurrency(plansJson.currency || "SAR")
        setTestPaymentMode(plansJson.testPaymentMode !== false)
        setMethods(methodsJson.methods || [])
        if (methodsJson.methods?.[0]) setSelectedMethodId(methodsJson.methods[0].id)

        const token = localStorage.getItem("ciar_token")
        const meRes = await fetch("/api/subscriptions/me", {
          cache: "no-store",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        const meJson = await meRes.json()

        if (meJson.canPost) {
          navigate({ page: "advertise" })
          return
        }

        let pendingId: string | null = null
        let resolvedPlanId = meJson.latest?.planId || getSelectedSubscriptionPlan() || ""

        if (meJson.latest?.status === "pending" && meJson.latest?.id) {
          pendingId = meJson.latest.id
        } else {
          pendingId = getPendingSubscriptionId()
        }

        if (!resolvedPlanId) {
          const savedPlanId = getSelectedSubscriptionPlan()
          if (savedPlanId) resolvedPlanId = savedPlanId
        }

        if (!resolvedPlanId && !pendingId) {
          navigate({ page: "subscription" })
          return
        }

        if (resolvedPlanId) {
          const checkoutRes = await fetch("/api/subscriptions/checkout", {
            method: "POST",
            cache: "no-store",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ planId: resolvedPlanId }),
          })
          const checkoutJson = await checkoutRes.json().catch(() => ({}))
          if (checkoutRes.status === 409) {
            navigate({ page: "advertise" })
            return
          }
          if (!checkoutRes.ok || !checkoutJson.subscriptionId) {
            throw new Error("checkout failed")
          }
          pendingId = checkoutJson.subscriptionId
          setPendingSubscriptionId(pendingId)
          setSelectedSubscriptionPlan(resolvedPlanId)
        }

        if (!pendingId) {
          navigate({ page: "subscription" })
          return
        }

        setSubscriptionId(pendingId)
        setPlanId(resolvedPlanId || meJson.latest?.planId || getSelectedSubscriptionPlan())
        const selectedPlan = getPlanById(plansJson, meJson.latest?.planId || resolvedPlanId || "")
        if (selectedPlan) {
          setPlan(selectedPlan)
        } else {
          const savedPlanId = getSelectedSubscriptionPlan()
          const fallbackPlan = savedPlanId ? getPlanById(plansJson, savedPlanId) : undefined
          if (fallbackPlan) setPlan(fallbackPlan)
        }
      } catch {
        toast.error(isAr ? "تعذّر تحميل بيانات الدفع" : "Could not load payment details")
        navigate({ page: "subscription" })
      } finally {
        setLoading(false)
      }
    }

    void init()
  }, [user, authLoading, navigate, isAr])

  const submitPayment = async (overrideSubscriptionId?: string) => {
    const activeSubscriptionId = overrideSubscriptionId || subscriptionId
    if (!activeSubscriptionId || !selectedMethod) return false

    const validation = validatePaymentDetails(selectedMethod, fieldValues)
    if (!testPaymentMode && !validation.ok) {
      setFieldErrors(validation.errors)
      toast.error(isAr ? "يرجى تعبئة جميع الحقول المطلوبة" : "Please fill all required fields")
      return false
    }

    const token = localStorage.getItem("ciar_token")
    const res = await fetch("/api/subscriptions/payment", {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        subscriptionId: activeSubscriptionId,
        paymentMethodId: selectedMethod.id,
        paymentDetails: fieldValues,
        planId: planId || undefined,
      }),
    })
    const data = await res.json().catch(() => ({}))

    if (!res.ok && data?.code === "NOT_FOUND" && !overrideSubscriptionId && planId) {
      const checkoutRes = await fetch("/api/subscriptions/checkout", {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ planId }),
      })
      const checkoutJson = await checkoutRes.json().catch(() => ({}))
      if (checkoutRes.ok && checkoutJson.subscriptionId) {
        setSubscriptionId(checkoutJson.subscriptionId)
        setPendingSubscriptionId(checkoutJson.subscriptionId)
        return submitPayment(checkoutJson.subscriptionId)
      }
    }

    if (!res.ok) {
      toast.error(paymentErrorMessage(typeof data?.code === "string" ? data.code : undefined, isAr))
      if (data?.code === "NOT_FOUND") {
        clearPendingSubscriptionId()
        navigate({ page: "subscription" })
      }
      return false
    }

    return data
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!subscriptionId || !selectedMethod) return

    setSubmitting(true)
    try {
      const data = await submitPayment()
      if (!data) return

      clearPendingSubscriptionId()
      setSelectedSubscriptionPlan("")

      const trySubmitDraft = async () => {
        if (!hasPendingAdDraft()) return false
        const result = await submitPendingAdDraft()
        if (!result.submitted) return false
        if (result.deliveryUrl) {
          window.open(result.deliveryUrl, "_blank", "noopener,noreferrer")
        }
        toast.success(pendingAdSuccessMessage(result.notifyVia, isAr))
        return true
      }

      if (data.autoActivated || data.testMode) {
        const submitted = await trySubmitDraft()
        if (submitted) {
          navigate({ page: "advertise" })
          return
        }
        toast.success(
          data.testMode
            ? isAr
              ? "تم التفعيل التجريبي — يمكنك نشر إعلانك الآن"
              : "Trial activation complete — you can post your ad now"
            : isAr
              ? "تم تفعيل اشتراكك — يمكنك نشر إعلان الآن"
              : "Subscription activated — you can post ads now"
        )
      } else {
        toast.success(
          isAr
            ? hasPendingAdDraft()
              ? "تم إرسال الدفع — بعد موافقة الإدارة سيُرسل إعلانك تلقائياً"
              : "تم إرسال طلب الدفع — سيتم التفعيل بعد موافقة الإدارة"
            : hasPendingAdDraft()
              ? "Payment submitted — your ad will be sent automatically after admin approval"
              : "Payment submitted — activation pending admin approval"
        )
      }
      navigate({ page: "advertise" })
    } catch {
      toast.error(paymentErrorMessage(undefined, isAr))
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!plan || !selectedMethod) return null

  const instructions = isAr ? selectedMethod.instructionsAr : selectedMethod.instructionsEn
  const accountInfo = isAr ? selectedMethod.accountInfoAr : selectedMethod.accountInfoEn

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14 space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Badge variant="outline" className="rounded-full">
            <CreditCard className="h-3.5 w-3.5 me-1" />
            {isAr ? "الدفع" : "Payment"}
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">{isAr ? "إتمام الدفع" : "Complete payment"}</h1>
          <p className="text-sm text-muted-foreground">
            {getPlanLabel(plan, isAr)} — {plan.price.toLocaleString()} {currency}
          </p>
        </div>
        <Button type="button" variant="ghost" className="gap-2 rounded-full" onClick={() => navigate({ page: "subscription" })}>
          <ArrowLeft className="h-4 w-4" />
          {isAr ? "تغيير الخطة" : "Change plan"}
        </Button>
      </div>

      {testPaymentMode ? (
        <div className="rounded-2xl border border-amber-500/35 bg-amber-500/10 px-5 py-4 text-sm">
          <p className="font-semibold text-amber-900 dark:text-amber-100">
            {isAr ? "وضع الدفع التجريبي مفعّل" : "Trial payment mode is active"}
          </p>
          <p className="mt-1 text-muted-foreground">
            {isAr
              ? "لن يُخصم مبلغ حقيقي — اضغط «تفعيل تجريبي» لتفعيل اشتراكك فوراً وإرسال إعلانك المحفوظ."
              : "No real charge — click “Trial activate” to enable your subscription instantly and submit your saved ad."}
          </p>
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-6">
        <section className="rounded-2xl border border-border/50 bg-card p-6 space-y-4">
          <p className="text-sm font-semibold">{isAr ? "اختر طريقة الدفع" : "Choose payment method"}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {methods.map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => setSelectedMethodId(method.id)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border p-4 transition-all text-center",
                  selectedMethodId === method.id
                    ? "border-[oklch(0.78_0.14_82/50%)] bg-[oklch(0.78_0.14_82/10%)] shadow-sm"
                    : "border-border/40 hover:border-border/70 bg-background/60"
                )}
              >
                {method.iconUrl ? (
                  <img src={method.iconUrl} alt="" className="h-10 w-auto object-contain max-w-[80px]" loading="lazy" />
                ) : null}
                <span className="text-xs font-semibold leading-tight">{getPaymentMethodLabel(method, isAr)}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border/50 bg-card p-6 space-y-4">
          <div>
            <p className="text-sm font-semibold">{getPaymentMethodLabel(selectedMethod, isAr)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {isAr ? selectedMethod.descriptionAr : selectedMethod.descriptionEn}
            </p>
          </div>
          {instructions ? <p className="text-sm text-muted-foreground">{instructions}</p> : null}
          {accountInfo ? (
            <div className="rounded-lg border border-border/30 bg-muted/20 p-3 text-sm font-mono whitespace-pre-wrap" dir="ltr">
              {accountInfo}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            {selectedMethod.fields.map((field) => (
              <div key={field.id} className={field.type === "textarea" ? "sm:col-span-2" : undefined}>
                <PaymentFieldInput
                  field={field}
                  value={fieldValues[field.id] || ""}
                  onChange={(v) => {
                    setFieldValues((prev) => ({ ...prev, [field.id]: v }))
                    setFieldErrors((prev) => {
                      const next = { ...prev }
                      delete next[field.id]
                      return next
                    })
                  }}
                  isAr={isAr}
                  error={Boolean(fieldErrors[field.id])}
                />
              </div>
            ))}
          </div>
        </section>

        <div className="rounded-xl border border-border/40 bg-muted/20 p-4 flex items-start gap-3 text-sm">
          <ShieldCheck className="h-5 w-5 shrink-0 text-primary mt-0.5" />
          <p className="text-sm text-muted-foreground">
            {hasPendingAdDraft()
              ? isAr
                ? "بعد تأكيد الدفع من الإدارة سيتم تفعيل اشتراكك وإرسال إعلانك المحفوظ."
                : "After admin confirms payment, your subscription will activate and your saved ad will be submitted."
              : isAr
                ? "بعد تأكيد الدفع من الإدارة سيتم تفعيل اشتراكك ويمكنك نشر الإعلانات."
                : "After admin confirms payment, your subscription will be activated and you can publish ads."}
          </p>
        </div>

        <Button type="submit" disabled={submitting} className="w-full btn-gold h-12 rounded-xl gap-2">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {testPaymentMode
            ? isAr
              ? "تفعيل تجريبي"
              : "Trial activate"
            : isAr
              ? "تأكيد الدفع"
              : "Confirm payment"}
        </Button>
      </form>
    </div>
  )
}
