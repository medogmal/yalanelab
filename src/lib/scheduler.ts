import { listTournaments, listRegistrations } from "./store";
import { sendEmail } from "./email";

declare global {
  var __nelabSchedulerStarted: boolean | undefined;
}

async function checkAndNotify() {
  const now = Date.now();
  const items = listTournaments();
  for (const t of items) {
    const startMs = new Date(t.startAt).getTime();
    const diffMin = Math.floor((startMs - now) / 60000);
    if (diffMin === 60) {
      const regs = listRegistrations(t.id);
      for (const r of regs) {
        await sendEmail(
          r.email,
          `تذكير بطولة ${t.name}`,
          `<div>ستبدأ البطولة بعد ساعة: ${t.name}</div>`
        );
      }
    }
  }
}

export function ensureScheduler() {
  if (global.__nelabSchedulerStarted) return;
  global.__nelabSchedulerStarted = true;
  setInterval(() => {
    checkAndNotify().catch(() => {});
  }, 60_000);
}
