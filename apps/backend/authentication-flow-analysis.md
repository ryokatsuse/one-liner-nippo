# 認証フロー詳細解析

## 概要

One-liner Nippoの認証システムは、JWTトークンベースの認証を使用し、HTTP-onlyクッキーでセッション管理を行っています。この文書では、新規登録、ログイン、ログアウトの各処理がどのような順序でコードを実行するかを詳細に解説します。

## アーキテクチャ構成

### 関連ファイル
- `src/routes/auth.ts` - 認証エンドポイント
- `src/lib/auth.ts` - 認証ヘルパー関数
- `src/lib/jwt.ts` - JWTトークン処理
- `src/lib/password.ts` - パスワード暗号化処理

### 使用技術
- **JWT**: トークンベース認証
- **SHA-256**: パスワードハッシュ化
- **HTTP-only Cookie**: セキュアなセッション管理
- **Drizzle ORM**: データベース操作

---

## 1. 新規登録フロー（POST /api/auth/signup）

### リクエスト処理順序

#### 1.1 バリデーション層（`auth.ts:25`）
```typescript
app.post("/signup", zValidator("json", signupSchema), async (c) => {
```

**実行内容:**
- Zodスキーマによる入力検証
  - `username`: 3-20文字、英数字とアンダースコアのみ
  - `password`: 6-100文字
  - `displayName`: 50文字以下（オプション）

**コード経路:** `zValidator` → `signupSchema` 検証

#### 1.2 データベース接続（`auth.ts:26-27`）
```typescript
const { username, password, displayName } = c.req.valid("json");
const db = drizzle(c.env.DB);
```

**実行内容:**
- バリデーション済みデータの取得
- Cloudflare D1データベース接続の確立

#### 1.3 重複チェック（`auth.ts:30-39`）
```typescript
const existingUser = await db
  .select()
  .from(users)
  .where(eq(users.username, username))
  .get();

if (existingUser) {
  return c.json({ error: "Username already exists" }, 400);
}
```

**実行内容:**
- SQLクエリ: `SELECT * FROM users WHERE username = ?`
- 既存ユーザーの存在確認
- 重複時は400エラーで早期リターン

#### 1.4 パスワードハッシュ化（`auth.ts:42-43` → `password.ts:1-7`）
```typescript
const hashedPassword = await hashPassword(password);
```

**内部処理（`password.ts`）:**
```typescript
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();           // 1. UTF-8エンコード
  const data = encoder.encode(password);       // 2. バイト配列変換
  const hashBuffer = await crypto.subtle.digest("SHA-256", data); // 3. SHA-256ハッシュ
  const hashArray = Array.from(new Uint8Array(hashBuffer)); // 4. 配列変換
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join(""); // 5. Hex文字列変換
}
```

#### 1.5 ユーザー作成（`auth.ts:42-50`）
```typescript
const userId = nanoid();

await db.insert(users).values({
  id: userId,
  username,
  displayName: displayName || null,
  hashedPassword,
});
```

**実行内容:**
- `nanoid()`でユニークID生成
- SQLクエリ: `INSERT INTO users (id, username, display_name, hashed_password) VALUES (?, ?, ?, ?)`

#### 1.6 認証クッキー設定（`auth.ts:53` → `auth.ts:6-18` → `jwt.ts:11-19`）
```typescript
await setAuthCookie(c, userId, username);
```

**内部処理（`auth.ts:setAuthCookie`）:**
```typescript
const token = await createToken({ userId, username }, c.env.JWT_SECRET);

setCookie(c, "auth-token", token, {
  httpOnly: true,    // XSS防止
  secure: true,      // HTTPS必須
  sameSite: "Strict", // CSRF防止
  maxAge: 7 * 24 * 60 * 60, // 7日間
  path: "/",
});
```

**JWT生成（`jwt.ts:createToken`）:**
```typescript
const now = Math.floor(Date.now() / 1000);
const tokenPayload = {
  ...payload,
  iat: now,                    // 発行時刻
  exp: now + (7 * 24 * 60 * 60), // 7日後の期限
};

return await sign(tokenPayload, secret); // Hono JWT署名
```

#### 1.7 レスポンス返却（`auth.ts:55-62`）
```typescript
return c.json({
  success: true,
  user: {
    id: userId,
    username,
    displayName: displayName || null,
  },
});
```

---

## 2. ログインフロー（POST /api/auth/login）

### リクエスト処理順序

#### 2.1 バリデーション層（`auth.ts:69-70`）
```typescript
app.post("/login", zValidator("json", loginSchema), async (c) => {
  const { username, password } = c.req.valid("json");
```

**実行内容:**
- Zodスキーマによる入力検証（username, password必須）

#### 2.2 ユーザー検索（`auth.ts:75-82`）
```typescript
const user = await db
  .select()
  .from(users)
  .where(eq(users.username, username))
  .get();

if (!user) {
  return c.json({ error: "Invalid username or password" }, 400);
}
```

**実行内容:**
- SQLクエリ: `SELECT * FROM users WHERE username = ?`
- ユーザー存在確認（セキュリティ上、存在しない場合も同じエラーメッセージ）

#### 2.3 パスワード検証（`auth.ts:85-89` → `password.ts:9-12`）
```typescript
const validPassword = await verifyPassword(password, user.hashedPassword);
if (!validPassword) {
  return c.json({ error: "Invalid username or password" }, 400);
}
```

**内部処理（`password.ts:verifyPassword`）:**
```typescript
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const hashedPassword = await hashPassword(password); // 入力パスワードをハッシュ化
  return hashedPassword === hash; // DB保存ハッシュと比較
}
```

#### 2.4 認証クッキー設定（`auth.ts:92`）
```typescript
await setAuthCookie(c, user.id, user.username);
```

**実行内容:** 新規登録と同様のクッキー設定処理

#### 2.5 レスポンス返却（`auth.ts:94-101`）
```typescript
return c.json({
  success: true,
  user: {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
  },
});
```

---

## 3. ログアウトフロー（POST /api/auth/logout）

### リクエスト処理順序

#### 3.1 クッキー削除（`auth.ts:108-111` → `auth.ts:30-38`）
```typescript
app.post("/logout", async (c) => {
  try {
    clearAuthCookie(c);
    return c.json({ success: true });
```

**内部処理（`auth.ts:clearAuthCookie`）:**
```typescript
export function clearAuthCookie(c: Context) {
  setCookie(c, "auth-token", "", {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
    maxAge: 0,        // 即座に期限切れ
    path: "/",
  });
}
```

**実行内容:**
- クッキー値を空文字列に設定
- `maxAge: 0`で即座に無効化
- セキュリティ属性は保持

---

## 4. 認証状態確認フロー（GET /api/auth/me）

### リクエスト処理順序

#### 4.1 認証ユーザー取得（`auth.ts:118-124` → `auth.ts:20-28`）
```typescript
const authUser = await getAuthUser(c);

if (!authUser) {
  return c.json({ error: "Not authenticated" }, 401);
}
```

**内部処理（`auth.ts:getAuthUser`）:**
```typescript
export async function getAuthUser(c: Context<{ Bindings: Env }>): Promise<TokenPayload | null> {
  const token = getCookie(c, "auth-token"); // 1. クッキーからトークン取得

  if (!token) {
    return null; // 2. トークンなしの場合はnull
  }

  return await verifyToken(token, c.env.JWT_SECRET); // 3. JWT検証
}
```

#### 4.2 JWT検証（`jwt.ts:21-29`）
```typescript
export async function verifyToken(token: string, secret: string): Promise<TokenPayload | null> {
  try {
    const payload = await verify(token, secret) as unknown as TokenPayload;
    return payload;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null; // 検証失敗時はnull
  }
}
```

**検証内容:**
- JWT署名の正当性確認
- トークン期限(`exp`)の確認
- ペイロードの構造確認

#### 4.3 レスポンス返却（`auth.ts:126-131`）
```typescript
return c.json({
  user: {
    id: authUser.userId,
    username: authUser.username,
  },
});
```

---

## 5. セキュリティ考慮事項

### 5.1 パスワードセキュリティ
- **ハッシュ化**: SHA-256による不可逆暗号化
- **ソルト**: 現在未実装（改善点）
- **平文保存禁止**: パスワードは暗号化状態でのみ保存

### 5.2 セッション管理
- **HTTP-only**: JavaScriptからアクセス不可（XSS防止）
- **Secure**: HTTPS必須
- **SameSite=Strict**: CSRF攻撃防止
- **7日間期限**: 自動ログアウト

### 5.3 エラーハンドリング
- **統一エラーメッセージ**: ユーザー存在の有無を隠蔽
- **ログ出力**: サーバーサイドでのデバッグ情報記録
- **例外処理**: 予期しないエラーの適切な処理

---

## 6. データフロー図

```
新規登録:
Client → Validation → DB Check → Password Hash → User Insert → JWT Create → Cookie Set → Response

ログイン:
Client → Validation → User Query → Password Verify → JWT Create → Cookie Set → Response

ログアウト:
Client → Cookie Clear → Response

認証確認:
Client → Cookie Get → JWT Verify → Response
```

---

## 7. 改善提案

1. **パスワードセキュリティ強化**: bcryptやArgon2の使用を検討
2. **レート制限**: ブルートフォース攻撃対策
3. **セッション管理**: リフレッシュトークンの実装
4. **監査ログ**: ログイン試行の記録
5. **多要素認証**: セキュリティ層の追加
