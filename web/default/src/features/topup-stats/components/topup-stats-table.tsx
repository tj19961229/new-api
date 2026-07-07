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
import { getRouteApi } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { DataTablePage, useDataTable } from '@/components/data-table'
import { useMediaQuery } from '@/hooks'
import { useTableUrlState } from '@/hooks/use-table-url-state'

import { getTopUpRecords } from '../api'
import type { GetTopUpRecordsParams } from '../types'
import { TopUpStatsFilterBar } from './topup-stats-filter-bar'
import { useTopUpStatsColumns } from './topup-stats-columns'
import { TopUpStatsSummary } from './topup-stats-summary'

const route = getRouteApi('/_authenticated/topup-stats/')

export function TopUpStatsTable() {
  const { t } = useTranslation()
  const columns = useTopUpStatsColumns()
  const isMobile = useMediaQuery('(max-width: 640px)')
  const searchParams = route.useSearch()
  const navigate = route.useNavigate()

  const { pagination, onPaginationChange, ensurePageInRange } =
    useTableUrlState({
      search: searchParams,
      navigate,
      pagination: { defaultPage: 1, defaultPageSize: isMobile ? 10 : 20 },
      globalFilter: { enabled: false },
    })

  const updateSearch = (changes: Partial<typeof searchParams>) => {
    void navigate({
      search: (prev) => ({ ...prev, ...changes, page: 1 }),
      replace: true,
    })
  }

  const params: GetTopUpRecordsParams = {
    p: pagination.pageIndex + 1,
    page_size: pagination.pageSize,
    keyword: searchParams.filter,
    username: searchParams.username,
    status: searchParams.status,
    start_timestamp: searchParams.startTime,
    end_timestamp: searchParams.endTime,
    min_amount: searchParams.minAmount,
    max_amount: searchParams.maxAmount,
    min_money: searchParams.minMoney,
    max_money: searchParams.maxMoney,
  }

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['topup-stats-records', params],
    queryFn: async () => {
      const result = await getTopUpRecords(params)
      if (!result.success) {
        toast.error(result.message || t('Failed to load topup records'))
        return { items: [], total: 0 }
      }
      return {
        items: result.data?.items || [],
        total: result.data?.total || 0,
      }
    },
    placeholderData: (previousData) => previousData,
  })

  const records = data?.items || []

  const { table } = useDataTable({
    data: records,
    columns,
    enableRowSelection: false,
    columnFilters: [],
    pagination,
    onPaginationChange,
    manualPagination: true,
    manualFiltering: true,
    totalCount: data?.total || 0,
    ensurePageInRange,
  })

  return (
    <div className='flex h-full min-h-0 flex-col gap-4'>
      <TopUpStatsSummary params={params} />
      <div className='min-h-0 flex-1'>
        <DataTablePage
          table={table}
          columns={columns}
          isLoading={isLoading}
          isFetching={isFetching}
          emptyTitle={t('No Topup Records Found')}
          emptyDescription={t('No topup records match the current filters.')}
          skeletonKeyPrefix='topup-stats-skeleton'
          applyHeaderSize
          toolbar={
            <TopUpStatsFilterBar
              keyword={searchParams.filter ?? ''}
              onKeywordChange={(value) =>
                updateSearch({ filter: value || undefined })
              }
              username={searchParams.username ?? ''}
              onUsernameChange={(value) =>
                updateSearch({ username: value || undefined })
              }
              status={searchParams.status}
              onStatusChange={(value) => updateSearch({ status: value })}
              startTime={
                searchParams.startTime
                  ? new Date(searchParams.startTime)
                  : undefined
              }
              endTime={
                searchParams.endTime
                  ? new Date(searchParams.endTime)
                  : undefined
              }
              onDateRangeChange={(range) =>
                updateSearch({
                  startTime: range.start?.getTime(),
                  endTime: range.end?.getTime(),
                })
              }
              minAmount={searchParams.minAmount}
              maxAmount={searchParams.maxAmount}
              onAmountRangeChange={(range) =>
                updateSearch({ minAmount: range.min, maxAmount: range.max })
              }
              minMoney={searchParams.minMoney}
              maxMoney={searchParams.maxMoney}
              onMoneyRangeChange={(range) =>
                updateSearch({ minMoney: range.min, maxMoney: range.max })
              }
            />
          }
        />
      </div>
    </div>
  )
}
