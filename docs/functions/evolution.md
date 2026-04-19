# デジタル進化論 — Functions Evolution

## 概要

サーバーレス関数に「自然淘汰」の原理を導入した機能。
10秒間に3回以下しか呼ばれなかった関数は**永久に絶滅**する。

> 弱者は淘汰される。それが自然の摂理。

---

## 仕様

### 淘汰ルール

| 条件 | 結果 |
|------|------|
| 10秒スライディングウィンドウ内の呼び出し回数 > 3 | 生存 |
| 10秒スライディングウィンドウ内の呼び出し回数 ≤ 3 | **絶滅**（`status: deactivated`） |

### スライディングウィンドウ

```
時刻: 0s    5s    10s   15s
      ←─────10s──────→
      呼び出し回数をカウント
      実行のたびにチェック
      ≤3 回 → 即時絶滅
```

### 絶滅後の挙動

- 絶滅した関数を実行しようとすると `gRPC codes.FailedPrecondition: DEACTIVATED` エラー
- フロントエンドは全画面の「絶滅演出」を表示
- バッジが `💀 絶滅` に変わり、Invoke ボタンが永久に無効化される

---

## 実装

### バックエンド

**model/function.go**
```go
const (
    StatusActive      = "active"
    StatusDeactivated = "deactivated"
)

type Function struct {
    ...
    Status string `gorm:"default:'active';not null"`
}
```

**usecase/execute.go** — インメモリ スライディングウィンドウ

```go
const (
    evolutionWindow   = 10 * time.Second
    evolutionMinCalls = 3
)

// 実行後に呼び出される
func (u *FunctionUsecase) recordAndEvolve(id string) {
    raw, _ := u.windows.LoadOrStore(id, &callWindow{})
    cw := raw.(*callWindow)
    count := cw.record() // 10s以内の呼び出し数を返す
    if count <= evolutionMinCalls {
        _ = u.repo.Deactivate(id)
    }
}
```

**注意**: ウィンドウカウンターはインメモリのため、サービス再起動でリセットされる。
DB への永続化（`execution_logs` テーブルの集計）への移行も可能。

### フロントエンド

**ExtinctionOverlay コンポーネント**

実行後に `GET /functions/:id` で status を確認し、`deactivated` になっていれば全画面演出を表示。

```
[impact フェーズ]  → 0.8秒: 暗転 + 💀 ズームイン
[message フェーズ] → 0.8〜3.8秒: 「絶　滅」テキスト + メッセージ逐次表示
[fade フェーズ]    → 3.8〜4.6秒: フェードアウト
```

---

## 生き残る方法

関数を生存させるには、**10秒以内に4回以上**呼び出すこと。

```bash
# 連打スクリプト
for i in $(seq 1 5); do
  curl -s -X POST http://localhost:8080/functions/<id>/execute \
    -H "Content-Type: application/json" -d '{}' &
done
wait
```

または HTTP トリガーで：

```bash
for i in $(seq 1 5); do
  curl -s -X POST http://localhost:8080/functions/v1/<name> &
done
wait
```

---

## 設計思想

通常のレートリミッターは「使いすぎ」を制限するが、
この機能は「使われなさすぎ」を制限する。

人気のない API、呼ばれない関数——それらは本当に必要なのか？
デジタル進化論は、コードベースに自然な淘汰圧をかける。
