const { initializeApp } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");
const { getMessaging } = require("firebase-admin/messaging");
const { onValueCreated, onValueUpdated, onValueWritten } = require("firebase-functions/v2/database");
const { logger } = require("firebase-functions");

initializeApp({
  databaseURL: "https://kasir-arsyla-v2-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const REGION = "asia-southeast1";
const INSTANCE = "kasir-arsyla-v2-default-rtdb";

async function sendPush({ title, body, type, tag }) {
  const snapshot = await getDatabase().ref("pushTokens").get();
  const registrations = Object.entries(snapshot.val() || {})
    .filter(([, registration]) => registration?.enabled === true && registration?.token)
    .map(([id, registration]) => ({ id, token: registration.token }));

  if (!registrations.length) {
    logger.info("Push dilewati: belum ada perangkat terdaftar", { type });
    return;
  }

  for (let start = 0; start < registrations.length; start += 500) {
    const batch = registrations.slice(start, start + 500);
    const result = await getMessaging().sendEachForMulticast({
      tokens: batch.map(item => item.token),
      data: { title, body, type, tag },
      webpush: { headers: { Urgency: type === "crowd" ? "high" : "normal" } }
    });

    const staleIds = [];
    result.responses.forEach((response, index) => {
      if (!response.success && [
        "messaging/invalid-registration-token",
        "messaging/registration-token-not-registered"
      ].includes(response.error?.code)) staleIds.push(batch[index].id);
    });
    await Promise.all(staleIds.map(id => getDatabase().ref(`pushTokens/${id}`).remove()));
    logger.info("Hasil pengiriman push", { type, success: result.successCount, failure: result.failureCount });
  }
}

function displayOrder(order) {
  const queue = order?.queue ? `#${order.queue}` : "Pesanan baru";
  return `${queue}${order?.customer ? ` - ${order.customer}` : ""}`;
}

exports.notifyNewOrder = onValueCreated(
  { ref: "/orders/{orderId}", instance: INSTANCE, region: REGION },
  event => {
    const order = event.data.val() || {};
    return sendPush({ title: "Pesanan masuk", body: displayOrder(order), type: "order", tag: `order-${event.params.orderId}` });
  }
);

exports.notifyOrderCompleted = onValueUpdated(
  { ref: "/orders/{orderId}", instance: INSTANCE, region: REGION },
  event => {
    const before = event.data.before.val() || {};
    const after = event.data.after.val() || {};
    if (before.status === "Selesai" || after.status !== "Selesai") return null;
    return sendPush({ title: "Pesanan selesai", body: `${displayOrder(after)} sudah selesai.`, type: "completed", tag: `completed-${event.params.orderId}` });
  }
);

exports.notifyCrowdMode = onValueWritten(
  { ref: "/storeAlerts/crowd", instance: INSTANCE, region: REGION },
  event => {
    const before = event.data.before.val() || {};
    const after = event.data.after.val() || {};
    if (before.active === true || after.active !== true) return null;
    return sendPush({ title: "Toko sedang ramai", body: `${after.updatedBy || "Tim toko"} meminta bantuan. Silakan bantu sekarang.`, type: "crowd", tag: "store-crowded" });
  }
);

exports.notifyLowTortillaStock = onValueWritten(
  { ref: "/ingredients/{ingredientId}", instance: INSTANCE, region: REGION },
  event => {
    const before = event.data.before.val() || {};
    const after = event.data.after.val() || {};
    if (!String(after.name || "").toLowerCase().includes("tortilla")) return null;
    const quantity = Number(after.qty);
    const previousQuantity = Number(before.qty);
    if (!Number.isFinite(quantity) || quantity > 5 || (Number.isFinite(previousQuantity) && previousQuantity <= 5)) return null;
    return sendPush({ title: "Stok tortilla menipis", body: `Tersisa ${quantity} ${after.unit || "pcs"}. Segera tambah stok.`, type: "stock", tag: "tortilla-low-stock" });
  }
);
