import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export const WELCOME_BONUS = 50;
export const DAILY_LEAD_CAP = 8;

export const CREDIT_PACKS = [
  { id: "100", credits: 100, priceInr: 500 },
  { id: "500", credits: 500, priceInr: 2000 },
  { id: "2000", credits: 2000, priceInr: 7000 },
] as const;

export type WalletTxType = "TOPUP" | "LEAD_CHARGE" | "REFUND" | "BONUS" | "PLAN_GRANT" | "ADJUSTMENT";

export async function getOrCreateWallet(providerId: string) {
  return db.wallet.upsert({
    where: { providerId },
    create: { providerId, balance: 0 },
    update: {},
  });
}

type LedgerOpts = { type: WalletTxType; refType?: string; refId?: string; note?: string };

/** Apply a signed credit delta and append a ledger row. Runs inside `tx` if given. */
export async function applyLedger(
  providerId: string,
  amount: number,
  opts: LedgerOpts,
  tx?: Prisma.TransactionClient,
) {
  const run = async (client: Prisma.TransactionClient) => {
    const wallet =
      (await client.wallet.findUnique({ where: { providerId } })) ??
      (await client.wallet.create({ data: { providerId, balance: 0 } }));

    const balanceAfter = wallet.balance + amount;
    if (balanceAfter < 0) throw new InsufficientCreditsError(wallet.balance, -amount);

    await client.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: balanceAfter,
        lifetimeSpent: amount < 0 ? wallet.lifetimeSpent - amount : wallet.lifetimeSpent,
      },
    });
    await client.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: opts.type,
        amount,
        balanceAfter,
        refType: opts.refType ?? null,
        refId: opts.refId ?? null,
        note: opts.note ?? null,
      },
    });
    return balanceAfter;
  };

  return tx ? run(tx) : db.$transaction(run);
}

export class InsufficientCreditsError extends Error {
  constructor(
    public balance: number,
    public needed: number,
  ) {
    super(`Insufficient credits: have ${balance}, need ${needed}`);
    this.name = "InsufficientCreditsError";
  }
}

export async function walletSummary(providerId: string) {
  const wallet = await getOrCreateWallet(providerId);
  const transactions = await db.walletTransaction.findMany({
    where: { walletId: wallet.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return { wallet, transactions };
}
