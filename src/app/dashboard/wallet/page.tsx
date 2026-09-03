import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getOwnedProvider } from "@/lib/queries";
import { walletSummary, CREDIT_PACKS } from "@/lib/wallet";
import { PLANS } from "@/lib/plans";
import { WalletPanel } from "./wallet-panel";

export const metadata: Metadata = { title: "Wallet & plan" };

export default async function DashboardWallet() {
  const user = (await getCurrentUser())!;
  const provider = (await getOwnedProvider(user.id))!;
  const { wallet, transactions } = await walletSummary(provider.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Wallet &amp; plan</h1>
        <p className="mt-1 text-sm text-muted">
          Credits are spent when a matched customer enquiry is delivered to you. Payments are
          simulated in this build — Razorpay integration is a later module.
        </p>
      </div>

      <WalletPanel
        balance={wallet.balance}
        lifetimeSpent={wallet.lifetimeSpent}
        tier={provider.tier}
        packs={CREDIT_PACKS.map((p) => ({ ...p }))}
        plans={PLANS.map((p) => ({ ...p, features: p.features.split("\n") }))}
        transactions={transactions.map((t) => ({
          id: t.id,
          type: t.type,
          amount: t.amount,
          balanceAfter: t.balanceAfter,
          note: t.note,
          createdAt: t.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
