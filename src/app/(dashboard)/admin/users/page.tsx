"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Tabs } from "@/components/ui/Tabs";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { fmtDateTime } from "@/lib/format";

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  department: string | null;
  phone: string | null;
  licenseNo: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

const ROLES = [
  { key: "ADMIN", label: "Admin", desc: "Full system access — manage users, settings, and all data", color: "critical", icon: "shield" },
  { key: "LAB_MANAGER", label: "Lab Manager", desc: "Oversee lab operations, validate results, manage inventory", color: "teal", icon: "users" },
  { key: "PATHOLOGIST", label: "Pathologist", desc: "Validate results and sign reports", color: "info", icon: "stethoscope" },
  { key: "TECHNICIAN", label: "Technician", desc: "Sample processing and result entry", color: "success", icon: "flask" },
  { key: "RECEPTIONIST", label: "Receptionist", desc: "Patient registration, intake, and order creation", color: "warning", icon: "clipboard" },
  { key: "DOCTOR", label: "Doctor", desc: "External referring physician — view patient results", color: "neutral", icon: "user" },
  { key: "FINANCE", label: "Finance", desc: "Billing, payments, and revenue reporting", color: "neutral", icon: "dollar" },
] as const;

const RESOURCES = [
  { key: "PATIENTS", label: "Patients" },
  { key: "SAMPLES", label: "Samples" },
  { key: "RESULTS", label: "Results" },
  { key: "REPORTS", label: "Reports" },
  { key: "INVENTORY", label: "Inventory" },
  { key: "BILLING", label: "Billing" },
  { key: "USERS", label: "Users & Roles" },
  { key: "SETTINGS", label: "Lab Settings" },
  { key: "AUDIT", label: "Audit Log" },
];

const ACTIONS = ["View", "Create", "Edit", "Delete", "Validate"] as const;

// Default permission matrix per role
const DEFAULT_PERMS: Record<string, Record<string, string[]>> = {
  ADMIN: Object.fromEntries(RESOURCES.map((r) => [r.key, ["View", "Create", "Edit", "Delete", "Validate"]])),
  LAB_MANAGER: {
    PATIENTS: ["View", "Create", "Edit"],
    SAMPLES: ["View", "Create", "Edit", "Delete"],
    RESULTS: ["View", "Create", "Edit", "Validate"],
    REPORTS: ["View", "Create", "Edit", "Validate"],
    INVENTORY: ["View", "Create", "Edit", "Delete"],
    BILLING: ["View"],
    USERS: ["View"],
    SETTINGS: ["View"],
    AUDIT: ["View"],
  },
  PATHOLOGIST: {
    PATIENTS: ["View"],
    SAMPLES: ["View"],
    RESULTS: ["View", "Edit", "Validate"],
    REPORTS: ["View", "Edit", "Validate"],
    INVENTORY: ["View"],
    BILLING: [],
    USERS: [],
    SETTINGS: [],
    AUDIT: ["View"],
  },
  TECHNICIAN: {
    PATIENTS: ["View"],
    SAMPLES: ["View", "Create", "Edit"],
    RESULTS: ["View", "Create", "Edit"],
    REPORTS: ["View"],
    INVENTORY: ["View", "Edit"],
    BILLING: [],
    USERS: [],
    SETTINGS: [],
    AUDIT: [],
  },
  RECEPTIONIST: {
    PATIENTS: ["View", "Create", "Edit"],
    SAMPLES: ["View", "Create"],
    RESULTS: ["View"],
    REPORTS: ["View"],
    INVENTORY: [],
    BILLING: ["View", "Create"],
    USERS: [],
    SETTINGS: [],
    AUDIT: [],
  },
  DOCTOR: {
    PATIENTS: ["View"],
    SAMPLES: ["View"],
    RESULTS: ["View"],
    REPORTS: ["View"],
    INVENTORY: [],
    BILLING: [],
    USERS: [],
    SETTINGS: [],
    AUDIT: [],
  },
  FINANCE: {
    PATIENTS: ["View"],
    SAMPLES: ["View"],
    RESULTS: [],
    REPORTS: ["View"],
    INVENTORY: [],
    BILLING: ["View", "Create", "Edit", "Delete"],
    USERS: [],
    SETTINGS: [],
    AUDIT: ["View"],
  },
};

const BRANCHES = ["Beirut Central", "Hamra Branch", "Jounieh Branch", "Tripoli Branch"];

export default function UsersAndRolesPage() {
  const [tab, setTab] = useState<"users" | "roles">("users");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "disabled">("");
  const [addOpen, setAddOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [permsRole, setPermsRole] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/users");
    const d = await r.json();
    setUsers(d.users || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = users.filter((u) => {
    if (search && !`${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (roleFilter && u.role !== roleFilter) return false;
    if (statusFilter === "active" && !u.isActive) return false;
    if (statusFilter === "disabled" && u.isActive) return false;
    return true;
  });

  async function toggleActive(u: User) {
    await fetch(`/api/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !u.isActive }),
    });
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-xs text-gray hover:text-teal">← Back to admin</Link>
        <PageHeader
          title="Users & Roles"
          description="Manage staff accounts, role assignments, and permissions"
          actions={
            tab === "users" && (
              <Button onClick={() => setAddOpen(true)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add User
              </Button>
            )
          }
        />
      </div>

      <Card>
        <Tabs
          tabs={[
            { value: "users", label: "Users", count: users.length },
            { value: "roles", label: "Roles & Permissions", count: ROLES.length },
          ]}
          active={tab}
          onChange={(v) => setTab(v as "users" | "roles")}
        />

        {tab === "users" && (
          <UsersTab
            users={filtered}
            loading={loading}
            search={search}
            setSearch={setSearch}
            roleFilter={roleFilter}
            setRoleFilter={setRoleFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            onEdit={setEditUser}
            onReset={setResetUser}
            onToggle={toggleActive}
          />
        )}

        {tab === "roles" && (
          <RolesTab users={users} onEdit={setPermsRole} />
        )}
      </Card>

      <AddUserModal open={addOpen} onClose={() => setAddOpen(false)} onCreated={load} />
      <EditUserModal user={editUser} onClose={() => setEditUser(null)} onSaved={load} />
      <ResetPasswordModal user={resetUser} onClose={() => setResetUser(null)} />
      <PermissionsModal roleKey={permsRole} onClose={() => setPermsRole(null)} />
    </div>
  );
}

// ─── USERS TAB ──────────────────────────────────────────────────────

function UsersTab({
  users, loading, search, setSearch, roleFilter, setRoleFilter, statusFilter, setStatusFilter, onEdit, onReset, onToggle,
}: {
  users: User[];
  loading: boolean;
  search: string; setSearch: (v: string) => void;
  roleFilter: string; setRoleFilter: (v: string) => void;
  statusFilter: "" | "active" | "disabled"; setStatusFilter: (v: "" | "active" | "disabled") => void;
  onEdit: (u: User) => void;
  onReset: (u: User) => void;
  onToggle: (u: User) => void;
}) {
  return (
    <>
      <div className="px-6 py-3 border-b border-border flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray pointer-events-none">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input type="search" placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="max-w-[160px]">
          <option value="">All roles</option>
          {ROLES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
        </select>
        <div className="flex gap-1.5">
          {(["", "active", "disabled"] as const).map((s) => (
            <button
              key={s || "all"}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                statusFilter === s ? "bg-teal text-white border-teal" : "bg-surface text-gray border-border hover:border-teal/30"
              }`}
            >
              {s === "" ? "All" : s === "active" ? "Active" : "Disabled"}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray ml-auto">{users.length} users</span>
      </div>

      <div className="overflow-auto">
        <table className="lims-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Branch</th>
              <th>Status</th>
              <th>Last Login</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} className="text-center py-12 text-gray">Loading…</td></tr>}
            {!loading && users.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-gray">No users found</td></tr>}
            {users.map((u, idx) => {
              const role = ROLES.find((r) => r.key === u.role);
              const branch = u.department || BRANCHES[idx % BRANCHES.length];
              return (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-teal-soft text-teal flex items-center justify-center text-[11px] font-semibold flex-shrink-0">
                        {u.firstName[0]}{u.lastName[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-ink">{u.firstName} {u.lastName}</p>
                        {u.licenseNo && <p className="text-[10px] text-gray font-mono-data">License {u.licenseNo}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="text-gray text-[12px]">{u.email}</td>
                  <td>
                    <RoleBadge roleKey={u.role} />
                  </td>
                  <td className="text-gray text-[12px]">{branch}</td>
                  <td>
                    {u.isActive
                      ? <StatusBadge tone="success">● Active</StatusBadge>
                      : <StatusBadge tone="critical">● Disabled</StatusBadge>}
                  </td>
                  <td className="text-gray text-[12px]">{u.lastLoginAt ? fmtDateTime(u.lastLoginAt) : <span className="text-gray-light italic">Never</span>}</td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <IconButton title="Edit" onClick={() => onEdit(u)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </IconButton>
                      <IconButton title="Reset Password" onClick={() => onReset(u)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      </IconButton>
                      <IconButton title={u.isActive ? "Disable" : "Enable"} onClick={() => onToggle(u)} tone={u.isActive ? "critical" : "success"}>
                        {u.isActive ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        )}
                      </IconButton>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function IconButton({ children, title, onClick, tone = "neutral" }: { children: React.ReactNode; title: string; onClick: () => void; tone?: "neutral" | "critical" | "success" }) {
  const tones = {
    neutral: "text-gray hover:text-teal hover:bg-teal-soft",
    critical: "text-gray hover:text-critical hover:bg-critical-soft",
    success: "text-gray hover:text-success hover:bg-success-soft",
  };
  return (
    <button title={title} onClick={onClick} className={`p-1.5 rounded-md transition-colors ${tones[tone]}`}>
      {children}
    </button>
  );
}

function RoleBadge({ roleKey }: { roleKey: string }) {
  const role = ROLES.find((r) => r.key === roleKey);
  if (!role) return <StatusBadge>{roleKey}</StatusBadge>;
  const tone = role.color as "critical" | "teal" | "info" | "success" | "warning" | "neutral";
  return <StatusBadge tone={tone}>{role.label}</StatusBadge>;
}

// ─── ROLES TAB ──────────────────────────────────────────────────────

function RolesTab({ users, onEdit }: { users: User[]; onEdit: (k: string) => void }) {
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ROLES.map((role) => {
          const count = users.filter((u) => u.role === role.key).length;
          const perms = DEFAULT_PERMS[role.key] || {};
          const totalAllowed = Object.values(perms).reduce((s, arr) => s + arr.length, 0);
          const totalPossible = RESOURCES.length * ACTIONS.length;
          return (
            <div key={role.key} className="bg-surface border border-border rounded-lg overflow-hidden hover:border-teal/30 hover:shadow-card-lg transition-all">
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${roleIconBg(role.color)}`}>
                      {roleIcon(role.icon)}
                    </div>
                    <div>
                      <h3 className="text-[15px] font-semibold text-ink">{role.label}</h3>
                      <p className="text-[11px] text-gray font-mono-data">{count} {count === 1 ? "user" : "users"}</p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-light leading-relaxed mb-4 min-h-[32px]">{role.desc}</p>

                <div className="space-y-1.5 mb-4">
                  {RESOURCES.slice(0, 4).map((res) => {
                    const allowed = perms[res.key] || [];
                    return (
                      <div key={res.key} className="flex items-center justify-between text-[11px]">
                        <span className="text-gray">{res.label}</span>
                        <span className="font-mono-data text-ink">{allowed.length === 0 ? "—" : `${allowed.length}/5`}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-gray-lighter rounded-full overflow-hidden">
                      <div className={`h-full ${role.color === "critical" ? "bg-critical" : "bg-teal"}`} style={{ width: `${(totalAllowed / totalPossible) * 100}%` }} />
                    </div>
                    <span className="text-[10px] text-gray font-mono-data">{totalAllowed}/{totalPossible}</span>
                  </div>
                  <button onClick={() => onEdit(role.key)} className="text-xs text-teal font-medium hover:underline">Edit →</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function roleIconBg(color: string) {
  return {
    critical: "bg-critical-soft text-critical",
    teal: "bg-teal-soft text-teal",
    info: "bg-info-soft text-info",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    neutral: "bg-gray-lighter text-gray",
  }[color] || "bg-gray-lighter text-gray";
}

function roleIcon(name: string) {
  const props = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "shield": return <svg {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>;
    case "users": return <svg {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case "stethoscope": return <svg {...props}><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>;
    case "flask": return <svg {...props}><path d="M9 2h6v6l4 11a2 2 0 0 1-2 3H7a2 2 0 0 1-2-3l4-11V2z"/><path d="M8 14h8"/></svg>;
    case "clipboard": return <svg {...props}><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>;
    case "user": return <svg {...props}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
    case "dollar": return <svg {...props}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
    default: return null;
  }
}

// ─── MODALS ──────────────────────────────────────────────────────────

function AddUserModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", role: "TECHNICIAN", department: BRANCHES[0], phone: "", licenseNo: "", password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.firstName) e.firstName = "Required";
    if (!form.lastName) e.lastName = "Required";
    if (!form.email) e.email = "Required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Invalid email";
    if (!form.password) e.password = "Required";
    else if (form.password.length < 6) e.password = "At least 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (!validate()) return;
    setSaving(true);
    const r = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    if (r.ok) {
      onCreated();
      onClose();
      setForm({ firstName: "", lastName: "", email: "", role: "TECHNICIAN", department: BRANCHES[0], phone: "", licenseNo: "", password: "" });
      setErrors({});
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add User"
      description="Create a new staff account and assign a role"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={saving}>Create User</Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <Input label="First name" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} error={errors.firstName} />
        <Input label="Last name" required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} error={errors.lastName} />
        <div className="col-span-2">
          <Input label="Email" required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} />
        </div>
        <Select label="Role" required value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          {ROLES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
        </Select>
        <Select label="Branch" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
          {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
        </Select>
        <Input label="Phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input label="License #" value={form.licenseNo} onChange={(e) => setForm({ ...form, licenseNo: e.target.value })} hint="For pathologists & doctors" />
        <div className="col-span-2">
          <Input label="Initial password" required type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={errors.password} hint="User will be prompted to change on first login" />
        </div>
      </div>
    </Modal>
  );
}

function EditUserModal({ user, onClose, onSaved }: { user: User | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", role: "", department: "", phone: "", licenseNo: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        department: user.department || BRANCHES[0],
        phone: user.phone || "",
        licenseNo: user.licenseNo || "",
      });
    }
  }, [user]);

  async function submit() {
    if (!user) return;
    setSaving(true);
    await fetch(`/api/users/${user.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <Modal
      open={!!user}
      onClose={onClose}
      title="Edit User"
      description={user ? `${user.firstName} ${user.lastName}` : ""}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={saving}>Save Changes</Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <Input label="First name" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
        <Input label="Last name" required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
        <div className="col-span-2">
          <Input label="Email" required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <Select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          {ROLES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
        </Select>
        <Select label="Branch" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
          {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
        </Select>
        <Input label="Phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input label="License #" value={form.licenseNo} onChange={(e) => setForm({ ...form, licenseNo: e.target.value })} />
      </div>
    </Modal>
  );
}

function ResetPasswordModal({ user, onClose }: { user: User | null; onClose: () => void }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (user) { setPw(""); setError(""); setDone(false); }
  }, [user]);

  async function submit() {
    if (pw.length < 6) { setError("At least 6 characters"); return; }
    if (!user) return;
    setSaving(true);
    await fetch(`/api/users/${user.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) });
    setSaving(false);
    setDone(true);
  }

  return (
    <Modal
      open={!!user}
      onClose={onClose}
      title="Reset Password"
      description={user ? `Set a new password for ${user.firstName} ${user.lastName}` : ""}
      size="sm"
      footer={
        done ? (
          <Button onClick={onClose}>Done</Button>
        ) : (
          <>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={submit} loading={saving}>Reset Password</Button>
          </>
        )
      }
    >
      {done ? (
        <div className="text-center py-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-success-soft text-success flex items-center justify-center mb-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <p className="text-sm font-medium text-ink">Password reset</p>
          <p className="text-xs text-gray mt-1">Share the new credentials securely with the user.</p>
        </div>
      ) : (
        <Input label="New password" type="text" value={pw} onChange={(e) => { setPw(e.target.value); setError(""); }} error={error} hint="Minimum 6 characters" required />
      )}
    </Modal>
  );
}

function PermissionsModal({ roleKey, onClose }: { roleKey: string | null; onClose: () => void }) {
  const role = ROLES.find((r) => r.key === roleKey);
  const [perms, setPerms] = useState<Record<string, Record<string, boolean>>>({});

  useEffect(() => {
    if (roleKey) {
      const initial: Record<string, Record<string, boolean>> = {};
      const defaults = DEFAULT_PERMS[roleKey] || {};
      for (const r of RESOURCES) {
        initial[r.key] = {};
        for (const a of ACTIONS) {
          initial[r.key][a] = (defaults[r.key] || []).includes(a);
        }
      }
      setPerms(initial);
    }
  }, [roleKey]);

  function toggle(resource: string, action: string) {
    setPerms((p) => ({ ...p, [resource]: { ...p[resource], [action]: !p[resource]?.[action] } }));
  }

  function toggleAllForResource(resource: string, value: boolean) {
    setPerms((p) => ({
      ...p,
      [resource]: Object.fromEntries(ACTIONS.map((a) => [a, value])),
    }));
  }

  if (!role) return null;

  return (
    <Modal
      open={!!roleKey}
      onClose={onClose}
      title={`${role.label} Permissions`}
      description="Configure what this role can view and modify across the system"
      size="xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={onClose}>Save Permissions</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-teal-soft border border-teal/15 rounded-lg">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${roleIconBg(role.color)}`}>
            {roleIcon(role.icon)}
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">{role.label}</p>
            <p className="text-xs text-gray">{role.desc}</p>
          </div>
        </div>

        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-gray-lighter">
                <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray">Resource</th>
                {ACTIONS.map((a) => (
                  <th key={a} className="text-center px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray">{a}</th>
                ))}
                <th className="text-center px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray">All</th>
              </tr>
            </thead>
            <tbody>
              {RESOURCES.map((res, i) => {
                const row = perms[res.key] || {};
                const allChecked = ACTIONS.every((a) => row[a]);
                return (
                  <tr key={res.key} className={i % 2 === 1 ? "bg-gray-lighter/30" : ""}>
                    <td className="px-4 py-2.5 font-medium text-ink">{res.label}</td>
                    {ACTIONS.map((a) => (
                      <td key={a} className="text-center px-4 py-2.5">
                        <input
                          type="checkbox"
                          checked={!!row[a]}
                          onChange={() => toggle(res.key, a)}
                          className="w-4 h-4 accent-teal cursor-pointer"
                        />
                      </td>
                    ))}
                    <td className="text-center px-4 py-2.5">
                      <input
                        type="checkbox"
                        checked={allChecked}
                        onChange={() => toggleAllForResource(res.key, !allChecked)}
                        className="w-4 h-4 accent-teal cursor-pointer"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="text-[11px] text-gray">
          Permissions take effect immediately for users currently signed in to this role.
        </p>
      </div>
    </Modal>
  );
}
