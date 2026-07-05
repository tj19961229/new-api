package controller

import "testing"

// @author tj
//
// 安全边界测试:分站受限 admin 绝不能读写任何"收款 / 密钥 / 免费额度 / 安全防护"类 key。
// default-deny 一旦被误改成放行,这里立即失败。

func TestIsAdminWritableOption_DeniesSensitiveKeys(t *testing.T) {
	denied := []string{
		// 支付网关(收款)——泄露即别人能改你的收款或看到密钥
		"PayAddress", "CustomCallbackAddress", "EpayId", "EpayKey", "PayMethods",
		"Price", "MinTopUp",
		"StripeApiSecret", "StripeWebhookSecret", "StripePriceId", "StripeUnitPrice",
		"CreemApiKey", "CreemWebhookSecret", "CreemProducts",
		"WaffoApiKey", "WaffoPrivateKey", "WaffoSandboxApiKey", "WaffoSandboxPrivateKey",
		"WaffoPancakePrivateKey", "WaffoPancakeMerchantID",
		"payment_setting.amount_options", "payment_setting.compliance_confirmed",
		// OAuth / 认证密钥
		"GitHubClientSecret", "GitHubClientId",
		"discord.client_secret", "oidc.client_secret", "oidc.client_id",
		"LinuxDOClientSecret", "TelegramBotToken", "WeChatServerToken",
		"TurnstileSecretKey", "TurnstileSiteKey", "passkey.rp_id",
		// 登录方式 / 注册开关
		"PasswordLoginEnabled", "RegisterEnabled", "EmailVerificationEnabled",
		"EmailDomainWhitelist",
		// 基础设施密钥
		"SMTPToken", "SMTPServer", "SMTPAccount", "WorkerValidKey", "WorkerUrl",
		"model_deployment.ionet.api_key",
		// 免费额度水龙头(造额度)——必须留 root
		"QuotaForNewUser", "QuotaForInviter", "QuotaForInvitee", "PreConsumedQuota",
		"checkin_setting.enabled", "checkin_setting.max_quota",
		// 安全防护策略(security 分区,留 root)
		"ModelRequestRateLimitEnabled", "ModelRequestRateLimitCount",
		"CheckSensitiveEnabled", "SensitiveWords", "StopOnSensitiveEnabled",
		"fetch_setting.enable_ssrf_protection", "fetch_setting.allow_private_ip",
		"token_setting.max_user_tokens",
		// 主题切换(锁死新 UI)/ 模式开关(可能绕过计费)
		"theme.frontend", "SelfUseModeEnabled", "DemoSiteEnabled",
		// 文件权限
		"FileUploadPermission",
	}
	for _, k := range denied {
		if IsAdminWritableOption(k) {
			t.Errorf("SECURITY: key %q must NOT be admin-writable, but IsAdminWritableOption returned true", k)
		}
	}
}

func TestIsAdminWritableOption_AllowsPricingAndOperational(t *testing.T) {
	allowed := []string{
		// 定价
		"ModelRatio", "ModelPrice", "CompletionRatio", "CacheRatio", "ImageRatio",
		"GroupRatio", "GroupGroupRatio", "TopupGroupRatio", "UserUsableGroups",
		"QuotaPerUnit", "USDExchangeRate",
		"billing_setting.billing_mode", "billing_setting.billing_expr",
		"tool_price_setting.prices", "group_ratio_setting.group_special_usable_group",
		// 站点门面
		"SystemName", "Logo", "Footer", "Notice", "HomePageContent",
		"HeaderNavModules", "SidebarModulesAdmin",
		"legal.user_agreement",
		// 展示内容
		"console_setting.announcements", "console_setting.faq_enabled",
		"Chats", "DrawingEnabled", "DataExportEnabled",
		// 模型行为
		"RetryTimes", "AutomaticDisableChannelEnabled",
		"gemini.safety_settings", "claude.default_max_tokens", "grok.violation_deduction_amount",
		"global.pass_through_request_enabled", "monitor_setting.auto_test_channel_enabled",
		"channel_affinity_setting.enabled",
		// 运营
		"DefaultCollapseSidebar", "QuotaRemindThreshold", "LogConsumeEnabled",
		"perf_metrics_setting.enabled", "performance_setting.disk_cache_enabled",
		"general_setting.docs_link", "general_setting.quota_display_type",
	}
	for _, k := range allowed {
		if !IsAdminWritableOption(k) {
			t.Errorf("key %q should be admin-writable, but IsAdminWritableOption returned false", k)
		}
	}
}
