// Pure logic for send-maintenance-reminders: no Deno-only or network
// dependencies, so it's unit testable with any JS runtime. See
// docs/planning/01-product-analysis-and-risks.md P3/T7 — maintenance
// reminders are meant to be the retention engine and are required to
// reach a user via push even if they never reopen the app.

export const REMINDER_WINDOW_DAYS = 7;

export type ReminderTask = {
  id: string;
  property_id: string;
  title: string;
  next_due_date: string;
};

/** Tasks due within the reminder window that haven't already had a reminder sent today. */
export function selectTasksDueForReminder(
  tasks: ReminderTask[],
  today: string,
  alreadyNotifiedTaskIds: Set<string>,
): ReminderTask[] {
  const cutoff = addDays(today, REMINDER_WINDOW_DAYS);
  return tasks.filter((task) => task.next_due_date <= cutoff && !alreadyNotifiedTaskIds.has(task.id));
}

export type ExpiringAsset = {
  id: string;
  property_id: string;
  name: string;
  warranty_expiry: string;
};

export type ExpiringDocument = {
  id: string;
  property_id: string;
  title: string;
  expiry_date: string;
};

/**
 * Same window/dedup shape as selectTasksDueForReminder, reused for
 * warranty and document expiry dates — anything already expired or
 * expiring within the window, not already notified today.
 */
export function selectExpiringForReminder<T extends { id: string }>(
  items: T[],
  expiryDateOf: (item: T) => string,
  today: string,
  alreadyNotifiedIds: Set<string>,
): T[] {
  const cutoff = addDays(today, REMINDER_WINDOW_DAYS);
  return items.filter((item) => expiryDateOf(item) <= cutoff && !alreadyNotifiedIds.has(item.id));
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data: Record<string, string>;
};

/** One push message per (task, recipient token) pair — a task can have several eligible recipients/devices. */
export function buildPushMessages(
  tasksWithTokens: { task: ReminderTask; tokens: string[] }[],
  today: string,
): ExpoPushMessage[] {
  const messages: ExpoPushMessage[] = [];
  for (const { task, tokens } of tasksWithTokens) {
    const overdue = task.next_due_date < today;
    const title = overdue ? 'Overdue maintenance' : 'Maintenance reminder';
    const body = overdue ? `${task.title} was due ${task.next_due_date}` : `${task.title} is due ${task.next_due_date}`;
    for (const token of tokens) {
      messages.push({ to: token, title, body, data: { taskId: task.id, propertyId: task.property_id } });
    }
  }
  return messages;
}

/** Warranty expiry pushes for assets — one per (asset, recipient token) pair. */
export function buildAssetExpiryMessages(
  assetsWithTokens: { asset: ExpiringAsset; tokens: string[] }[],
  today: string,
): ExpoPushMessage[] {
  const messages: ExpoPushMessage[] = [];
  for (const { asset, tokens } of assetsWithTokens) {
    const expired = asset.warranty_expiry < today;
    const title = expired ? 'Warranty expired' : 'Warranty expiring soon';
    const body = expired
      ? `${asset.name}'s warranty expired ${asset.warranty_expiry}`
      : `${asset.name}'s warranty expires ${asset.warranty_expiry}`;
    for (const token of tokens) {
      messages.push({ to: token, title, body, data: { assetId: asset.id, propertyId: asset.property_id } });
    }
  }
  return messages;
}

/** Expiry pushes for documents (EPC, gas safety, insurance, FENSA, etc.) — one per (document, recipient token) pair. */
export function buildDocumentExpiryMessages(
  documentsWithTokens: { document: ExpiringDocument; tokens: string[] }[],
  today: string,
): ExpoPushMessage[] {
  const messages: ExpoPushMessage[] = [];
  for (const { document, tokens } of documentsWithTokens) {
    const expired = document.expiry_date < today;
    const title = expired ? 'Document expired' : 'Document expiring soon';
    const body = expired
      ? `${document.title} expired ${document.expiry_date}`
      : `${document.title} expires ${document.expiry_date}`;
    for (const token of tokens) {
      messages.push({ to: token, title, body, data: { documentId: document.id, propertyId: document.property_id } });
    }
  }
  return messages;
}

/** Expo's push API caps a single request at 100 messages. */
export function chunkMessages<T>(messages: T[], size = 100): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < messages.length; i += size) {
    chunks.push(messages.slice(i, i + size));
  }
  return chunks;
}
