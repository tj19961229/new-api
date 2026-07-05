/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { createFileRoute, redirect } from '@tanstack/react-router'

import { BILLING_DEFAULT_SECTION } from '@/features/system-settings/billing/section-registry.tsx'
import { ROLE } from '@/lib/roles'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute(
  '/_authenticated/system-settings/billing/'
)({
  beforeLoad: () => {
    // billing 的默认 section(quota)是 root-only,受限 admin 落到它会被
    // $section 守卫踢到 /403。故按角色分流:非 root 落到可见的定价页。
    const { auth } = useAuthStore.getState()
    const isRoot = (auth.user?.role ?? 0) >= ROLE.SUPER_ADMIN
    throw redirect({
      to: '/system-settings/billing/$section',
      params: { section: isRoot ? BILLING_DEFAULT_SECTION : 'model-pricing' },
    })
  },
})
