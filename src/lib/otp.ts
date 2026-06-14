// In-memory OTP store. In production, replace sendOtp() with a real SMS API
// call (e.g. Twilio, AWS SNS, or Cambodia-local provider). The demoCode return
// value is only used by the UI to display the code in demo mode — remove it
// once real SMS delivery is wired up.

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface OtpRecord {
  code: string;
  expiresAt: number;
}

const store = new Map<string, OtpRecord>();

function randomSixDigits(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function sendOtp(phone: string): { demoCode: string } {
  const code = randomSixDigits();
  store.set(phone, { code, expiresAt: Date.now() + OTP_TTL_MS });
  // TODO: replace with real SMS call, e.g.:
  // await smsClient.send(phone, `Your Joul.KH verification code is ${code}`)
  return { demoCode: code };
}

export function verifyOtp(phone: string, input: string): boolean {
  const record = store.get(phone);
  if (!record) return false;
  if (Date.now() > record.expiresAt) {
    store.delete(phone);
    return false;
  }
  if (record.code !== input.trim()) return false;
  store.delete(phone);
  return true;
}
