# Web 前端对接指南（ApexBlog 积分/登录）

适用范围：网页版不考虑试用期，仅正式积分（按邮箱计账）。所有接口均返回统一响应体 `ApiResponse<T>`。

- 服务器默认 base URL: http://ilikexff.cn/api
- 认证方式：Bearer JWT（过期时间 jwt.expiration=86400000ms ≈ 24 小时）

---

## 1. 登录（一次性许可证引导）
使用已激活且未过期的许可证换取 Web 登录。首次调用会按许可证邮箱创建 Web 用户（username=email），后续可直接使用该接口登录。

- 方法与路径：POST /auth/license-bootstrap
- 请求头：Content-Type: application/json
- 请求体：
  - licenseKey: string（必填）
  - customerEmail: string（可选，若提供将与许可证记录做一致性校验）
- 响应：`ApiResponse<LoginResponseDTO>`，其中 `data.token` 为 JWT，`data.user` 为用户信息

示例：
```json
{
  "licenseKey": "XXXX-XXXX-XXXX-XXXX",
  "customerEmail": "user@example.com"
}
```
成功响应示例（data 精简展示）：
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "<JWT>",
    "tokenType": "Bearer",
    "user": {
      "id": 1,
      "username": "user@example.com",
      "email": "user@example.com",
      "nickname": "User",
      "avatar": null,
      "bio": "",
      "createdAt": "2024-11-08T12:00:00"
    }
  },
  "timestamp": 1731070000000
}
```
错误场景：
- 400：许可证不存在/邮箱不匹配
- 401：许可证未激活或已过期

前端保存 token，并在后续请求加上 Authorization 头：`Authorization: Bearer <token>`。

---

## 2. 查询当前用户积分（仅正式积分）
- 方法与路径：GET /credits/me
- 认证：需要（Bearer JWT）
- 查询参数：
  - includeTransactionHistory: boolean，是否返回交易分页（默认 false）
  - page: number，页码（默认 0）
  - size: number，每页大小（默认 20）
- 响应：`ApiResponse<CreditQueryResponseDTO>`

调用示例：
```
curl 'http://ilikexff.cn/api/credits/me?includeTransactionHistory=true&page=0&size=20' \
  -H 'Authorization: Bearer <JWT>'
```
返回数据关键字段（部分）：
- email: 邮箱
- totalCredits / usedCredits / remainingCredits
- isActive: 账户是否激活
- recentTransactions: 最近交易（最多5条）
- transactionHistory: 分页交易（当 includeTransactionHistory=true）

成功响应示意（data 精简）：
```json
{
  "code": 200,
  "message": "查询积分信息成功",
  "data": {
    "email": "user@example.com",
    "isTrialUser": false,
    "totalCredits": 1200,
    "usedCredits": 200,
    "remainingCredits": 1000,
    "isActive": true,
    "recentTransactions": [
      {"id": 101, "type": "CONSUME", "amount": 20, "serviceCode": "OCR", "createdAt": "2024-11-08T12:00:00"}
    ],
    "transactionHistory": { "content": [ /* 同上结构 */ ], "totalElements": 12, "number": 0, "size": 20 }
  },
  "timestamp": 1731070000000
}
```

---

## 3. 统一响应体（简述）
`ApiResponse<T>`
- code: number（200=成功；400=参数错误；401=未授权；500=服务器错误）
- message: string
- data: T（泛型数据）
- timestamp: number（毫秒）

---

## 4. 前端对接流程（建议）
1) 用户输入许可证密钥（可选输入邮箱）
2) 调用 POST /auth/license-bootstrap → 获取 token 与用户信息
3) 将 token 持久化（localStorage/sessionStorage/内存）
4) 页面显示用户昵称/邮箱；请求积分页时：
   - 携带 Authorization: Bearer <token>
   - 调用 GET /credits/me，展示余额与交易（按需分页）
5) token 过期（24h）：
   - 收到 401 时提示重新登录（再次使用许可证引导登录）

---

## 5. 错误与异常处理
- 401：
  - token 缺失/失效 → 触发登录流程
  - 许可证登录时：许可证未激活或已过期
- 400：
  - 参数不合法（如分页 size<=0）
  - 许可证与邮箱不匹配
- 500：
  - 服务器内部错误，建议前端上报日志并提示“稍后再试”

---

## 6. 常见问题（FAQ）
- Q: 网页版是否需要 deviceFingerprint？
  - A: 不需要。网页端只查询正式积分（按邮箱）。
- Q: 我的接口前面要不要加 /api？
  - A: 默认配置下 context-path=/api，请在路径前加 /api。
- Q: Swagger 中为何有些接口显示需要授权？
  - A: 文档默认启用了全局 Bearer；认证类接口可直接调用，业务受 Spring Security 保护。

---

## 7. 附：关键接口定义位置
- 许可证登录：src/main/java/com/xuyi/blog/controller/AuthController.java → POST /auth/license-bootstrap
- 我的积分：src/main/java/com/xuyi/blog/controller/CreditController.java → GET /credits/me

