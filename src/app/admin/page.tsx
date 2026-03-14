import { AdminPanel } from '@/features/admin/components/AdminPanel'

// ═══════════════════════════════════════════════════════════════
//  /admin  — Admin panel entry point
//  Auth + role guard is enforced in middleware + layout.
//  This page is just a thin wrapper for the client component.
// ═══════════════════════════════════════════════════════════════

export default function AdminPage() {
  return <AdminPanel />
}
