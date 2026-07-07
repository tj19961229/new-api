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
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { Skeleton } from '@/components/ui/skeleton'
import { formatQuota } from '@/lib/format'
import { cn } from '@/lib/utils'

import { getTopUpStats } from '../api'
import type { GetTopUpRecordsParams, TopUpStats } from '../types'

const DEFAULT_STATS: TopUpStats = {
  total_count: 0,
  success_count: 0,
  total_money: 0,
  total_amount: 0,
}

export interface TopUpStatsSummaryProps {
  params: GetTopUpRecordsParams
}

function StatBadge(props: {
  label: string
  value: string | number
  accent: string
}) {
  return (
    <span className='border-border/60 bg-muted/25 inline-flex h-7 items-center gap-2 rounded-md border px-2.5 text-xs shadow-xs'>
      <span className={cn('h-3.5 w-0.5 rounded-full', props.accent)} />
      <span className='text-muted-foreground'>{props.label}</span>
      <span className='text-foreground/85 font-mono font-semibold tabular-nums'>
        {props.value}
      </span>
    </span>
  )
}

export function TopUpStatsSummary(props: TopUpStatsSummaryProps) {
  const { t } = useTranslation()

  const { data, isLoading } = useQuery({
    queryKey: ['topup-stats-summary', props.params],
    queryFn: async () => {
      const result = await getTopUpStats(props.params)
      return result.success ? (result.data ?? DEFAULT_STATS) : DEFAULT_STATS
    },
    placeholderData: (previousData) => previousData,
  })

  if (isLoading || !data) {
    return (
      <div className='flex items-center gap-2'>
        <Skeleton className='h-7 w-[100px] rounded-md' />
        <Skeleton className='h-7 w-[100px] rounded-md' />
        <Skeleton className='h-7 w-[140px] rounded-md' />
        <Skeleton className='h-7 w-[140px] rounded-md' />
      </div>
    )
  }

  return (
    <div className='flex flex-wrap items-center gap-2'>
      <StatBadge
        label={t('Total Count')}
        value={data.total_count}
        accent='bg-chart-1'
      />
      <StatBadge
        label={t('Success Count')}
        value={data.success_count}
        accent='bg-success'
      />
      <StatBadge
        label={t('Total Paid Amount')}
        value={`¥${data.total_money.toFixed(2)}`}
        accent='bg-chart-2'
      />
      <StatBadge
        label={t('Total Credited Quota')}
        value={formatQuota(data.total_amount)}
        accent='bg-chart-4'
      />
    </div>
  )
}
