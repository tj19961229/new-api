package model

import (
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestSearchAllTopUpsWithFilters(t *testing.T) {
	truncateTables(t)
	require.NoError(t, DB.Exec("DELETE FROM top_ups").Error)
	require.NoError(t, DB.Exec("DELETE FROM users").Error)

	users := []User{
		{Id: 9101, Username: "topupfilter_alice", Password: "x", AffCode: "tfa01"},
		{Id: 9102, Username: "topupfilter_bob", Password: "x", AffCode: "tfb01"},
	}
	require.NoError(t, DB.Create(&users).Error)

	topups := []TopUp{
		{UserId: 9101, Amount: 100, Money: 10, TradeNo: "TF1", Status: common.TopUpStatusSuccess, CreateTime: 1000},
		{UserId: 9101, Amount: 200, Money: 20, TradeNo: "TF2", Status: common.TopUpStatusPending, CreateTime: 2000},
		{UserId: 9102, Amount: 300, Money: 30, TradeNo: "TF3", Status: common.TopUpStatusSuccess, CreateTime: 3000},
		{UserId: 9102, Amount: 400, Money: 40, TradeNo: "TF4", Status: common.TopUpStatusFailed, CreateTime: 4000},
	}
	require.NoError(t, DB.Create(&topups).Error)

	pageInfo := &common.PageInfo{Page: 1, PageSize: 10}

	tests := []struct {
		name      string
		filters   TopUpFilters
		wantTotal int64
		wantIds   []string
	}{
		{
			name:      "no filters returns all rows newest first",
			filters:   TopUpFilters{},
			wantTotal: 4,
			wantIds:   []string{"TF4", "TF3", "TF2", "TF1"},
		},
		{
			name:      "keyword filters by trade_no",
			filters:   TopUpFilters{Keyword: "TF2"},
			wantTotal: 1,
			wantIds:   []string{"TF2"},
		},
		{
			name:      "username filters to that user's topups",
			filters:   TopUpFilters{Username: "topupfilter_bob"},
			wantTotal: 2,
			wantIds:   []string{"TF4", "TF3"},
		},
		{
			name:      "unmatched username returns empty, not all rows",
			filters:   TopUpFilters{Username: "topupfilter_nobody"},
			wantTotal: 0,
			wantIds:   []string{},
		},
		{
			name:      "status filters to success only",
			filters:   TopUpFilters{Status: common.TopUpStatusSuccess},
			wantTotal: 2,
			wantIds:   []string{"TF3", "TF1"},
		},
		{
			name:      "date range filters by create_time inclusive",
			filters:   TopUpFilters{StartTimestamp: 2000, EndTimestamp: 3000},
			wantTotal: 2,
			wantIds:   []string{"TF3", "TF2"},
		},
		{
			name:      "amount range filters by amount inclusive",
			filters:   TopUpFilters{MinAmount: 200, MaxAmount: 300},
			wantTotal: 2,
			wantIds:   []string{"TF3", "TF2"},
		},
		{
			name:      "money range filters by money inclusive",
			filters:   TopUpFilters{MinMoney: 20, MaxMoney: 30},
			wantTotal: 2,
			wantIds:   []string{"TF3", "TF2"},
		},
		{
			name:      "combined filters intersect",
			filters:   TopUpFilters{Username: "topupfilter_bob", Status: common.TopUpStatusFailed},
			wantTotal: 1,
			wantIds:   []string{"TF4"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			rows, total, err := SearchAllTopUpsWithFilters(tt.filters, pageInfo)
			require.NoError(t, err)
			assert.Equal(t, tt.wantTotal, total)
			gotIds := make([]string, 0, len(rows))
			for _, row := range rows {
				gotIds = append(gotIds, row.TradeNo)
			}
			assert.Equal(t, tt.wantIds, gotIds)
		})
	}
}

func TestSearchAllTopUpsWithFiltersPaginates(t *testing.T) {
	truncateTables(t)
	require.NoError(t, DB.Exec("DELETE FROM top_ups").Error)

	topups := []TopUp{
		{UserId: 1, Amount: 100, Money: 10, TradeNo: "TP1", Status: common.TopUpStatusSuccess, CreateTime: 1000},
		{UserId: 1, Amount: 100, Money: 10, TradeNo: "TP2", Status: common.TopUpStatusSuccess, CreateTime: 2000},
		{UserId: 1, Amount: 100, Money: 10, TradeNo: "TP3", Status: common.TopUpStatusSuccess, CreateTime: 3000},
	}
	require.NoError(t, DB.Create(&topups).Error)

	rows, total, err := SearchAllTopUpsWithFilters(TopUpFilters{}, &common.PageInfo{Page: 1, PageSize: 2})
	require.NoError(t, err)
	assert.Equal(t, int64(3), total)
	require.Len(t, rows, 2)
	assert.Equal(t, "TP3", rows[0].TradeNo)
	assert.Equal(t, "TP2", rows[1].TradeNo)
}

func TestGetTopUpStats(t *testing.T) {
	truncateTables(t)
	require.NoError(t, DB.Exec("DELETE FROM top_ups").Error)
	require.NoError(t, DB.Exec("DELETE FROM users").Error)

	users := []User{
		{Id: 9201, Username: "topupstats_alice", Password: "x", AffCode: "ts2a01"},
		{Id: 9202, Username: "topupstats_bob", Password: "x", AffCode: "ts2b01"},
	}
	require.NoError(t, DB.Create(&users).Error)

	topups := []TopUp{
		{UserId: 9201, Amount: 100, Money: 10, TradeNo: "TS1", Status: common.TopUpStatusSuccess, CreateTime: 1000},
		{UserId: 9201, Amount: 200, Money: 20, TradeNo: "TS2", Status: common.TopUpStatusPending, CreateTime: 2000},
		{UserId: 9202, Amount: 300, Money: 30, TradeNo: "TS3", Status: common.TopUpStatusSuccess, CreateTime: 3000},
		{UserId: 9202, Amount: 400, Money: 40, TradeNo: "TS4", Status: common.TopUpStatusFailed, CreateTime: 4000},
	}
	require.NoError(t, DB.Create(&topups).Error)

	tests := []struct {
		name    string
		filters TopUpFilters
		want    TopUpStats
	}{
		{
			name:    "no filters aggregates all rows, money/amount only success",
			filters: TopUpFilters{},
			want: TopUpStats{
				TotalCount:   4,
				SuccessCount: 2,
				TotalMoney:   40,  // TS1(10) + TS3(30)
				TotalAmount:  400, // TS1(100) + TS3(300)
			},
		},
		{
			name:    "username filters before aggregating",
			filters: TopUpFilters{Username: "topupstats_bob"},
			want: TopUpStats{
				TotalCount:   2,
				SuccessCount: 1,
				TotalMoney:   30,
				TotalAmount:  300,
			},
		},
		{
			name:    "status filter narrows both count and totals",
			filters: TopUpFilters{Status: common.TopUpStatusFailed},
			want: TopUpStats{
				TotalCount:   1,
				SuccessCount: 0,
				TotalMoney:   0,
				TotalAmount:  0,
			},
		},
		{
			name:    "unmatched filter returns all-zero stats, not an error",
			filters: TopUpFilters{Username: "topupstats_nobody"},
			want:    TopUpStats{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := GetTopUpStats(tt.filters)
			require.NoError(t, err)
			assert.Equal(t, tt.want, got)
		})
	}
}
