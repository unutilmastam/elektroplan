/** Administrator contacts for buying Pro (GitHub repository variables SUPPORT_PHONE / SUPPORT_TELEGRAM at build). */
export const SUPPORT = {
  phone: (process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? '').trim(),
  telegram: (process.env.NEXT_PUBLIC_SUPPORT_TELEGRAM ?? '').trim().replace(/^@/, ''),
};
