import { compare, hash } from "bcryptjs";

const commonPasswords = new Set(["password123!", "1234567890aa!", "qwerty12345!", "deutschimo123!", "admin123456!"]);
export const PASSWORD_POLICY_TEXT = "En az 12 karakter; büyük harf, küçük harf, rakam ve özel karakter kullan.";

export function validatePassword(password: string): string | null {
  if (password.length < 12) return "Şifre en az 12 karakter olmalıdır.";
  if (password.length > 128) return "Şifre en fazla 128 karakter olabilir.";
  if (!/[a-zçğıöşü]/.test(password)) return "Şifre en az bir küçük harf içermelidir.";
  if (!/[A-ZÇĞİÖŞÜ]/.test(password)) return "Şifre en az bir büyük harf içermelidir.";
  if (!/\d/.test(password)) return "Şifre en az bir rakam içermelidir.";
  if (!/[^A-Za-z0-9ÇĞİÖŞÜçğıöşü]/.test(password)) return "Şifre en az bir özel karakter içermelidir.";
  if (commonPasswords.has(password.toLowerCase())) return "Bu şifre çok yaygın. Daha özgün bir şifre seç.";
  return null;
}

export function hashPassword(password: string) { return hash(password, 12); }
export function verifyPassword(password: string, passwordHash: string) { return compare(password, passwordHash); }
