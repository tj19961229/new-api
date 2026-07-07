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
import { api } from '@/lib/api'
import { buildQueryParams } from '@/features/usage-logs/lib/utils'

import type {
  GetTopUpRecordsParams,
  GetTopUpRecordsResponse,
  GetTopUpStatsResponse,
} from './types'

function buildTopUpQuery(params: GetTopUpRecordsParams): string {
  return buildQueryParams({
    p: params.p || 1,
    page_size: params.page_size || 20,
    ...params,
  }).toString()
}

export async function getTopUpRecords(
  params: GetTopUpRecordsParams = {}
): Promise<GetTopUpRecordsResponse> {
  const res = await api.get(`/api/user/topup?${buildTopUpQuery(params)}`)
  return res.data
}

export async function getTopUpStats(
  params: GetTopUpRecordsParams = {}
): Promise<GetTopUpStatsResponse> {
  const res = await api.get(`/api/user/topup/stats?${buildTopUpQuery(params)}`)
  return res.data
}
