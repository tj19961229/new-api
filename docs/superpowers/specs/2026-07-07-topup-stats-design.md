# 充值统计(Topup Stats)设计文档

分支:`feat`(继承自 `master`,主站/分站共享功能线)。

## 背景与目标

管理员目前无法按日期、金额、用户等条件筛选查看全平台充值记录。现有能力:

- `model/topup.go` 的 `GetAllTopUps`/`SearchAllTopUps`,挂在 `adminRoute.GET("/api/user/topup")`,仅支持订单号关键词搜索 + 分页。
- 唯一消费方是 legacy `web/classic` 的 `TopupHistoryModal` 弹窗。当前主力前端 `web/default` 尚无管理员充值记录页面。

目标:让管理员在 `web/default` 里看到可按**日期区间 / 实付金额区间 / 到账额度区间 / 用户名 / 状态**筛选的充值记录表格,并配一组随筛选联动的汇总统计徽章(总笔数/成功笔数/实付总额/到账总额度)。**纯只读**,不含补单等改变订单状态或用户额度的操作入口。

## 范围确认(已与用户对齐)

1. 功能形态:筛选表格 + 汇总统计徽章。**不做**趋势图表。
2. 金额筛选:`money`(实付金额)与 `amount`(到账额度)两个字段都要,各自独立的 min/max 区间。
3. 无补单操作入口;classic 前端现有的补单弹窗保持不变、不受影响。
4. 改动策略:**只加不改**——尽量不touch 现有共享源码,降低后续合并/同步 upstream 时的冲突面。为此放弃"合并旧函数/拆分现有文件"的重构,接受新增函数与旧函数之间少量查询构建代码重复。

## 非目标

- 不修改 `model/topup.go`、`controller/topup.go` 中任何一个既有函数的内部逻辑。
- 不改动 `web/classic` 里的 `TopupHistoryModal`。
- 不新增补单/退款/改单等 mutation 能力。
- 不在此功能中处理分站(`main` 分支)的权限差异化——本功能上的是 `feat`→`master` 共享线,分站将通过既有的 master→main 同步流程自动获得,不需要在这里做任何 root/admin 判分。

## 后端设计

### 新文件 `model/topup_search.go`(全新文件,不改动 `model/topup.go`)

```go
type TopUpFilters struct {
    Keyword        string  // 订单号模糊匹配,兼容旧 SearchAllTopUps 的语义
    Username       string  // 用户名模糊匹配(子查询 users 表)
    Status         string  // 精确匹配 TopUp.Status,取值见 common.TopUpStatus{Pending,Success,Failed,Expired}("pending"/"success"/"failed"/"expired")
    StartTimestamp int64   // create_time >=
    EndTimestamp   int64   // create_time <=
    MinAmount      int64   // amount >=(到账额度)
    MaxAmount      int64   // amount <=
    MinMoney       float64 // money >=(实付金额)
    MaxMoney       float64 // money <=
}

func SearchAllTopUpsWithFilters(filters TopUpFilters, pageInfo *common.PageInfo) (topups []*TopUp, total int64, err error)

type TopUpStats struct {
    TotalCount     int64
    SuccessCount   int64
    TotalMoney     float64 // 仅成功订单的 money 之和
    TotalAmount    int64   // 仅成功订单的 amount 之和
}

func GetTopUpStats(filters TopUpFilters) (TopUpStats, error)
```

实现要点:

- 用户名过滤走子查询:`user_id IN (SELECT id FROM users WHERE username LIKE ? ESCAPE '!')`,复用 `model/token.go` 里已有的 `sanitizeLikePattern`(同包直接调用,不改 token.go)。
- 关键词(`Keyword`)过滤沿用 `trade_no LIKE ? ESCAPE '!'` 的既有写法。
- 沿用 `SearchAllTopUps` 里已有的 `searchTopUpCountHardLimit`(10000)对 COUNT 查询限流,防止大表无界 COUNT。
- `GetTopUpStats` 对同一组 filters 复用同一套 WHERE 条件构建(内部一个辅助函数生成 `*gorm.DB` 供 count 查询和 stats 查询共享,避免重复拼 WHERE 子句——这是新文件内部的复用,不涉及改动旧文件)。
- 全部字段零值时,`SearchAllTopUpsWithFilters` 的行为与今天 `GetAllTopUps`(无筛选)等价——但**不替代**旧函数,旧函数继续被 controller 在"无任何筛选参数"场景下调用。

### `controller/topup.go`(仅追加,不删除、不重写既有分支)

- 现有 `GetAllTopUps` handler 内追加读取新 query 参数:`username`、`status`、`start_timestamp`、`end_timestamp`、`min_amount`、`max_amount`、`min_money`、`max_money`。
- 追加一个判断:只要新参数中任意一个非零值/非空,调用新的 `model.SearchAllTopUpsWithFilters`;否则完全保留原有的 `if keyword != "" {SearchAllTopUps} else {GetAllTopUps}` 两条分支,一行不改。
- 文件末尾追加新 handler:

```go
func GetTopUpStats(c *gin.Context) {
    // 解析与上面相同的一组 filter query 参数(不含分页)
    // 调用 model.GetTopUpStats(filters)
    // common.ApiSuccess(c, stats)
}
```

### `router/api-router.go`

追加一行:

```go
adminRoute.GET("/topup/stats", controller.GetTopUpStats)
```

权限维持 adminRoute 现状(管理员可见),不新增角色判断。

### 后端测试(Core tier,新文件全新测试,不改动任何既有测试)

新建 `model/topup_search_test.go`,表驱动覆盖:

- 全零值 filters(应返回与 `GetAllTopUps` 等价的结果)
- 仅 `Keyword`(应等价于旧 `SearchAllTopUps` 的关键词语义)
- 仅日期区间 / 仅 `Username` / 仅 `Status`
- 仅 `MinAmount`/`MaxAmount` 区间、仅 `MinMoney`/`MaxMoney` 区间
- 多条件组合
- 分页正确性(`total` 与实际返回条数)
- `GetTopUpStats` 在有/无匹配记录、混合成功/非成功状态下的聚合正确性
- 用户名/关键词的模糊匹配转义安全性(复用 `sanitizeLikePattern` 的既有保障,补一条 `%`/`_` 特殊字符输入的用例)

## 前端设计(`web/default` 新增,`web/classic` 不动)

### 新 feature 模块 `web/default/src/features/topup-stats/`

结构参照 `usage-logs`:

- `api.ts` —— `getTopUpRecords(params)` / `getTopUpStats(params)`,薄封装 `API.get('/api/user/topup', {params})` 与 `/api/user/topup/stats`。
- `types.ts` —— `TopUpRecord`、`TopUpFilterParams`、`TopUpStatsResponse`。
- `components/topup-stats-filter-bar.tsx` —— 日期区间(复用现成的 `compact-date-time-range-picker`)、实付金额区间、到账额度区间、用户名输入、状态下拉。
- `components/topup-stats-summary.tsx` —— 统计徽章(总笔数/成功笔数/实付总额/到账总额度),随筛选条件联动,结构参照 `common-logs-stats.tsx`。
- `components/topup-stats-table.tsx` + 列定义 —— 纯展示列:用户名/user_id、订单号、支付方式、到账额度、实付金额、状态、创建时间、完成时间。**不含操作列**。
- `index.tsx` —— 组合页面(筛选栏 + 统计徽章 + 表格 + 分页)。

### 路由与导航

- 新路由文件 `web/default/src/routes/_authenticated/topup-stats/index.tsx`。
- `web/default/src/hooks/use-sidebar-data.ts`:在 Admin 分组现有数组里追加一个导航项(标题 i18n key `'Topup Statistics'`,中文显示"充值统计"),挨着 Users/Redemption Codes/Subscriptions。
- `web/default/src/hooks/use-sidebar-config.ts`:`URL_TO_CONFIG_MAP` 追加一行 `'/topup-stats': { section: 'admin', module: 'topup_stats' }`,接入既有 `sidebar_modules` 权限体系(与之前分站权限改造用的是同一套机制)。

**实现时需核实**:新 module key(`topup_stats`)对已存量用户的 `sidebar_modules` JSON(里面不会有这个 key)是否默认按"缺省=可见"处理——不能重蹈之前"admin 看不到系统设置"那次覆辙(那次是因为默认配置显式写了 `false`,而不是 key 缺失)。若默认合并逻辑(`mergeWithDefaultSidebarModules`)对未知 key 走的是"缺省可见"的合并策略,则天然安全;若不是,需要在 `DEFAULT_SIDEBAR_MODULES` 里显式补上 `topup_stats: true`。

### i18n

`web/default/src/i18n/locales/en.json` 与 `zh.json` 至少补齐新增文案(导航标题、筛选栏 label、表格列名、统计徽章 label、空状态文案)。

### 前端测试

项目里前端测试整体很少(全库仅 3 个 `.test.ts`,`usage-logs` 自身也没有测试文件),不额外补组件/E2E 测试。若 `lib/` 下出现值得单测的纯函数(如筛选参数拼装),按现有惯例补 `*.test.ts`。

## 风险与验证

- **合并冲突面**:`model/topup.go`、`controller/topup.go` 的既有函数体不改一行,冲突面仅剩 `controller/topup.go` 里 `GetAllTopUps` handler 内的追加行、`router/api-router.go` 的新增一行、以及前端两个 sidebar 配置文件的追加行——均为纯新增,合并风险低。
- **性能/安全**:沿用既有的 COUNT 硬上限与 LIKE 转义,不引入新的无界查询。
- **回归验证**:新函数全零筛选 = 旧 `GetAllTopUps` 行为、纯关键词 = 旧 `SearchAllTopUps` 行为——这两条等价性由 `model/topup_search_test.go` 直接断言,防止未来重构时行为漂移。
- **验收**:`go build ./controller/... ./router/... ./model/...` 通过;新测试全绿;`bun run typecheck`/`lint` 通过;管理员登录后能在新页面按四个维度筛选并看到统计徽章随筛选联动;classic 前端旧弹窗行为不变。
