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
import { z } from 'zod'

export const topUpStatusValues = [
  'success',
  'pending',
  'failed',
  'expired',
] as const
export type TopUpStatus = (typeof topUpStatusValues)[number]

export const topUpRecordSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  amount: z.number(),
  money: z.number(),
  trade_no: z.string(),
  payment_method: z.string(),
  payment_provider: z.string(),
  create_time: z.number(),
  complete_time: z.number(),
  status: z.string(),
})
export type TopUpRecord = z.infer<typeof topUpRecordSchema>

export interface GetTopUpRecordsParams {
  p?: number
  page_size?: number
  keyword?: string
  username?: string
  status?: string
  start_timestamp?: number
  end_timestamp?: number
  min_amount?: number
  max_amount?: number
  min_money?: number
  max_money?: number
}

export interface GetTopUpRecordsResponse {
  success: boolean
  message?: string
  data?: {
    items: TopUpRecord[]
    total: number
    page: number
    page_size: number
  }
}

export interface TopUpStats {
  total_count: number
  success_count: number
  total_money: number
  total_amount: number
}

export interface GetTopUpStatsResponse {
  success: boolean
  message?: string
  data?: TopUpStats
}
