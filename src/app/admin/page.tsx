export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        Overview
      </h1>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs uppercase text-slate-400">Active Businesses</p>
          <p className="mt-2 text-2xl font-semibold">24</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs uppercase text-slate-400">Active Offers</p>
          <p className="mt-2 text-2xl font-semibold">132</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs uppercase text-slate-400">Trials Running</p>
          <p className="mt-2 text-2xl font-semibold">11</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs uppercase text-slate-400">SMS Credits Used</p>
          <p className="mt-2 text-2xl font-semibold">4,320</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-sm font-medium mb-3">Recent businesses</h2>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>⭐️ Kiran Electronics (Mumbai)</li>
            <li>🛍️ Trendy Mart (Pune)</li>
            <li>🏥 HealthCare Plus (Nagpur)</li>
          </ul>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-sm font-medium mb-3">Recent issues</h2>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>• SMS DLT error for 2 businesses</li>
            <li>• Display screen not refreshing (1 shop)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
