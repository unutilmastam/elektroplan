'use client';

import { Check, Crown, Phone, Send } from 'lucide-react';
import Link from 'next/link';
import { GlassPanel } from '@/components/layout/GlassPanel';
import { Button } from '@/components/ui/button';
import { countedProjects, FREE_PROJECTS, formatSum, isPro, proDaysLeft, PRO_PRICE_UZS } from '@/domain/plan';
import { uz } from '@/i18n/uz';
import { formatDate } from '@/lib/format';
import { useAuthStore } from '@/store/authStore';
import { useProjectStore } from '@/store/projectStore';
import { SUPPORT } from './support';

/** /pro: price, what Pro gives, the current plan of this account and how to buy (admin turns it on). */
export function ProScreen() {
  const user = useAuthStore((s) => s.user);
  const projects = useProjectStore((s) => s.projects);
  const pro = isPro(user);
  const used = countedProjects(projects, user);

  const status = !user
    ? null
    : user.role === 'admin'
      ? uz.pro.activeAdmin
      : pro && user.proUntil
        ? `${uz.pro.active.replace('{date}', formatDate(user.proUntil))} · ${uz.pro.daysLeft.replace('{n}', String(proDaysLeft(user)))}`
        : uz.pro.freeUsage.replace('{used}', String(used)).replace('{limit}', String(FREE_PROJECTS));

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-2 sm:p-2.5 lg:gap-3.5 lg:p-3.5">
      <GlassPanel as="header" className="flex shrink-0 items-center gap-3 px-5 py-4">
        <Crown size={28} className="text-pro-gold" fill="currentColor" strokeWidth={1.3} aria-hidden />
        <h1 className="flex-1 text-[22px] font-semibold lg:text-[26px]">{uz.pro.title}</h1>
      </GlassPanel>

      <div className="mx-auto flex w-full max-w-[560px] flex-col gap-2.5 lg:gap-3.5">
        <GlassPanel className="flex flex-col gap-4 p-5 sm:p-6">
          <div>
            <div className="text-[30px] font-bold text-pro-gold" data-testid="pro-price">
              {uz.pro.price.replace('{price}', formatSum(PRO_PRICE_UZS))}
            </div>
            <p className="mt-1 text-[15px] text-text-muted">{uz.pro.lead}</p>
          </div>
          <ul className="flex flex-col gap-2.5">
            {uz.pro.features.map((f) => (
              <li key={f} className="flex items-start gap-3 text-[15px]">
                <Check size={20} className="mt-0.5 shrink-0 text-success" aria-hidden />
                {f}
              </li>
            ))}
          </ul>
          {status ? (
            <div
              data-testid="pro-status"
              className={
                pro
                  ? 'rounded-xl border border-pro-gold/40 bg-pro-gold/10 px-4 py-3 text-[15px] font-medium text-pro-gold'
                  : 'rounded-xl border border-white/10 bg-[#0a1222] px-4 py-3 text-[15px]'
              }
            >
              {status}
            </div>
          ) : null}
        </GlassPanel>

        {pro && user?.role !== 'admin' ? null : (
          <GlassPanel className="flex flex-col gap-4 p-5 sm:p-6">
            <h2 className="text-[18px] font-semibold">{uz.pro.howTitle}</h2>
            <ol className="flex list-decimal flex-col gap-2 pl-5 text-[15px] text-text-muted">
              {uz.pro.how.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            {user ? (
              <div className="rounded-xl border border-white/10 bg-[#0a1222] px-4 py-3">
                <div className="text-[13px] text-text-dim">{uz.pro.yourLogin}</div>
                <div className="text-[17px] font-semibold select-all" data-testid="pro-login">
                  {user.phone ?? user.email}
                </div>
              </div>
            ) : (
              <Button
                asChild
                variant="primary"
                size="lg"
                className="h-auto min-h-[52px] py-2.5 text-center whitespace-normal"
              >
                <Link href="/login/">{uz.pro.needAccount}</Link>
              </Button>
            )}
            {SUPPORT.phone || SUPPORT.telegram ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                {SUPPORT.phone ? (
                  <Button asChild size="lg" className="flex-1">
                    <a href={`tel:${SUPPORT.phone.replace(/[^\d+]/g, '')}`}>
                      <Phone size={18} aria-hidden />
                      {uz.pro.call}
                    </a>
                  </Button>
                ) : null}
                {SUPPORT.telegram ? (
                  <Button asChild variant="primary" size="lg" className="flex-1">
                    <a href={`https://t.me/${SUPPORT.telegram}`} target="_blank" rel="noopener noreferrer">
                      <Send size={18} aria-hidden />
                      {uz.pro.telegram}
                    </a>
                  </Button>
                ) : null}
              </div>
            ) : null}
          </GlassPanel>
        )}
      </div>
    </div>
  );
}
