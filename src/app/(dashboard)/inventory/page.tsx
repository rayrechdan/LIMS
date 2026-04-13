"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { fmtDate } from "@/lib/format";

type Item = {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  minStock: number;
  currentStock: number;
  supplier: string | null;
  lots: { id: string; lotNumber: string; quantity: number; expiryDate: string | null }[];
};

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/inventory");
    const d = await r.json();
    setItems(d.items || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter ? items.filter((i) => i.category === filter) : items;
  const lowStock = items.filter((i) => i.currentStock <= i.minStock).length;
  const expiringSoon = items.flatMap((i) => i.lots).filter((l) => {
    if (!l.expiryDate) return false;
    const days = (new Date(l.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return days < 30 && days >= 0;
  }).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Reagents, consumables, and lot tracking"
        actions={<Button onClick={() => setOpen(true)}>+ New Item</Button>}
      />

      <div className="grid grid-cols-3 gap-4">
        <Card><div className="p-5"><p className="text-[11px] uppercase tracking-wider text-gray font-semibold">Total Items</p><p className="text-2xl font-semibold text-ink mt-2 font-mono-data">{items.length}</p></div></Card>
        <Card><div className="p-5"><p className="text-[11px] uppercase tracking-wider text-gray font-semibold">Low Stock</p><p className="text-2xl font-semibold text-warning mt-2 font-mono-data">{lowStock}</p></div></Card>
        <Card><div className="p-5"><p className="text-[11px] uppercase tracking-wider text-gray font-semibold">Expiring &lt; 30d</p><p className="text-2xl font-semibold text-critical mt-2 font-mono-data">{expiringSoon}</p></div></Card>
      </div>

      <Card>
        <div className="px-6 py-3 border-b border-border flex items-center gap-2">
          {["", "REAGENT", "CONSUMABLE", "EQUIPMENT"].map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                filter === c ? "bg-teal text-white border-teal" : "bg-surface text-gray border-border hover:border-teal/30"
              }`}
            >
              {c || "All"}
            </button>
          ))}
          <span className="text-xs text-gray ml-auto">{filtered.length} items</span>
        </div>
        <div className="overflow-auto">
          <table className="lims-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Name</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Unit</th>
                <th>Min</th>
                <th>Lots</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} className="text-center py-10 text-gray">Loading…</td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan={8} className="text-center py-10 text-gray">No items</td></tr>}
              {filtered.map((i) => {
                const low = i.currentStock <= i.minStock;
                const earliest = i.lots.find((l) => l.expiryDate)?.expiryDate;
                return (
                  <tr key={i.id}>
                    <td className="font-mono-data text-[12px] text-teal">{i.sku}</td>
                    <td className="font-medium">{i.name}</td>
                    <td className="text-gray text-[12px]">{i.category}</td>
                    <td className="font-mono-data text-ink">{i.currentStock}</td>
                    <td className="text-gray text-[12px]">{i.unit}</td>
                    <td className="font-mono-data text-[12px] text-gray">{i.minStock}</td>
                    <td className="text-[12px]">
                      {i.lots.length} {earliest && <span className="text-gray ml-1">· exp {fmtDate(earliest)}</span>}
                    </td>
                    <td>
                      {low ? <StatusBadge tone="warning">Low Stock</StatusBadge> : <StatusBadge tone="success">OK</StatusBadge>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <NewItemModal open={open} onClose={() => setOpen(false)} onCreated={load} />
    </div>
  );
}

function NewItemModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ sku: "", name: "", category: "REAGENT", unit: "mL", minStock: "0", currentStock: "0", supplier: "" });
  const [saving, setSaving] = useState(false);
  async function submit() {
    setSaving(true);
    await fetch("/api/inventory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    onCreated(); onClose();
    setForm({ sku: "", name: "", category: "REAGENT", unit: "mL", minStock: "0", currentStock: "0", supplier: "" });
  }
  return (
    <Modal open={open} onClose={onClose} title="New Inventory Item" size="md" footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={submit} loading={saving}>Create</Button></>}>
      <div className="grid grid-cols-2 gap-4">
        <Input label="SKU" required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
        <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          <option value="REAGENT">Reagent</option>
          <option value="CONSUMABLE">Consumable</option>
          <option value="EQUIPMENT">Equipment</option>
        </Select>
        <div className="col-span-2"><Input label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <Input label="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
        <Input label="Supplier" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
        <Input label="Current stock" type="number" value={form.currentStock} onChange={(e) => setForm({ ...form, currentStock: e.target.value })} />
        <Input label="Min stock" type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} />
      </div>
    </Modal>
  );
}
