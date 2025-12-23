import ProtectedRoute from '@/components/auth/ProtectedRoute';
export default function PaymentsPage() {
  return (
     <ProtectedRoute>
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">
        Payments & SMS Credits
      </h1>
      <p className="text-sm text-slate-400">
        Track Razorpay subscriptions, invoices and SMS top-ups.
      </p>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <p className="text-sm text-slate-400">
          (Future: list of latest Razorpay events / PaymentEvent.)
        </p>
      </div>
    </div>
    </ProtectedRoute>
  );
}
