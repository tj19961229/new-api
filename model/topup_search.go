package model

import (
	"errors"

	"github.com/QuantumNous/new-api/common"

	"gorm.io/gorm"
)

// TopUpFilters 是管理员按多维度筛选充值记录的可选条件集合。零值字段表示该维度不参与筛选。
type TopUpFilters struct {
	Keyword        string
	Username       string
	Status         string
	StartTimestamp int64
	EndTimestamp   int64
	MinAmount      int64
	MaxAmount      int64
	MinMoney       float64
	MaxMoney       float64
}

// applyTopUpFilters 把 TopUpFilters 的每个维度转换为 GORM WHERE 条件，
// 供 SearchAllTopUpsWithFilters 与 Task 2 的 GetTopUpStats 共用，确保统计口径与列表一致。
func applyTopUpFilters(query *gorm.DB, filters TopUpFilters) (*gorm.DB, error) {
	if filters.Keyword != "" {
		pattern, err := sanitizeLikePattern(filters.Keyword)
		if err != nil {
			return nil, err
		}
		query = query.Where("trade_no LIKE ? ESCAPE '!'", pattern)
	}
	if filters.Username != "" {
		pattern, err := sanitizeLikePattern(filters.Username)
		if err != nil {
			return nil, err
		}
		// query.Session(&gorm.Session{}) 复用调用者当前连接（不占用连接池里的新连接——
		// 若外层正跑在事务里，包级 DB 直接发起子查询会在单连接池下自锁），
		// 同时拿到全新的 Statement（不继承外层已拼好的 WHERE 条件）。
		query = query.Where(
			"user_id IN (?)",
			query.Session(&gorm.Session{}).Model(&User{}).Select("id").Where("username LIKE ? ESCAPE '!'", pattern),
		)
	}
	if filters.Status != "" {
		query = query.Where("status = ?", filters.Status)
	}
	if filters.StartTimestamp != 0 {
		query = query.Where("create_time >= ?", filters.StartTimestamp)
	}
	if filters.EndTimestamp != 0 {
		query = query.Where("create_time <= ?", filters.EndTimestamp)
	}
	if filters.MinAmount != 0 {
		query = query.Where("amount >= ?", filters.MinAmount)
	}
	if filters.MaxAmount != 0 {
		query = query.Where("amount <= ?", filters.MaxAmount)
	}
	if filters.MinMoney != 0 {
		query = query.Where("money >= ?", filters.MinMoney)
	}
	if filters.MaxMoney != 0 {
		query = query.Where("money <= ?", filters.MaxMoney)
	}
	return query, nil
}

// SearchAllTopUpsWithFilters 管理员按多维条件筛选全平台充值记录（不限制时间窗口）。
func SearchAllTopUpsWithFilters(filters TopUpFilters, pageInfo *common.PageInfo) (topups []*TopUp, total int64, err error) {
	tx := DB.Begin()
	if tx.Error != nil {
		return nil, 0, tx.Error
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	query, err := applyTopUpFilters(tx.Model(&TopUp{}), filters)
	if err != nil {
		tx.Rollback()
		return nil, 0, err
	}

	if err = query.Limit(searchTopUpCountHardLimit).Count(&total).Error; err != nil {
		tx.Rollback()
		common.SysError("failed to count filtered topups: " + err.Error())
		return nil, 0, errors.New("筛选充值记录失败")
	}

	if err = query.Order("id desc").Limit(pageInfo.GetPageSize()).Offset(pageInfo.GetStartIdx()).Find(&topups).Error; err != nil {
		tx.Rollback()
		common.SysError("failed to search filtered topups: " + err.Error())
		return nil, 0, errors.New("筛选充值记录失败")
	}

	if err = tx.Commit().Error; err != nil {
		return nil, 0, err
	}
	return topups, total, nil
}
