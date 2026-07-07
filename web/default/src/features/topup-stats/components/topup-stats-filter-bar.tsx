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
import { useTranslation } from 'react-i18next'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CompactDateTimeRangePicker } from '@/features/usage-logs/components/compact-date-time-range-picker'

import { topUpStatusValues, type TopUpStatus } from '../types'

const STATUS_OPTIONS = [
  { value: 'success', labelKey: 'Success' },
  { value: 'pending', labelKey: 'Awaiting Payment' },
  { value: 'failed', labelKey: 'Failed' },
  { value: 'expired', labelKey: 'Expired' },
] as const

const ALL_STATUS_VALUE = '__all__'

const topUpStatusValueSet = new Set<string>(topUpStatusValues)

function isTopUpStatusValue(value: string | null): value is TopUpStatus {
  return value !== null && topUpStatusValueSet.has(value)
}

export interface TopUpStatsFilterBarProps {
  keyword: string
  onKeywordChange: (value: string) => void
  username: string
  onUsernameChange: (value: string) => void
  status?: TopUpStatus
  onStatusChange: (value?: TopUpStatus) => void
  startTime?: Date
  endTime?: Date
  onDateRangeChange: (range: { start?: Date; end?: Date }) => void
  minAmount?: number
  maxAmount?: number
  onAmountRangeChange: (range: { min?: number; max?: number }) => void
  minMoney?: number
  maxMoney?: number
  onMoneyRangeChange: (range: { min?: number; max?: number }) => void
}

function parseOptionalNumber(value: string): number | undefined {
  if (value.trim() === '') return undefined
  const parsed = Number(value)
  return Number.isNaN(parsed) ? undefined : parsed
}

export function TopUpStatsFilterBar(props: TopUpStatsFilterBarProps) {
  const { t } = useTranslation()

  return (
    <div className='flex flex-wrap items-center gap-2'>
      <Input
        placeholder={t('Filter by trade no...')}
        value={props.keyword}
        onChange={(e) => props.onKeywordChange(e.target.value)}
        className='h-8 w-44 text-sm'
      />
      <Input
        placeholder={t('Username')}
        value={props.username}
        onChange={(e) => props.onUsernameChange(e.target.value)}
        className='h-8 w-36 text-sm'
      />
      <Select
        value={props.status ?? ALL_STATUS_VALUE}
        onValueChange={(value) =>
          props.onStatusChange(isTopUpStatusValue(value) ? value : undefined)
        }
      >
        <SelectTrigger className='h-8 w-32 text-sm'>
          <SelectValue>
            {props.status
              ? t(
                  STATUS_OPTIONS.find((o) => o.value === props.status)
                    ?.labelKey ?? props.status
                )
              : t('Status')}
          </SelectValue>
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          <SelectGroup>
            <SelectItem value={ALL_STATUS_VALUE}>{t('All')}</SelectItem>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {t(option.labelKey)}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <CompactDateTimeRangePicker
        start={props.startTime}
        end={props.endTime}
        onChange={props.onDateRangeChange}
        className='h-8 w-56'
      />
      <div className='flex items-center gap-1'>
        <Input
          type='number'
          placeholder={t('Min Paid Amount')}
          value={props.minMoney ?? ''}
          onChange={(e) =>
            props.onMoneyRangeChange({
              min: parseOptionalNumber(e.target.value),
              max: props.maxMoney,
            })
          }
          className='h-8 w-28 text-sm'
        />
        <span className='text-muted-foreground text-xs'>~</span>
        <Input
          type='number'
          placeholder={t('Max Paid Amount')}
          value={props.maxMoney ?? ''}
          onChange={(e) =>
            props.onMoneyRangeChange({
              min: props.minMoney,
              max: parseOptionalNumber(e.target.value),
            })
          }
          className='h-8 w-28 text-sm'
        />
      </div>
      <div className='flex items-center gap-1'>
        <Input
          type='number'
          placeholder={t('Min Credited Quota')}
          value={props.minAmount ?? ''}
          onChange={(e) =>
            props.onAmountRangeChange({
              min: parseOptionalNumber(e.target.value),
              max: props.maxAmount,
            })
          }
          className='h-8 w-28 text-sm'
        />
        <span className='text-muted-foreground text-xs'>~</span>
        <Input
          type='number'
          placeholder={t('Max Credited Quota')}
          value={props.maxAmount ?? ''}
          onChange={(e) =>
            props.onAmountRangeChange({
              min: props.minAmount,
              max: parseOptionalNumber(e.target.value),
            })
          }
          className='h-8 w-28 text-sm'
        />
      </div>
    </div>
  )
}
