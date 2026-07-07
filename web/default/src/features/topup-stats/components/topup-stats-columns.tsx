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
import type { ColumnDef } from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'

import { StatusBadge, type StatusVariant } from '@/components/status-badge'
import { formatQuota, formatTimestamp } from '@/lib/format'

import type { TopUpRecord } from '../types'

const STATUS_VARIANT: Record<string, StatusVariant> = {
  success: 'success',
  pending: 'warning',
  failed: 'danger',
  expired: 'neutral',
}

const STATUS_LABEL: Record<string, string> = {
  success: 'Success',
  pending: 'Awaiting Payment',
  failed: 'Failed',
  expired: 'Expired',
}

export function useTopUpStatsColumns(): ColumnDef<TopUpRecord>[] {
  const { t } = useTranslation()

  return [
    {
      accessorKey: 'user_id',
      header: t('User ID'),
      cell: ({ row }) => row.original.user_id,
    },
    {
      accessorKey: 'trade_no',
      header: t('Trade No'),
      cell: ({ row }) => row.original.trade_no,
    },
    {
      accessorKey: 'payment_method',
      header: t('Payment Method'),
      cell: ({ row }) => row.original.payment_method || '-',
    },
    {
      accessorKey: 'amount',
      header: t('Credited Quota'),
      cell: ({ row }) => formatQuota(row.original.amount),
    },
    {
      accessorKey: 'money',
      header: t('Paid Amount'),
      cell: ({ row }) => `¥${row.original.money.toFixed(2)}`,
    },
    {
      accessorKey: 'status',
      header: t('Status'),
      cell: ({ row }) => (
        <StatusBadge
          label={t(STATUS_LABEL[row.original.status] ?? row.original.status)}
          variant={STATUS_VARIANT[row.original.status] ?? 'neutral'}
          copyable={false}
        />
      ),
    },
    {
      accessorKey: 'create_time',
      header: t('Created At'),
      cell: ({ row }) => formatTimestamp(row.original.create_time),
    },
    {
      accessorKey: 'complete_time',
      header: t('Completed At'),
      cell: ({ row }) =>
        row.original.complete_time
          ? formatTimestamp(row.original.complete_time)
          : '-',
    },
  ]
}
