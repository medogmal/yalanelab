import nodemailer from "nodemailer";

function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
}

export async function sendEmail(to: string, subject: string, html: string) {
  const transporter = getTransport();
  if (!transporter) return { ok: false, error: "smtp_not_configured" };
  const from = process.env.SMTP_FROM || "no-reply@yalanelab.com";
  try {
    await transporter.sendMail({ from, to, subject, html });
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? "send_failed" };
  }
}

// ─── Templates ────────────────────────────────────────────────────────────────

const BASE_STYLE = `
  font-family: 'Cairo', Arial, sans-serif;
  background: #0c0c0e;
  color: #f4f4f8;
  max-width: 560px;
  margin: 0 auto;
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid rgba(124,58,237,0.2);
`;

const HEADER = (title: string, emoji: string) => `
  <div style="background:linear-gradient(135deg,#12062e,#1a0a3e);padding:32px 28px 24px;text-align:center;border-bottom:1px solid rgba(124,58,237,0.15);">
    <div style="font-size:48px;margin-bottom:10px;">${emoji}</div>
    <h1 style="margin:0;font-size:24px;font-weight:900;color:#f4f4f8;">${title}</h1>
    <div style="font-size:12px;color:#7c3aed;margin-top:6px;font-weight:700;letter-spacing:0.1em;">YALANELAB</div>
  </div>
`;

const FOOTER = `
  <div style="padding:20px 28px;text-align:center;border-top:1px solid rgba(255,255,255,0.05);background:#131317;">
    <div style="font-size:11px;color:#7a7a8a;">© 2026 YalaNeLab · جميع الحقوق محفوظة</div>
    <div style="font-size:11px;color:#404050;margin-top:4px;">لا تشارك هذا البريد مع أي شخص</div>
  </div>
`;

const BTN = (href: string, label: string) => `
  <a href="${href}" style="display:inline-block;padding:13px 32px;background:#7c3aed;color:#fff;font-weight:900;font-size:14px;border-radius:12px;text-decoration:none;margin:8px 0;">
    ${label}
  </a>
`;

// 1) Welcome / Registration Confirmation
export async function sendWelcomeEmail(to: string, name: string, verifyUrl?: string) {
  const html = `
    <div style="${BASE_STYLE}">
      ${HEADER("أهلاً بك في يالا نلعب! 🎮", "🎲")}
      <div style="padding:28px;direction:rtl;">
        <p style="font-size:16px;font-weight:700;color:#f4f4f8;margin-bottom:10px;">مرحباً ${name}!</p>
        <p style="font-size:14px;color:#c0c0cc;line-height:1.7;margin-bottom:20px;">
          تم إنشاء حسابك بنجاح. أنت الآن جاهز للمنافسة في الدومينو، البلوت، الشطرنج، واللودو!
        </p>
        ${verifyUrl ? `
        <div style="text-align:center;margin:24px 0;">
          ${BTN(verifyUrl, "تأكيد البريد الإلكتروني →")}
        </div>
        <p style="font-size:12px;color:#7a7a8a;text-align:center;">هذا الرابط صالح لمدة 24 ساعة</p>
        ` : `
        <div style="text-align:center;margin:24px 0;">
          ${BTN("https://yalanelab.com", "ابدأ اللعب الآن →")}
        </div>
        `}
        <div style="background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.15);border-radius:14px;padding:16px;margin-top:20px;">
          <div style="font-size:12px;font-weight:800;color:#a78bfa;margin-bottom:8px;">🎁 هدية الترحيب</div>
          <div style="font-size:13px;color:#c0c0cc;">حصلت على <strong style="color:#f59e0b;">500 كوين</strong> كهدية ترحيب!</div>
        </div>
      </div>
      ${FOOTER}
    </div>
  `;
  return sendEmail(to, "🎮 مرحباً بك في يالا نلعب!", html);
}

// 2) Tournament Notification
export async function sendTournamentEmail(to: string, name: string, tournament: { title: string; startDate: string; prizePool: string; game: string; url: string }) {
  const gameEmojis: Record<string,string> = { domino:"🁣", chess:"♟", baloot:"🃏", ludo:"🎲" };
  const emoji = gameEmojis[tournament.game] ?? "🏆";
  const html = `
    <div style="${BASE_STYLE}">
      ${HEADER(tournament.title, emoji)}
      <div style="padding:28px;direction:rtl;">
        <p style="font-size:16px;font-weight:700;color:#f4f4f8;margin-bottom:10px;">مرحباً ${name}!</p>
        <p style="font-size:14px;color:#c0c0cc;line-height:1.7;margin-bottom:20px;">
          بطولة جديدة على وشك البدء. سجّل الآن قبل امتلاء الأماكن!
        </p>
        <div style="background:#131317;border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:16px;margin-bottom:20px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
            <span style="font-size:12px;color:#7a7a8a;">اللعبة</span>
            <span style="font-size:13px;font-weight:800;color:#f4f4f8;">${emoji} ${tournament.game}</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
            <span style="font-size:12px;color:#7a7a8a;">التاريخ</span>
            <span style="font-size:13px;font-weight:800;color:#f4f4f8;">${new Date(tournament.startDate).toLocaleDateString("ar-EG")}</span>
          </div>
          <div style="display:flex;justify-content:space-between;">
            <span style="font-size:12px;color:#7a7a8a;">الجوائز</span>
            <span style="font-size:13px;font-weight:900;color:#f59e0b;">${tournament.prizePool}</span>
          </div>
        </div>
        <div style="text-align:center;">
          ${BTN(tournament.url, "سجّل في البطولة →")}
        </div>
      </div>
      ${FOOTER}
    </div>
  `;
  return sendEmail(to, `🏆 بطولة جديدة: ${tournament.title}`, html);
}

// 3) Season End Notification
export async function sendSeasonEndEmail(to: string, name: string, data: { rank: number; rating: number; coins: number }) {
  const html = `
    <div style="${BASE_STYLE}">
      ${HEADER("انتهى الموسم! 🏆", "🎖")}
      <div style="padding:28px;direction:rtl;">
        <p style="font-size:16px;font-weight:700;color:#f4f4f8;margin-bottom:10px;">مرحباً ${name}!</p>
        <p style="font-size:14px;color:#c0c0cc;line-height:1.7;margin-bottom:20px;">
          الموسم انتهى وجائزتك في انتظارك. أداء رائع هذا الموسم!
        </p>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:24px;text-align:center;">
          <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.15);border-radius:12px;padding:14px;">
            <div style="font-size:22px;font-weight:900;color:#f59e0b;">#${data.rank}</div>
            <div style="font-size:10px;color:#7a7a8a;">ترتيبك</div>
          </div>
          <div style="background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.15);border-radius:12px;padding:14px;">
            <div style="font-size:22px;font-weight:900;color:#a78bfa;">${data.rating}</div>
            <div style="font-size:10px;color:#7a7a8a;">نقاط ELO</div>
          </div>
          <div style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.15);border-radius:12px;padding:14px;">
            <div style="font-size:22px;font-weight:900;color:#22c55e;">${data.coins.toLocaleString()}</div>
            <div style="font-size:10px;color:#7a7a8a;">كوين مكافأة</div>
          </div>
        </div>
        <div style="text-align:center;">
          ${BTN("https://yalanelab.com", "استلم مكافأتك →")}
        </div>
      </div>
      ${FOOTER}
    </div>
  `;
  return sendEmail(to, "🎖 انتهى الموسم — استلم مكافأتك!", html);
}
