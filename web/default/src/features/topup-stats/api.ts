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

import type {
  GetTopUpRecordsParams,
  GetTopUpRecordsResponse,
  GetTopUpStatsResponse,
} from './types'

function buildTopUpQuery(params: GetTopUpRecordsParams): string {
  const query = new URLSearchParams()
  query.set('p', String(params.p ?? 1))
  query.set('page_size', String(params.page_size ?? 20))
  if (params.keyword) query.set('keyword', params.keyword)
  if (params.username) query.set('username', params.username)
  if (params.status) query.set('status', params.status)
  if (params.start_timestamp) {
    query.set('start_timestamp', String(params.start_timestamp))
  }
  if (params.end_timestamp) {
    query.set('end_timestamp', String(params.end_timestamp))
  }
  if (params.min_amount) query.set('min_amount', String(params.min_amount))
  if (params.max_amount) query.set('max_amount', String(params.max_amount))
  if (params.min_money) query.set('min_money', String(params.min_money))
  if (params.max_money) query.set('max_money', String(params.max_money))
  return query.toString()
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
