import { useEffect, useState } from "react";
import AppShell from "../components/layout/AppShell.jsx";
import Button from "../components/common/Button.jsx";
import Input from "../components/common/Input.jsx";
import Alert from "../components/common/Alert.jsx";
import Spinner from "../components/common/Spinner.jsx";
import * as paymentsService from "../services/payments.service.js";

const TXN_LABEL = {
  topup: "Top-up",
  withdrawal: "Withdrawal",
  ride_payment: "Ride payment",
  ride_earning: "Ride earning",
  platform_fee: "Platform fee",
  refund: "Refund",
};
// Money coming IN is green, going OUT is plain — instant scanability
const INCOMING = new Set(["topup", "ride_earning", "refund"]);

export default function Wallet() {
  const [wallet, setWallet] = useState(null);
  const [txns, setTxns] = useState([]);
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState(null); // "topup" | "withdraw" | null
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const [{ wallet }, { transactions }] = await Promise.all([
        paymentsService.getWallet(),
        paymentsService.getTransactions(),
      ]);
      setWallet(wallet);
      setTxns(transactions);
    } catch (err) {
      setError(err.message);
    }
  };
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return setError("Enter a valid amount");
    setError(""); setBusy(true);
    try {
      if (mode === "topup") await paymentsService.topup(value);
      else await paymentsService.withdraw(value);
      setAmount(""); setMode(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!wallet) return <AppShell>{error ? <Alert>{error}</Alert> : <Spinner full />}</AppShell>;

  return (
    <AppShell wide>
      <h1 className="text-2xl font-bold">Wallet</h1>

      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[400px,1fr]">
      <div>
      {/* Balance card */}
      <div className="rounded-2xl bg-brand-600 p-6 text-white shadow-md">
        <p className="text-sm font-medium text-brand-100">Available balance</p>
        <p className="mt-1 text-4xl font-bold">Rs {Number(wallet.balance).toFixed(2)}</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant={mode === "topup" ? "primary" : "secondary"} onClick={() => setMode("topup")}>
          Add money
        </Button>
        <Button variant={mode === "withdraw" ? "primary" : "secondary"} onClick={() => setMode("withdraw")}>
          Withdraw
        </Button>
      </div>

      {mode && (
        <form onSubmit={submit} className="mt-3 space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <Input label={mode === "topup" ? "Amount to add (Rs)" : "Amount to withdraw (Rs)"}
            type="number" min="1" step="1" value={amount}
            onChange={(e) => setAmount(e.target.value)} placeholder="500" autoFocus />
          <Alert>{error}</Alert>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" type="button" onClick={() => { setMode(null); setError(""); }}>Cancel</Button>
            <Button type="submit" loading={busy}>{mode === "topup" ? "Add money" : "Withdraw"}</Button>
          </div>
          {mode === "topup" && (
            <p className="text-xs text-gray-400">
              Dev mode: credits instantly. Razorpay checkout plugs in here for production.
            </p>
          )}
        </form>
      )}
      {!mode && <div className="mt-3"><Alert>{error}</Alert></div>}

      </div>

      {/* Transaction history */}
      <div>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 lg:mt-0">History</h2>
      <ul className="mt-2 space-y-2">
        {txns.length === 0 && <li className="text-sm text-gray-500">No transactions yet.</li>}
        {txns.map((t) => (
          <li key={t.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3">
            <div>
              <p className="text-sm font-semibold">{TXN_LABEL[t.type] || t.type}</p>
              <p className="text-xs text-gray-400">
                {new Date(t.created_at).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                {" - "}{t.status}
              </p>
            </div>
            <p className={`font-bold ${INCOMING.has(t.type) ? "text-brand-600" : "text-gray-900"}`}>
              {INCOMING.has(t.type) ? "+" : "-"} Rs {Number(t.amount).toFixed(2)}
            </p>
          </li>
        ))}
      </ul>
      </div>
      </div>
    </AppShell>
  );
}
