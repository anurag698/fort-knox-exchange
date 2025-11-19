// ======================================================
// Wallet System (Simple Prototype)
// ======================================================

type Balances = Record<string, number>;

const userBalances: Record<string, Balances> = {};

export function getBalance(userId: string, coin: string): number {
  return userBalances[userId]?.[coin] ?? 0;
}

export function credit(userId: string, coin: string, amount: number) {
  if (!userBalances[userId]) userBalances[userId] = {};
  if (!userBalances[userId][coin]) userBalances[userId][coin] = 0;
  userBalances[userId][coin] += amount;
}

export function debit(userId: string, coin: string, amount: number) {
  if (!userBalances[userId]) userBalances[userId] = {};
  if (!userBalances[userId][coin]) userBalances[userId][coin] = 0;
  userBalances[userId][coin] -= amount;
}
