# [ERR-002] Git push 到远程仓库失败

| 字段 | 内容 |
|------|------|
| **错误编号** | ERR-002 |
| **发现日期** | 2026-06-16 |
| **严重程度** | 🟠 高 |
| **涉及模块** | 工具链 / Git |
| **涉及文件** | `.git/config`、远程分支状态 |
| **发现阶段** | 验收阶段末尾（准备把代码推到远程） |
| **状态** | ✅ 已解决 |

---

## 错误现象

执行 `git push origin main`（或对应分支）时失败：

- `! [rejected] main -> main (fetch first)` —— 本地落后于远程
- `fatal: unable to access 'https://github.com/.../'` —— 网络/认证问题
- `! [remote rejected] main -> main (protected branch hook declined)` —— 分支受保护
- `Permission to xxx/yyy.git denied to user` —— SSH Key / Token 未配置

**预期行为**：`git push` 成功，远程分支与本地同步。

## 复现步骤

1. 在项目根目录打开终端
2. 执行：`git status` → 确认当前分支
3. 执行：`git push origin <branch-name>`
4. 观察到上述任一类错误

---

## 根本原因分析

| 常见子类 | 说明 |
|---------|------|
| **本地落后** | 远程有新提交，本地没有先 pull → push 被拒绝 |
| **认证缺失** | SSH Key 未加入 GitHub / HTTPS Token 过期或未配置 |
| **分支保护** | GitHub 仓库开启了分支保护，禁止直接 push 到 main |
| **网络问题** | 代理 / 网络连接到 GitHub 不通 |

深层原因：原则四（可复用代码库的同时）忽略了工作环境一致性；也可能违反原则零（功能对齐前应确认 `git pull` 保持代码同步）。

---

## 解决方案

### 修复步骤 —— 按常见顺序排查

```bash
# 1. 先确认当前分支与状态
git status
git log --oneline -5

# 2. 最常见：本地落后于远程 → 先拉取
git pull origin main          # 如有冲突，手工解决并提交

# 3. 如果 pull 后仍有冲突且希望保留本地改动（慎用）
git pull --rebase origin main
# 解决冲突后
git rebase --continue

# 4. 认证问题 → 检查 SSH Key 或改用 HTTPS + Token
ssh -T git@github.com         # 验证 SSH 是否能连通

# 5. 分支保护问题 → 改用 PR / 在 GitHub 上临时关闭保护
#    在 GitHub: Settings → Branches → Branch protection rules
```

### 推荐流程（灵感调酒师项目）

```
编码完成 → git status → git add → git commit → git pull origin main → 解决冲突 → git push
```

这样把"先同步"养成习惯，避免 push 失败。

---

## 验证结果

- [x] `git push origin main` 成功完成
- [x] GitHub 仓库显示最新 commit
- [x] 其他协作者 `git pull` 可正常获取
- [x] `npx tsc --noEmit` 仍保持 0 错误

---

## 预防措施

- [x] **写入 WORKFLOW 流程**：原则二编码完成后，务必先 `git pull` 再 `git push`（见 WORKFLOW.md 的修改阶段末尾）
- [x] **在新设备启动流程中加入 Git 验证**（WORK_PRINCIPLES.md 复检模式）
- [x] **统一分支策略**：统一使用 `main` 或 `master` 中的一个，避免两个并存
- [ ] 配置 GitHub 自动化：当 push 成功后触发类型检查（后续可扩展）

---

## 关联文档

- 工作原则：[WORK_PRINCIPLES.md 复检模式](../WORK_PRINCIPLES.md)
- 流程参考：[WORKFLOW.md 修改阶段 → Git 提交](../WORKFLOW.md)
- 原则四：确保可复用的 Git 操作流程作为团队资产

---

**文档版本**: v1.0  
**最后更新**: 2026-06-16
