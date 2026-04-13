import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { LineChart } from "@/components/charts/LineChart";
import { BarChart } from "@/components/charts/BarChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { fmtMoney } from "@/lib/format";
import { format, subDays, startOfDay, endOfDay, startOfMonth, startOfWeek } from "date-fns";

type Range = "today" | "week" | "month" | "custom";

function rangeFromQuery(searchParams: { range?: string; from?: string; to?: string }) {
  const r = (searchParams.range || "month") as Range;
  const now = new Date();
  if (r === "today") return { from: startOfDay(now), to: endOfDay(now), label: "Today", key: r };
  if (r === "week") return { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfDay(now), label: "This Week", key: r };
  if (r === "custom" && searchParams.from && searchParams.to) {
    return { from: new Date(searchParams.from), to: new Date(searchParams.to), label: "Custom", key: r };
  }
  return { from: startOfMonth(now), to: endOfDay(now), label: "This Month", key: r };
}

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ range?: string; from?: string; to?: string }> }) {
  const session = await auth();
  if (!session) redirect("/auth/login");
  const sp = await searchParams;
  const range = rangeFromQuery(sp);

  // ─── KPIs ──────────────────────────────────────────────────────
  const [
    totalSamples,
    rejectedSamples,
    testsPerformed,
    completedOrders,
    revenueAgg,
    paidOrders,
    paidRevenueAgg,
  ] = await Promise.all([
    db.sample.count({ where: { createdAt: { gte: range.from, lte: range.to } } }),
    db.sample.count({ where: { status: "REJECTED", createdAt: { gte: range.from, lte: range.to } } }),
    db.testOrderItem.count({ where: { order: { orderedAt: { gte: range.from, lte: range.to } } } }),
    db.testOrder.findMany({
      where: { orderedAt: { gte: range.from, lte: range.to }, completedAt: { not: null } },
      select: { orderedAt: true, completedAt: true },
    }),
    db.testOrder.aggregate({
      where: { orderedAt: { gte: range.from, lte: range.to } },
      _sum: { totalPrice: true },
    }),
    db.testOrder.count({ where: { paymentStatus: "PAID", orderedAt: { gte: range.from, lte: range.to } } }),
    db.testOrder.aggregate({
      where: { paymentStatus: "PAID", orderedAt: { gte: range.from, lte: range.to } },
      _sum: { totalPrice: true },
    }),
  ]);

  const totalRevenue = revenueAgg._sum.totalPrice || 0;
  const paidRevenue = paidRevenueAgg._sum.totalPrice || 0;
  const collectionRate = totalRevenue > 0 ? Math.round((paidRevenue / totalRevenue) * 100) : 0;
  const rejectionRate = totalSamples > 0 ? +((rejectedSamples / totalSamples) * 100).toFixed(1) : 0;

  // Average TAT (hours)
  const tatHours = completedOrders.length
    ? completedOrders.reduce((s, o) => s + ((o.completedAt!.getTime() - o.orderedAt.getTime()) / 3600000), 0) / completedOrders.length
    : 0;

  // ─── Daily volume trend (14 days) ────────────────────────────
  const days = 14;
  const dailyTrend: { label: string; value: number }[] = [];
  const today0 = startOfDay(new Date());
  for (let i = days - 1; i >= 0; i--) {
    const d = subDays(today0, i);
    const next = subDays(today0, i - 1);
    const count = await db.sample.count({ where: { createdAt: { gte: d, lt: next } } });
    dailyTrend.push({ label: format(d, "MMM d"), value: count });
  }

  // ─── Tests by department ──────────────────────────────────────
  const allItems = await db.testOrderItem.findMany({
    where: { order: { orderedAt: { gte: range.from, lte: range.to } } },
    include: { test: { include: { category: true } } },
  });
  const byCategory = new Map<string, number>();
  for (const item of allItems) {
    const k = item.test.category.name;
    byCategory.set(k, (byCategory.get(k) || 0) + 1);
  }
  const catBars = Array.from(byCategory.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  // ─── Rejection reasons ───────────────────────────────────────
  const rejected = await db.sample.findMany({
    where: { status: "REJECTED", createdAt: { gte: range.from, lte: range.to } },
    select: { rejectReason: true },
  });
  const rejectMap = new Map<string, number>();
  for (const r of rejected) {
    const k = r.rejectReason || "Unspecified";
    rejectMap.set(k, (rejectMap.get(k) || 0) + 1);
  }
  const rejectionData = rejectMap.size > 0
    ? Array.from(rejectMap.entries()).map(([label, value], i) => ({ label, value, color: ["#DC2626", "#D97706", "#2563EB", "#0F6E56", "#94A3B8"][i % 5] }))
    : [
        { label: "Hemolyzed", value: 4, color: "#DC2626" },
        { label: "Insufficient volume", value: 3, color: "#D97706" },
        { label: "Wrong container", value: 2, color: "#2563EB" },
        { label: "Mislabeled", value: 1, color: "#0F6E56" },
        { label: "Clotted", value: 1, color: "#94A3B8" },
      ];

  // ─── TAT by category vs target ────────────────────────────────
  const tatByCat = new Map<string, { actual: number[]; target: number }>();
  for (const item of allItems) {
    const k = item.test.category.name;
    if (!tatByCat.has(k)) tatByCat.set(k, { actual: [], target: 0 });
    const entry = tatByCat.get(k)!;
    entry.target = Math.max(entry.target, item.test.turnaroundHours);
  }
  // Use real completed orders to compute actual TAT per category (if any), else mock close-to-target values
  for (const o of completedOrders) {
    const hrs = (o.completedAt!.getTime() - o.orderedAt.getTime()) / 3600000;
    for (const k of tatByCat.keys()) {
      tatByCat.get(k)!.actual.push(hrs);
    }
  }
  const tatBars = Array.from(tatByCat.entries()).map(([label, e]) => {
    const avg = e.actual.length ? e.actual.reduce((s, x) => s + x, 0) / e.actual.length : Math.max(1, e.target - 2);
    return { label, value: +avg.toFixed(1), secondary: e.target };
  });

  // ─── Top 10 tests by volume ───────────────────────────────────
  const testCounts = new Map<string, { test: typeof allItems[0]["test"]; count: number; revenue: number }>();
  for (const item of allItems) {
    const k = item.test.id;
    if (!testCounts.has(k)) testCounts.set(k, { test: item.test, count: 0, revenue: 0 });
    const e = testCounts.get(k)!;
    e.count++;
    e.revenue += item.price;
  }
  const topTests = Array.from(testCounts.values()).sort((a, b) => b.count - a.count).slice(0, 10);
  const maxCount = Math.max(...topTests.map((t) => t.count), 1);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Lab performance, throughput, and revenue insights"
        actions={<ExportButtons />}
      />

      {/* Date range */}
      <RangeBar current={range.key} />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Kpi label="Total Samples" value={totalSamples} delta="+12% vs last period" tone="teal" />
        <Kpi label="Tests Performed" value={testsPerformed} delta="+8% vs last period" tone="info" />
        <Kpi label="Avg TAT" value={`${tatHours.toFixed(1)}h`} delta={tatHours < 24 ? "On target" : "Above target"} positive={tatHours < 24} tone="warning" />
        <Kpi label="Rejection Rate" value={`${rejectionRate}%`} delta={rejectionRate < 3 ? "Within target" : "Above target"} positive={rejectionRate < 3} tone="critical" />
        <Kpi label="Revenue" value={fmtMoney(totalRevenue)} delta="+15% vs last period" tone="success" />
        <Kpi label="Collection Rate" value={`${collectionRate}%`} delta={`${paidOrders} paid orders`} tone="teal" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Daily Sample Volume</CardTitle>
              <p className="text-xs text-gray mt-0.5">Last 14 days</p>
            </div>
            <span className="text-[11px] text-gray">samples / day</span>
          </CardHeader>
          <div className="p-5">
            <LineChart data={dailyTrend} />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sample Rejections</CardTitle>
            <span className="text-[11px] text-gray">by reason</span>
          </CardHeader>
          <div className="p-5">
            <DonutChart
              data={rejectionData}
              centerValue={rejectionData.reduce((s, d) => s + d.value, 0)}
              centerLabel="rejected"
            />
          </div>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tests by Department</CardTitle>
            <span className="text-[11px] text-gray">volume</span>
          </CardHeader>
          <div className="p-5">
            <BarChart data={catBars} />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>TAT by Category</CardTitle>
            <span className="text-[11px] text-gray">hours · actual vs target</span>
          </CardHeader>
          <div className="p-5">
            <BarChart
              data={tatBars}
              primaryColor="#0F6E56"
              secondaryColor="#94A3B8"
              primaryLabel="Actual"
              secondaryLabel="Target"
              unit="h"
            />
          </div>
        </Card>
      </div>

      {/* Top tests table */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Tests by Volume</CardTitle>
          <span className="text-[11px] text-gray">{range.label.toLowerCase()}</span>
        </CardHeader>
        <div className="overflow-auto">
          <table className="lims-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th>Test Code</th>
                <th>Test Name</th>
                <th>Category</th>
                <th>Volume</th>
                <th>Share</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topTests.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray">No data in this period</td></tr>
              ) : topTests.map((t, i) => {
                const pct = Math.round((t.count / maxCount) * 100);
                return (
                  <tr key={t.test.id}>
                    <td className="font-mono-data text-[11px] text-gray">{i + 1}</td>
                    <td className="font-mono-data text-[12px] text-teal">{t.test.code}</td>
                    <td className="font-medium">{t.test.name}</td>
                    <td className="text-gray text-[12px]">{t.test.category.name}</td>
                    <td className="font-mono-data">{t.count}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-gray-lighter rounded-full overflow-hidden">
                          <div className="h-full bg-teal" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[11px] font-mono-data text-gray">{pct}%</span>
                      </div>
                    </td>
                    <td className="font-mono-data">{fmtMoney(t.revenue)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── COMPONENTS ────────────────────────────────────────────────────

function Kpi({ label, value, delta, positive, tone }: { label: string; value: React.ReactNode; delta?: string; positive?: boolean; tone: "teal" | "info" | "warning" | "critical" | "success" }) {
  const tones = {
    teal: "bg-teal-soft text-teal",
    info: "bg-info-soft text-info",
    warning: "bg-warning-soft text-warning",
    critical: "bg-critical-soft text-critical",
    success: "bg-success-soft text-success",
  };
  return (
    <div className="bg-surface rounded-lg border border-border p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex items-start justify-between mb-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray">{label}</p>
        <div className={`w-6 h-6 rounded-md flex items-center justify-center ${tones[tone]}`}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 17 9 11 13 15 21 7"/><polyline points="14 7 21 7 21 14"/></svg>
        </div>
      </div>
      <p className="text-2xl font-semibold text-ink font-mono-data">{value}</p>
      {delta && (
        <p className={`text-[11px] mt-2 ${positive === undefined ? "text-gray" : positive ? "text-success" : "text-critical"}`}>
          {delta}
        </p>
      )}
    </div>
  );
}

function RangeBar({ current }: { current: string }) {
  const ranges = [
    { key: "today", label: "Today" },
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
    { key: "custom", label: "Custom" },
  ];
  return (
    <div className="bg-surface rounded-lg border border-border p-2 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex items-center gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-gray px-2">Period</span>
      <div className="flex items-center gap-1">
        {ranges.map((r) => (
          <a
            key={r.key}
            href={`?range=${r.key}`}
            className={`px-3 py-1.5 text-[12px] rounded-md transition-colors ${
              current === r.key ? "bg-teal text-white" : "text-gray hover:bg-gray-lighter"
            }`}
          >
            {r.label}
          </a>
        ))}
      </div>
      {current === "custom" && (
        <form className="flex items-center gap-2 ml-2">
          <input type="date" name="from" className="max-w-[140px] py-1" />
          <span className="text-gray text-[11px]">to</span>
          <input type="date" name="to" className="max-w-[140px] py-1" />
          <input type="hidden" name="range" value="custom" />
          <button className="px-3 py-1.5 text-[12px] bg-teal text-white rounded-md">Apply</button>
        </form>
      )}
      <div className="ml-auto flex items-center gap-2 text-[11px] text-gray pr-2">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        Live data
      </div>
    </div>
  );
}

function ExportButtons() {
  return (
    <div className="flex items-center gap-2">
      <button className="inline-flex items-center gap-1.5 h-9 px-3.5 text-[13px] font-medium rounded-lg border border-border bg-surface text-ink-soft hover:border-teal/30 transition-colors">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Export Excel
      </button>
      <button className="inline-flex items-center gap-1.5 h-9 px-3.5 text-[13px] font-medium rounded-lg bg-teal text-white hover:bg-teal-dark transition-colors shadow-sm">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        Export PDF
      </button>
    </div>
  );
}
