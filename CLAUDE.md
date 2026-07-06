# CLAUDE.md — Project Conventions for new-api

@AGENTS.md

## Claude Code

- Follow the shared project instructions imported from `AGENTS.md`.

## Git 分支策略(本 fork 专属,tj19961229/new-api)

这是 QuantumNous/new-api 的 fork,维护两条产品线,`main` 继承 `master`(不要反过来):

- **`master`** = 主站分支 = upstream 镜像 + 主站/分站共享功能。保持干净,不放分站专属限制补丁。
- **`main`** = 分站分支 = `master` + 分站专属补丁(受限管理员 Path B:`controller/option_admin_keys.go`、路由/中间件里的权限判断等,详见 PR #1 及后续修复提交)。

同步 upstream(两步,顺序不能反):

```bash
git checkout master && git fetch upstream && git merge upstream/main && git push
git checkout main && git merge master && git push
```

- **主站/分站都要的功能**:开短分支从 `master` 开叉,PR 回 `master`;下次执行上面第二步会自动带进 `main`,不用单独合并。
- **只给分站的功能**(权限限制类):直接在 `main` 上开发,不合回 `master`。
- 已开 `git config rerere.enabled true`,重复冲突会自动按上次方案解决。
- 合并后务必跑 `go build ./controller/... ./router/... ./model/...` + `go test ./controller/ -run TestIsAdminWritableOption` 确认分站安全补丁没被冲掉。