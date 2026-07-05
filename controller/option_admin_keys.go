package controller

import "strings"

// @author tj
//
// 分站受限管理账号(admin)可写/可读的系统配置 key 白名单。
//
// 设计原则:default-deny —— 只有显式列在下面的 key,非 root 的 admin 才能通过
// GetOptions 读取、通过 UpdateOption 写入;其余一切(支付网关、OAuth 密钥、SMTP、
// Worker、赠额/造额度、安全防护策略、主题切换等)默认只有 root 可碰。
//
// 为什么是 default-deny:这是收款与免费额度的安全边界。将来 upstream 合入新的
// 支付/密钥类 key 时,会自动落到 root-only,不会因为"忘了加进拒绝名单"而泄露;
// 失败模式只会是"admin 暂时改不了某个新运营项",安全侧永远不破。
//
// 归属:admin 管"收费流"(定价/倍率/站点门面/运营开关),root 管"免费流"
// (赠额/兑换码/手动加额度/订阅授予)+ 收款(支付密钥)。

// adminWritableOptionKeys 是 admin 可读写的精确 key 集合。
var adminWritableOptionKeys = map[string]struct{}{
	// —— 定价 / 倍率(销售经理运营核心)——
	"ModelRatio":            {},
	"ModelPrice":            {},
	"CacheRatio":            {},
	"CreateCacheRatio":      {},
	"CompletionRatio":       {},
	"ImageRatio":            {},
	"AudioRatio":            {},
	"AudioCompletionRatio":  {},
	"ExposeRatioEnabled":    {},
	"GroupRatio":            {},
	"GroupGroupRatio":       {},
	"TopupGroupRatio":       {},
	"UserUsableGroups":      {},
	"AutoGroups":            {},
	"DefaultUseAutoGroup":   {},
	"QuotaPerUnit":          {},
	"USDExchangeRate":       {},
	"DisplayInCurrencyEnabled": {},
	"DisplayTokenStatEnabled":  {},

	// —— 站点门面 ——
	"SystemName":         {},
	"Logo":               {},
	"Footer":             {},
	"About":              {},
	"HomePageContent":    {},
	"ServerAddress":      {},
	"Notice":             {},
	"HeaderNavModules":   {},
	"SidebarModulesAdmin": {},
	"TopUpLink":          {},

	// —— 控制台展示内容 / 绘图 ——
	"Chats":                       {},
	"DrawingEnabled":              {},
	"MjNotifyEnabled":             {},
	"MjAccountFilterEnabled":      {},
	"MjModeClearEnabled":          {},
	"MjForwardUrlEnabled":         {},
	"MjActionCheckSuccessEnabled": {},
	"DataExportEnabled":           {},
	"DataExportInterval":          {},
	"DataExportDefaultTime":       {},
	"TaskEnabled":                 {},

	// —— 模型行为 / 路由可靠性(非密钥)——
	"RetryTimes":                     {},
	"ChannelDisableThreshold":        {},
	"AutomaticDisableChannelEnabled": {},
	"AutomaticEnableChannelEnabled":  {},
	"AutomaticDisableKeywords":       {},
	"AutomaticDisableStatusCodes":    {},
	"AutomaticRetryStatusCodes":      {},
	"StreamCacheQueueLength":         {},

	// —— 一般运营开关(非密钥、非造额度)——
	"DefaultCollapseSidebar": {},
	"QuotaRemindThreshold":   {},
	"LogConsumeEnabled":      {},

	// —— 明确放行的点号 key(所在命名空间为 catch-all,不整段放行)——
	"general_setting.docs_link":                    {},
	"general_setting.quota_display_type":           {},
	"general_setting.custom_currency_symbol":       {},
	"general_setting.custom_currency_exchange_rate": {},
	"general_setting.ping_interval_enabled":        {},
	"general_setting.ping_interval_seconds":        {},
	"legal.user_agreement":                         {},
	"legal.privacy_policy":                         {},
}

// adminWritableOptionPrefixes 是可整段放行的点号命名空间前缀。
// 仅收录"语义单一、不会承载密钥/收款/免费额度"的运营与定价命名空间。
// 不含 general_setting.(catch-all,逐 key 放行)、payment_setting.、oidc.、
// discord.、passkey.、checkin_setting.、quota_setting.、fetch_setting.、
// token_setting.、model_deployment.(含第三方 api_key)。
var adminWritableOptionPrefixes = []string{
	"console_setting.",          // 公告 / API 信息 / FAQ / uptime-kuma
	"gemini.",                   // 模型行为适配
	"claude.",                   // 模型行为适配
	"grok.",                     // 模型行为适配
	"global.",                   // 模型全局行为
	"monitor_setting.",          // 渠道自动测试 / 监控
	"channel_affinity_setting.", // 渠道亲和
	"perf_metrics_setting.",     // 性能指标
	"performance_setting.",      // 磁盘缓存 / 资源监控
	"billing_setting.",          // 计费模式 / 计费表达式(定价)
	"tool_price_setting.",       // 工具定价
	"group_ratio_setting.",      // 分组倍率(定价)
}

// IsAdminWritableOption 判定一个系统配置 key 是否允许非 root 的 admin 读写。
// default-deny:不在精确白名单、也不匹配任何放行前缀 → false。
func IsAdminWritableOption(key string) bool {
	if _, ok := adminWritableOptionKeys[key]; ok {
		return true
	}
	for _, prefix := range adminWritableOptionPrefixes {
		if strings.HasPrefix(key, prefix) {
			return true
		}
	}
	return false
}
