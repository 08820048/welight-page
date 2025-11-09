# AI服务积分计费系统API接口文档

## 概述

本文档描述了ApexBlog系统中AI服务积分计费系统的API接口，分为**应用端接口**和**管理后台接口**两个部分：

- **应用端接口**：面向最终用户的接口，包括积分套餐购买、积分消费、积分查询、试用期积分体验等功能
- **管理后台接口**：面向管理员的接口，包括积分发送、用户积分查询、AI服务配置管理等功能

## 目录

### 第一部分：应用端接口
- [一、积分套餐管理接口](#一积分套餐管理接口)
- [二、积分消费接口](#二积分消费接口)
- [三、积分查询接口](#三积分查询接口)
- [四、AI服务配置接口](#四ai服务配置接口)
- [五、试用期积分接口](#五试用期积分接口)

### 第二部分：管理后台接口
- [六、管理员积分管理接口](#六管理员积分管理接口)
- [七、管理员AI服务配置接口](#七管理员ai服务配置接口)

### 其他
- [八、AI服务枚举列表](#八ai服务枚举列表)
- [九、错误码说明](#九错误码说明)
- [十、使用示例](#十使用示例)
- [十一、注意事项](#十一注意事项)

### 基础信息

- **基础URL**: `https://ilikexff.cn/api`
- **认证方式**: JWT Bearer Token（管理后台接口需要）
- **内容类型**: `application/json`
- **字符编码**: `UTF-8`
- **开发环境**: `http://localhost:8888/api`（仅用于本地开发测试）

### 响应格式

所有接口都使用统一的响应格式：

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {},
  "timestamp": 1704067200000
}
```

## 第一部分：应用端接口

> 应用端接口面向最终用户，无需管理员权限，主要用于积分购买、消费和查询等功能。

## 一、积分套餐管理接口

### 1.1 获取积分套餐列表

**接口地址**: `GET /credits/packages`

**接口描述**: 获取所有可用的积分套餐信息

**请求参数**: 无

**响应示例**:
```json
{
  "code": 200,
  "message": "获取积分套餐成功",
  "data": [
    {
      "code": "CREDITS_200",
      "name": "基础套餐",
      "description": "200积分套餐，适合轻度使用",
      "credits": 200,
      "price": 10.00,
      "originalPrice": 10.00,
      "pricePerCredit": 0.05,
      "packageType": "BASIC",
      "isRecommended": false,
      "savings": 0.00,
      "discountPercentage": 0,
      "isActive": true,
      "sortOrder": 1
    },
    {
      "code": "CREDITS_500",
      "name": "标准套餐",
      "description": "500积分套餐，性价比最高",
      "credits": 500,
      "price": 25.00,
      "originalPrice": 25.00,
      "pricePerCredit": 0.05,
      "packageType": "STANDARD",
      "isRecommended": true,
      "savings": 0.00,
      "discountPercentage": 0,
      "isActive": true,
      "sortOrder": 2
    }
  ],
  "timestamp": 1704067200000
}
```

### 1.2 获取积分套餐详情

**接口地址**: `GET /credits/packages/{code}`

**接口描述**: 根据套餐代码获取积分套餐详细信息

**路径参数**:
- `code` (string): 套餐代码，如 "CREDITS_200"

**响应示例**:
```json
{
  "code": 200,
  "message": "获取积分套餐详情成功",
  "data": {
    "code": "CREDITS_200",
    "name": "基础套餐",
    "description": "200积分套餐，适合轻度使用",
    "credits": 200,
    "price": 10.00,
    "pricePerCredit": 0.05,
    "packageType": "BASIC",
    "isRecommended": false,
    "isActive": true
  },
  "timestamp": 1704067200000
}
```

### 1.3 购买积分套餐

**接口地址**: `POST /credits/purchase`

**接口描述**: 购买积分套餐，创建支付订单

**请求体**:
```json
{
  "packageType": "STANDARD",
  "customCredits": null,
  "customerEmail": "user@example.com",
  "customerName": "张三",
  "paymentMethod": "WECHAT_PAY"
}
```

**请求参数说明**:
- `packageType` (string): 套餐类型，可选值：BASIC, STANDARD, PREMIUM, CUSTOM
- `customCredits` (integer): 自定义积分数量（仅当packageType为CUSTOM时需要）
- `customerEmail` (string): 客户邮箱
- `customerName` (string): 客户姓名
- `paymentMethod` (string): 支付方式

**响应示例**:
```json
{
  "code": 200,
  "message": "积分套餐购买订单创建成功",
  "data": {
    "orderId": 12345,
    "packageType": "STANDARD",
    "credits": 500,
    "amount": 25.00,
    "customerEmail": "user@example.com",
    "paymentMethod": "WECHAT_PAY",
    "orderStatus": "PENDING_PAYMENT",
    "createdAt": "2024-01-01T12:00:00"
  },
  "timestamp": 1704067200000
}
```

### 1.4 计算自定义套餐价格

**接口地址**: `GET /credits/calculate-price`

**接口描述**: 计算自定义积分数量的价格

**查询参数**:
- `credits` (integer): 积分数量

**响应示例**:
```json
{
  "code": 200,
  "message": "价格计算成功",
  "data": {
    "credits": 300,
    "price": 15.00,
    "pricePerCredit": 0.05,
    "packageType": "CUSTOM"
  },
  "timestamp": 1704067200000
}
```

## 二、积分消费接口

### 2.1 消费积分

**接口地址**: `POST /credits/consume`

**接口描述**: 使用AI服务时消费积分

**请求体**:
```json
{
  "email": "user@example.com",
  "serviceCode": "TRANSLATE",
  "aiModel": "gpt-4",
  "deviceFingerprint": null,
  "description": "翻译文档",
  "clientInfo": "Web Client v1.0",
  "isTrialUser": false
}
```

**请求参数说明**:
- `email` (string): 用户邮箱
- `serviceCode` (string): AI服务代码
- `aiModel` (string): AI模型（可选）
- `deviceFingerprint` (string): 设备指纹（试用期用户必需）
- `description` (string): 请求描述（可选）
- `clientInfo` (string): 客户端信息（可选）
- `isTrialUser` (boolean): 是否为试用期用户

**响应示例**:
```json
{
  "code": 200,
  "message": "积分消费成功",
  "data": {
    "success": true,
    "email": "user@example.com",
    "serviceCode": "TRANSLATE",
    "serviceName": "翻译",
    "creditsConsumed": 10,
    "balanceBefore": 500,
    "balanceAfter": 490,
    "isTrialConsume": false,
    "transactionId": 67890,
    "consumeTime": "2024-01-01T12:00:00",
    "message": "积分消费成功",
    "accountStatusTip": "积分余额充足"
  },
  "timestamp": 1704067200000
}
```

## 三、积分查询接口

### 3.1 查询积分信息

**接口地址**: `POST /credits/query`

**接口描述**: 查询用户积分余额和交易历史

**请求体**:
```json
{
  "email": "user@example.com",
  "deviceFingerprint": null,
  "isTrialUser": false,
  "includeTransactionHistory": true,
  "page": 0,
  "size": 10
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "查询积分信息成功",
  "data": {
    "email": "user@example.com",
    "isTrialUser": false,
    "totalCredits": 500,
    "usedCredits": 10,
    "remainingCredits": 490,
    "isActive": true,
    "accountLevel": "银牌",
    "usageRate": 0.02,
    "creditStatusDescription": "积分余额充足",
    "creditStatusColor": "green",
    "accountStatusTip": "积分余额充足",
    "queryTime": "2024-01-01T12:00:00",
    "transactionHistory": {
      "content": [
        {
          "id": 67890,
          "transactionType": "CONSUME",
          "creditsAmount": -10,
          "serviceCode": "TRANSLATE",
          "serviceName": "翻译",
          "balanceBefore": 500,
          "balanceAfter": 490,
          "createdAt": "2024-01-01T12:00:00",
          "description": "使用翻译服务"
        }
      ],
      "totalElements": 1,
      "totalPages": 1,
      "size": 10,
      "number": 0
    }
  },
  "timestamp": 1704067200000
}
```

### 3.2 简单查询积分余额

**接口地址**: `GET /credits/query/{email}`

**接口描述**: 通过GET方式查询用户积分余额

**路径参数**:
- `email` (string): 用户邮箱

**查询参数**:
- `deviceFingerprint` (string): 设备指纹（试用期用户）
- `isTrialUser` (boolean): 是否为试用期用户，默认false

**响应示例**:
```json
{
  "code": 200,
  "message": "查询积分余额成功",
  "data": {
    "email": "user@example.com",
    "isTrialUser": false,
    "totalCredits": 500,
    "usedCredits": 10,
    "remainingCredits": 490,
    "isActive": true,
    "accountLevel": "银牌",
    "creditStatusDescription": "积分余额充足",
    "queryTime": "2024-01-01T12:00:00"
  },
  "timestamp": 1704067200000
}
```

## 四、AI服务配置接口

### 4.1 获取AI服务配置

**接口地址**: `GET /ai-services/configs`

**接口描述**: 获取所有AI服务配置列表

**查询参数**:
- `activeOnly` (boolean): 是否只获取启用的配置，默认false

**响应示例**:
```json
{
  "code": 200,
  "message": "获取AI服务配置成功",
  "data": [
    {
      "id": 1,
      "serviceCode": "TRANSLATE",
      "serviceName": "翻译",
      "serviceDescription": "文本翻译服务",
      "creditsPerUse": 10,
      "isActive": true,
      "sortOrder": 1,
      "serviceType": "TRANSLATE",
      "serviceTypeDescription": "翻译服务",
      "usageLevel": "高频使用",
      "costLevel": "低成本",
      "createdAt": "2024-01-01T12:00:00",
      "updatedAt": "2024-01-01T12:00:00"
    }
  ],
  "timestamp": 1704067200000
}
```

### 4.2 获取服务积分消耗

**接口地址**: `GET /ai-services/configs/{serviceCode}/credits`

**接口描述**: 根据服务代码获取该服务的积分消耗

**路径参数**:
- `serviceCode` (string): 服务代码

**响应示例**:
```json
{
  "code": 200,
  "message": "获取服务积分消耗成功",
  "data": 10,
  "timestamp": 1704067200000
}
```

## 五、试用期积分接口

### 5.1 初始化试用期积分

**接口地址**: `POST /trial-credits/init`

**接口描述**: 为新用户初始化试用期积分账户

**请求体**:
```json
{
  "email": "newuser@example.com",
  "deviceFingerprint": "fp_abc123def456",
  "clientInfo": "Web Client v1.0",
  "userAgent": "Mozilla/5.0...",
  "ipAddress": "192.168.1.1",
  "referrerEmail": null
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "试用期积分初始化成功",
  "data": {
    "success": true,
    "email": "newuser@example.com",
    "deviceFingerprint": "fp_abc123def456",
    "isNewUser": true,
    "trialCreditsGranted": 100,
    "totalCredits": 100,
    "remainingCredits": 100,
    "trialAccountId": 123,
    "transactionId": 456,
    "initTime": "2024-01-01T12:00:00",
    "message": "试用期积分初始化成功",
    "usageTip": "欢迎体验！您有 100 个试用期积分，可以体验各种AI服务",
    "upgradeRecommendation": "试用期积分有限，建议购买积分套餐获得更多服务"
  },
  "timestamp": 1704067200000
}
```

### 5.2 检查试用期积分可用性

**接口地址**: `GET /trial-credits/available/{deviceFingerprint}`

**接口描述**: 检查指定设备是否还有试用期积分可用

**路径参数**:
- `deviceFingerprint` (string): 设备指纹

**响应示例**:
```json
{
  "code": 200,
  "message": "试用期积分可用",
  "data": true,
  "timestamp": 1704067200000
}
```

### 5.3 试用期积分消费

**接口地址**: `POST /trial-credits/consume`

**接口描述**: 使用试用期积分进行AI服务消费

**请求体**:
```json
{
  "email": "newuser@example.com",
  "serviceCode": "TRANSLATE",
  "deviceFingerprint": "fp_abc123def456",
  "description": "试用翻译服务",
  "isTrialUser": true
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "试用期积分消费成功",
  "data": {
    "success": true,
    "email": "newuser@example.com",
    "serviceCode": "TRANSLATE",
    "serviceName": "翻译",
    "creditsConsumed": 10,
    "balanceBefore": 100,
    "balanceAfter": 90,
    "isTrialConsume": true,
    "deviceFingerprint": "fp_abc123def456",
    "transactionId": 789,
    "consumeTime": "2024-01-01T12:00:00",
    "message": "试用期积分消费成功",
    "accountStatusTip": "试用期剩余 90 积分"
  },
  "timestamp": 1704067200000
}
```

---

## 第二部分：管理后台接口

> 管理后台接口面向系统管理员，需要管理员权限（JWT Token），用于积分管理、用户查询、系统配置等功能。

## 六、管理员积分管理接口

### 6.1 管理员发送积分

**接口地址**: `POST /admin/credits/grant`

**接口描述**: 管理员向指定用户发送积分

**请求头**: `Authorization: Bearer {jwt_token}`

**请求体**:
```json
{
  "targetEmail": "user@example.com",
  "creditsAmount": 100,
  "reason": "用户反馈奖励",
  "adminEmail": "admin@example.com",
  "adminName": "管理员",
  "grantType": "REWARD",
  "sendNotificationEmail": true
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "积分发送成功",
  "data": {
    "success": true,
    "targetEmail": "user@example.com",
    "creditsAmount": 100,
    "balanceBefore": 490,
    "balanceAfter": 590,
    "reason": "用户反馈奖励",
    "adminEmail": "admin@example.com",
    "adminName": "管理员",
    "grantType": "REWARD",
    "grantTypeDescription": "奖励发送",
    "transactionId": 999,
    "grantTime": "2024-01-01T12:00:00",
    "notificationEmailSent": true,
    "message": "积分发送成功",
    "accountStatusTip": "积分余额充足"
  },
  "timestamp": 1704067200000
}
```

### 6.2 管理员查询用户积分

**接口地址**: `GET /admin/credits/query/{email}`

**接口描述**: 管理员查询指定用户的积分信息

**请求头**: `Authorization: Bearer {jwt_token}`

**路径参数**:
- `email` (string): 用户邮箱

**查询参数**:
- `includeHistory` (boolean): 是否包含交易历史，默认true
- `page` (integer): 页码，默认0
- `size` (integer): 页大小，默认20

**响应示例**: 同积分查询接口

### 6.3 用户积分列表管理

**接口地址**: `GET /admin/credits/users`

**接口描述**: 分页获取所有用户的积分情况，支持搜索和筛选

**请求头**: `Authorization: Bearer {jwt_token}`

**查询参数**:
- `page` (int, 可选): 页码，默认0
- `size` (int, 可选): 每页大小，默认20
- `email` (string, 可选): 邮箱关键词搜索
- `status` (string, 可选): 积分状态筛选
  - `active`: 激活的账户
  - `inactive`: 未激活的账户
  - `has_credits`: 有积分余额的账户
  - `no_credits`: 积分为0的账户

**响应示例**:
```json
{
  "code": 200,
  "message": "获取用户积分列表成功",
  "data": {
    "content": [
      {
        "email": "user1@example.com",
        "totalCredits": 1000,
        "usedCredits": 200,
        "remainingCredits": 800,
        "isActive": true,
        "createdAt": "2024-01-01T12:00:00",
        "updatedAt": "2024-01-15T10:30:00"
      }
    ],
    "totalElements": 150,
    "totalPages": 8
  }
}
```

### 6.4 试用期用户列表

**接口地址**: `GET /admin/credits/trial-users`

**接口描述**: 分页获取所有试用期用户的积分情况

**请求头**: `Authorization: Bearer {jwt_token}`

**查询参数**:
- `page` (int, 可选): 页码，默认0
- `size` (int, 可选): 每页大小，默认20
- `deviceFingerprint` (string, 可选): 设备指纹关键词搜索

**响应示例**:
```json
{
  "code": 200,
  "message": "获取试用期用户列表成功",
  "data": {
    "content": [
      {
        "deviceFingerprint": "fp_abc123def456",
        "totalCredits": 100,
        "usedCredits": 30,
        "remainingCredits": 70,
        "isActive": true,
        "createdAt": "2024-01-01T12:00:00"
      }
    ],
    "totalElements": 80,
    "totalPages": 4
  }
}
```

### 6.5 更新用户积分状态

**接口地址**: `PUT /admin/credits/users/{email}/status`

**接口描述**: 启用或禁用用户积分账户

**请求头**: `Authorization: Bearer {jwt_token}`

**路径参数**:
- `email` (string): 用户邮箱

**查询参数**:
- `isActive` (boolean): 是否激活

**响应示例**:
```json
{
  "code": 200,
  "message": "用户积分账户已禁用",
  "data": null
}
```

### 6.6 重置用户积分

**接口地址**: `PUT /admin/credits/users/{email}/reset`

**接口描述**: 重置用户的积分余额（危险操作）

**请求头**: `Authorization: Bearer {jwt_token}`

**路径参数**:
- `email` (string): 用户邮箱

**查询参数**:
- `reason` (string): 管理员备注

**响应示例**:
```json
{
  "code": 200,
  "message": "用户积分已重置",
  "data": null
}
```

## 七、管理员AI服务配置接口

### 7.1 创建AI服务配置

**接口地址**: `POST /admin/ai-services/configs`

**接口描述**: 管理员创建新的AI服务配置

**请求头**: `Authorization: Bearer {jwt_token}`

**请求体**:
```json
{
  "serviceCode": "NEW_SERVICE",
  "serviceName": "新服务",
  "serviceDescription": "新的AI服务",
  "creditsPerUse": 15,
  "isActive": true,
  "sortOrder": 100
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "AI服务配置创建成功",
  "data": {
    "id": 12,
    "serviceCode": "NEW_SERVICE",
    "serviceName": "新服务",
    "serviceDescription": "新的AI服务",
    "creditsPerUse": 15,
    "isActive": true,
    "sortOrder": 100,
    "usageLevel": "中频使用",
    "costLevel": "中成本",
    "createdAt": "2024-01-01T12:00:00",
    "updatedAt": "2024-01-01T12:00:00"
  },
  "timestamp": 1704067200000
}
```

## 八、AI服务枚举列表

### 8.1 可用的AI服务类型

以下是系统中所有可用的AI服务类型及其默认积分消耗：

| 服务代码 | 服务名称 | 积分消耗 | 服务描述 |
|---------|---------|---------|---------|
| `TRANSLATE` | 翻译 | 10积分 | 多语言文本翻译服务 |
| `CONTINUE_WRITING` | 续写 | 15积分 | 基于给定文本进行智能续写 |
| `POLISH` | 润色 | 12积分 | 文本语言润色和表达改进 |
| `SUMMARIZE` | 摘要 | 8积分 | 提取文本关键信息生成摘要 |
| `QA` | 问答 | 10积分 | 基于上下文的智能问答 |
| `CODE_GENERATION` | 代码生成 | 20积分 | 根据需求生成程序代码 |
| `CODE_EXPLANATION` | 代码解释 | 15积分 | 分析解释程序代码功能 |
| `TEXT_CLASSIFICATION` | 文本分类 | 8积分 | 文本内容分类和标签识别 |
| `KEYWORD_EXTRACTION` | 关键词提取 | 6积分 | 提取文本重要关键词 |
| `GRAMMAR_CHECK` | 语法检查 | 5积分 | 检查语法错误并提供建议 |
| `CREATIVE_WRITING` | 创意写作 | 25积分 | 基于主题进行创意内容创作 |

### 8.2 服务积分消耗等级

- **低消耗 (5-8积分)**: 语法检查、关键词提取、摘要、文本分类
- **中等消耗 (10-15积分)**: 翻译、问答、润色、续写、代码解释
- **高消耗 (20-25积分)**: 代码生成、创意写作

### 8.3 获取服务列表

应用端可以通过以下接口动态获取最新的服务列表：

```javascript
// 获取所有启用的AI服务
const response = await fetch('/api/ai-services/configs?activeOnly=true');
const services = await response.json();
```

> 💡 **建议**: 应用端应该通过API动态获取服务列表，而不是硬编码，以确保获取最新的服务配置。

## 九、错误码说明

### 9.1 通用错误码
| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| 200 | 操作成功 | - |
| 400 | 请求参数错误 | 检查请求参数格式和必填项 |
| 401 | 未授权 | 检查token是否有效或重新登录 |
| 403 | 权限不足 | 确认用户具有管理员权限 |
| 404 | 资源不存在 | 检查请求的资源是否存在 |
| 500 | 服务器内部错误 | 联系技术支持 |

### 9.2 积分系统特定错误
| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| 2001 | 积分不足 | 购买积分套餐或使用试用期积分 |
| 2002 | 试用期积分已用完 | 购买积分套餐继续使用 |
| 2003 | AI服务不存在或已禁用 | 检查服务代码是否正确 |
| 2004 | 设备指纹无效 | 重新生成设备指纹 |
| 2005 | 积分套餐不存在 | 检查套餐代码是否正确 |

## 十、使用示例

### 10.1 完整的积分购买和使用流程

```javascript
// 1. 获取积分套餐列表
const packages = await fetch('/api/credits/packages').then(r => r.json());

// 2. 购买积分套餐
const purchaseResponse = await fetch('/api/credits/purchase', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    packageType: 'STANDARD',
    customerEmail: 'user@example.com',
    customerName: '张三',
    paymentMethod: 'WECHAT_PAY'
  })
});

// 3. 支付成功后，消费积分
const consumeResponse = await fetch('/api/credits/consume', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    serviceCode: 'TRANSLATE',
    description: '翻译文档',
    isTrialUser: false
  })
});

// 4. 查询积分余额
const balanceResponse = await fetch('/api/credits/query/user@example.com');
```

### 10.2 试用期积分使用流程

```javascript
// 1. 初始化试用期积分
const initResponse = await fetch('/api/trial-credits/init', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'newuser@example.com',
    deviceFingerprint: 'fp_abc123def456',
    clientInfo: 'Web Client v1.0'
  })
});

// 2. 使用试用期积分
const consumeResponse = await fetch('/api/trial-credits/consume', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'newuser@example.com',
    serviceCode: 'TRANSLATE',
    deviceFingerprint: 'fp_abc123def456',
    isTrialUser: true
  })
});

// 3. 查询试用期积分余额
const balanceResponse = await fetch('/api/trial-credits/balance/fp_abc123def456');
```

## 十一、注意事项

1. **设备指纹**: 试用期用户必须提供有效的设备指纹，用于标识唯一设备
2. **积分消费**: 每次AI服务调用前都需要先消费积分，消费成功后才能使用服务
3. **交易记录**: 所有积分操作都会记录详细的交易历史，便于审计和查询
4. **试用期限制**: 每个设备指纹只能获得一次试用期积分（100积分）
5. **管理员权限**: 管理后台接口需要管理员权限，需要在请求头中携带有效的JWT token
6. **异步处理**: 积分购买涉及支付流程，需要处理异步回调通知
7. **错误处理**: 客户端应该妥善处理各种错误情况，特别是积分不足的情况

## 十二、更新日志

- **v1.0.0** (2024-01-01): 初始版本，包含基础的积分购买、消费、查询功能
- **v1.1.0** (2024-01-02): 新增试用期积分功能
- **v1.2.0** (2024-01-03): 新增管理后台积分管理功能
- **v1.3.0** (2024-01-04): 新增AI服务配置管理功能
