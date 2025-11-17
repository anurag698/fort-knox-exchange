"use client";

import { useEffect, useState } from "react";

export default function PendingTxPage() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    try {
      const res = await fetch("/api/safe/pending");
      const data = await res.json();
      setPending(data.txs || []);
      setLoading(false);
    } catch (e) {
      console.log(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ fontSize: 24 }}>Pending Safe Transactions</h1>

      {loading && <p>Loading…</p>}

      {!loading && pending.length === 0 && <p>No pending transactions</p>}

      {pending.map((tx: any, idx: number) => (
        <div key={idx} style={{
          border: "1px solid #ccc",
          borderRadius: 8,
          padding: 16,
          marginBottom: 12
        }}>
          <p><b>Safe Tx Hash:</b> {tx.safeTxHash}</p>
          <p><b>To:</b> {tx.to}</p>
          <p><b>Value:</b> {tx.value}</p>
          <p><b>Data:</b> {tx.data?.substring(0, 20)}...</p>
          <p><b>Confirmations:</b> {tx.confirmations?.length || 0}/2</p>

          <button
            onClick={() => window.open(`https://app.safe.global/transactions/${tx.safeTxHash}`, "_blank")}
            style={{
              padding: "8px 16px",
              marginTop: 10,
              borderRadius: 6,
              background: "#4f46e5",
              color: "#fff",
              border: "none"
            }}
          >
            Review & Sign in Safe
          </button>
        </div>
      ))}
    </div>
  );
}
