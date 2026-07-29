import type { AuthUser } from "@/lib/auth"
import {
  SUBSCRIPTION_PLANS_KEY,
  USER_SUBSCRIPTIONS_KEY,
  canPostAdvertisement,
  computeSubscriptionExpiry,
  defaultSubscriptionPlansConfig,
  getActiveUserSubscription,
  getLatestUserSubscription,
  getPlanById,
  isSubscriptionRecordActive,
  isUserExemptFromPayment,
  newSubscriptionRecordId,
  parseSubscriptionPlansConfig,
  parseUserSubscriptionsStore,
  serializeSubscriptionPlansConfig,
  serializeUserSubscriptionsStore,
  shouldAutoActivateSubscriptionOnPayment,
  isSubscriptionTestPaymentMode,
  subscriptionPlansConfigSchema,
  type SubscriptionPlansConfig,
  type UserSubscriptionRecord,
  type UserSubscriptionsStore,
} from "@/lib/advertiser-subscription"
import {
  formatPaymentDetailsForDisplay,
  getPaymentMethodById,
  validatePaymentDetails,
} from "@/lib/site-payment-methods"
import { getSitePaymentMethodsStore } from "@/services/site-payment-methods.service"
import { getSettings, updateSettings } from "@/services/settings.service"

export async function getSubscriptionPlansConfig(): Promise<SubscriptionPlansConfig> {
  const settings = await getSettings()
  return parseSubscriptionPlansConfig(settings[SUBSCRIPTION_PLANS_KEY])
}

export async function saveSubscriptionPlansConfig(config: SubscriptionPlansConfig): Promise<SubscriptionPlansConfig> {
  const parsed = subscriptionPlansConfigSchema.parse(config)
  await updateSettings({ [SUBSCRIPTION_PLANS_KEY]: serializeSubscriptionPlansConfig(parsed) })
  return parseSubscriptionPlansConfig(serializeSubscriptionPlansConfig(parsed))
}

export async function getUserSubscriptionsStore(): Promise<UserSubscriptionsStore> {
  const settings = await getSettings()
  return parseUserSubscriptionsStore(settings[USER_SUBSCRIPTIONS_KEY])
}

async function saveUserSubscriptionsStore(store: UserSubscriptionsStore): Promise<UserSubscriptionsStore> {
  const next = parseUserSubscriptionsStore(serializeUserSubscriptionsStore(store))
  await updateSettings({ [USER_SUBSCRIPTIONS_KEY]: serializeUserSubscriptionsStore(next) })
  return next
}

function touchRecord(record: UserSubscriptionRecord): UserSubscriptionRecord {
  return { ...record, updatedAt: new Date().toISOString() }
}

export async function getUserSubscriptionStatus(userId: string) {
  const [config, store] = await Promise.all([getSubscriptionPlansConfig(), getUserSubscriptionsStore()])
  const active = getActiveUserSubscription(store, userId)
  const latest = getLatestUserSubscription(store, userId)
  const isExempt = isUserExemptFromPayment(userId, config)
  const canPost = active ? isSubscriptionRecordActive(active) : false

  return {
    config: {
      paymentsEnabled: config.paymentsEnabled,
      requireSubscription: config.requireSubscription,
      currency: config.currency,
    },
    active: active || null,
    latest: latest || null,
    isExempt,
    canPost,
    requiresPayment:
      config.paymentsEnabled &&
      config.requireSubscription &&
      !isExempt &&
      !(active && isSubscriptionRecordActive(active)),
  }
}

export async function startSubscriptionCheckout(user: AuthUser, planId: string) {
  const [config, store] = await Promise.all([getSubscriptionPlansConfig(), getUserSubscriptionsStore()])
  const plan = getPlanById(config, planId)
  if (!plan || !plan.enabled) {
    throw new Error("PLAN_NOT_FOUND")
  }

  const active = getActiveUserSubscription(store, user.id)
  if (active && isSubscriptionRecordActive(active)) {
    throw new Error("ALREADY_ACTIVE")
  }

  const now = new Date().toISOString()
  const record: UserSubscriptionRecord = {
    id: newSubscriptionRecordId(),
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    userPhone: user.phone,
    planId: plan.id,
    status: "pending",
    paymentStatus: "pending",
    amount: plan.price,
    currency: config.currency,
    createdAt: now,
    updatedAt: now,
  }

  const nextStore: UserSubscriptionsStore = {
    records: [record, ...store.records.filter((r) => !(r.userId === user.id && r.status === "pending"))],
  }
  await saveUserSubscriptionsStore(nextStore)

  return { record, plan, config }
}

export async function submitSubscriptionPayment(
  user: AuthUser,
  input: {
    subscriptionId: string
    paymentMethodId: string
    paymentDetails: Record<string, string>
    paymentNote?: string
    planId?: string
  }
) {
  const [config, paymentStore] = await Promise.all([
    getSubscriptionPlansConfig(),
    getSitePaymentMethodsStore(),
  ])
  const method = getPaymentMethodById(paymentStore, input.paymentMethodId)
  if (!method || !method.enabled) throw new Error("PAYMENT_METHOD_NOT_FOUND")

  const testMode = isSubscriptionTestPaymentMode(config)
  if (!testMode) {
    const validation = validatePaymentDetails(method, input.paymentDetails)
    if (!validation.ok) throw new Error("VALIDATION_FAILED")
  }

  let store = await getUserSubscriptionsStore()
  let resolvedIndex = store.records.findIndex((r) => r.id === input.subscriptionId && r.userId === user.id)
  if (resolvedIndex < 0) {
    resolvedIndex = store.records.findIndex((r) => r.userId === user.id && r.status === "pending")
  }

  if (resolvedIndex < 0 && input.planId) {
    await startSubscriptionCheckout(user, input.planId)
    store = await getUserSubscriptionsStore()
    resolvedIndex = store.records.findIndex((r) => r.userId === user.id && r.status === "pending")
  }

  if (resolvedIndex < 0) throw new Error("SUBSCRIPTION_NOT_FOUND")

  const current = store.records[resolvedIndex]
  if (current.status !== "pending") throw new Error("INVALID_STATUS")

  const plan = getPlanById(config, current.planId)
  if (!plan) throw new Error("PLAN_NOT_FOUND")

  const now = new Date()
  const startsAt = now.toISOString()
  const expiresAt = computeSubscriptionExpiry(now, plan.durationDays).toISOString()
  const autoActivate = shouldAutoActivateSubscriptionOnPayment(config)
  const detailsSummary = formatPaymentDetailsForDisplay(method, input.paymentDetails, true).join("\n")
  const paymentNote = testMode
    ? `دفع تجريبي — تفعيل تلقائي${detailsSummary ? `\n${detailsSummary}` : ""}`
    : input.paymentNote?.trim() || detailsSummary

  const nextRecord: UserSubscriptionRecord = touchRecord({
    ...current,
    paymentMethod: input.paymentMethodId,
    paymentDetails: input.paymentDetails,
    paymentNote,
    paymentStatus: autoActivate ? "paid" : "pending",
    status: autoActivate ? "active" : "pending",
    startsAt: autoActivate ? startsAt : current.startsAt,
    expiresAt: autoActivate ? expiresAt : current.expiresAt,
  })

  const records = [...store.records]
  records[resolvedIndex] = nextRecord
  await saveUserSubscriptionsStore({ records })

  return { record: nextRecord, config, autoActivated: autoActivate, testMode }
}

export async function activateSubscriptionRecord(subscriptionId: string, adminNote?: string) {
  const [config, store] = await Promise.all([getSubscriptionPlansConfig(), getUserSubscriptionsStore()])
  const index = store.records.findIndex((r) => r.id === subscriptionId)
  if (index < 0) throw new Error("SUBSCRIPTION_NOT_FOUND")

  const current = store.records[index]
  const plan = getPlanById(config, current.planId)
  if (!plan) throw new Error("PLAN_NOT_FOUND")

  const now = new Date()
  const startsAt = now.toISOString()
  const expiresAt = computeSubscriptionExpiry(now, plan.durationDays).toISOString()

  const records = [...store.records]
  records[index] = touchRecord({
    ...current,
    status: "active",
    paymentStatus: "paid",
    startsAt,
    expiresAt,
    adminNote: adminNote?.trim() || current.adminNote,
  })
  return saveUserSubscriptionsStore({ records })
}

export async function rejectSubscriptionPayment(subscriptionId: string, adminNote?: string) {
  const store = await getUserSubscriptionsStore()
  const index = store.records.findIndex((r) => r.id === subscriptionId)
  if (index < 0) throw new Error("SUBSCRIPTION_NOT_FOUND")

  const records = [...store.records]
  records[index] = touchRecord({
    ...store.records[index],
    status: "cancelled",
    paymentStatus: "rejected",
    adminNote: adminNote?.trim() || store.records[index].adminNote,
  })
  return saveUserSubscriptionsStore({ records })
}

async function addUserToExemptList(userId: string) {
  const config = await getSubscriptionPlansConfig()
  const exemptUserIds = [...new Set([...(config.exemptUserIds || []), userId])]
  await saveSubscriptionPlansConfig({ ...config, exemptUserIds })
}

async function removeUserFromExemptList(userId: string) {
  const config = await getSubscriptionPlansConfig()
  const exemptUserIds = (config.exemptUserIds || []).filter((id) => id !== userId)
  await saveSubscriptionPlansConfig({ ...config, exemptUserIds })
}

export async function setPaymentsEnabled(enabled: boolean) {
  const config = await getSubscriptionPlansConfig()
  return saveSubscriptionPlansConfig({ ...config, paymentsEnabled: enabled })
}

export async function removeExemptUser(userId: string) {
  await removeUserFromExemptList(userId)
  return getSubscriptionPlansConfig()
}

export async function waiveUserSubscription(
  userId: string,
  input: { adminNote?: string; durationDays?: number; userName?: string; userEmail?: string | null; userPhone?: string | null }
) {
  const config = await getSubscriptionPlansConfig()
  const store = await getUserSubscriptionsStore()
  const now = new Date()
  const durationDays = input.durationDays && input.durationDays > 0 ? input.durationDays : 3650
  const startsAt = now.toISOString()
  const expiresAt = computeSubscriptionExpiry(now, durationDays).toISOString()
  const timestamp = now.toISOString()

  const waived: UserSubscriptionRecord = {
    id: newSubscriptionRecordId(),
    userId,
    userName: input.userName,
    userEmail: input.userEmail,
    userPhone: input.userPhone,
    planId: "waived",
    status: "waived",
    paymentStatus: "waived",
    amount: 0,
    currency: config.currency,
    startsAt,
    expiresAt,
    waivedByAdmin: true,
    adminNote: input.adminNote?.trim() || "",
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  const records = [
    waived,
    ...store.records.map((r) =>
      r.userId === userId && (r.status === "active" || r.status === "pending")
        ? touchRecord({ ...r, status: "cancelled", paymentStatus: r.paymentStatus === "waived" ? "waived" : "rejected" })
        : r
    ),
  ]

  await addUserToExemptList(userId)
  return saveUserSubscriptionsStore({ records })
}

export async function revokeUserSubscription(userId: string, adminNote?: string) {
  const store = await getUserSubscriptionsStore()
  const records = store.records.map((r) => {
    if (r.userId !== userId) return r
    if (r.status !== "active" && r.status !== "waived" && r.status !== "pending") return r
    return touchRecord({
      ...r,
      status: "cancelled",
      paymentStatus: r.paymentStatus === "waived" ? "rejected" : r.paymentStatus,
      adminNote: adminNote?.trim() || r.adminNote,
    })
  })
  await removeUserFromExemptList(userId)
  return saveUserSubscriptionsStore({ records })
}

export async function assertCanPostAdvertisement(user: AuthUser) {
  const [config, store] = await Promise.all([getSubscriptionPlansConfig(), getUserSubscriptionsStore()])
  const active = getActiveUserSubscription(store, user.id)
  if (!canPostAdvertisement(user, active, config)) {
    throw new Error("SUBSCRIPTION_REQUIRED")
  }
}

export { defaultSubscriptionPlansConfig }
