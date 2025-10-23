# gas-webhook-spreadsheet-sync

外部サービスからの Webhook リクエストを受信し、  
Google スプレッドシートのデータを自動で追加・更新・削除（CRUD）する  
Google Apps Script プロジェクトです。

---

## ✨ 主な機能

- Webhook（POSTリクエスト）を受信して自動で処理
- Google スプレッドシートとリアルタイムにデータ同期
- レコードの **追加 / 更新 / 削除 / 上書き** に対応
- Webhook 検証（トークン / HMAC）対応可能

---

# 図解（データフロー）
- [外部サービス] ---> HTTP POST (Webhook) ---> [Apps Script (doPost)]
- |
- |-- 検証 (認証トークン / HMAC署名)
- |
- |-- ルーティング (action: append/update/delete/overwrite)
- |
- +--> [Spreadsheet 操作モジュール]
- ├─ getSpreadsheetByName()
- ├─ find / map id column
- ├─ setValues() / deleteRow() / clearContent()
- └─ ログ出力 (console.log / console.error)
- |
- +--> [レスポンス] (JSON: success / error)

> 補足：`Apps Script` は必要に応じて Cloud Logging にログを送ります。公開範囲を `全員（匿名）` にする場合は必ず認証／署名を実装してください。

---

# Webhook リクエスト例（JSON）

以下は各アクション別のサンプル JSON です。ヘッダには `Content-Type: application/json` を付けて POST してください。認証に `Authorization: Bearer <TOKEN>` を使う例も示します。

---

## 1) append（行を末尾に追加）
```json
{
  "action": "append",
  "fileName": " webhok",
  "sheetName": "Sheet1",
  "data": [
    ["2025-10-23", "注文123", "商品A", 3, 1500],
    ["2025-10-23", "注文124", "商品B", 1, 800]
  ]
}
```

---

## 2) update（存在する行を更新、idColumnIndex で判定）
```json
{
  "action": "update",
  "fileName": "webhook",
  "sheetName": "Sheet1",
  "idColumnIndex": 2, 
  "data": [
    ["2025-10-23", "注文123", "商品A（改）", 5, 1500],
    ["2025-10-23", "注文125", "商品C", 2, 1200]
  ]
}
```

> idColumnIndex はシート上のID列（1始まり）のインデックスです。上例では列2（注文ID）で存在判定をします。存在しなければ行を追加します。

---

## 3) delete（キーで行削除
```json
{
  "action": "delete",
  "fileName": "webhook",
  "sheetName": "Sheet1",
  "keyColumn": 2,
  "keyValue": "注文123"
}
```

---

## 4) overwrite（ヘッダーを残してデータを全部置き換え）
```json
{
  "action": "overwrite",
  "fileName": "webhook",
  "sheetName": "Sheet1",
  "data": [
    ["2025-10-23", "注文200", "商品X", 10, 500],
    ["2025-10-23", "注文201", "商品Y", 2, 2500]
  ]
}
```

> 実装はヘッダー行を残し、2行目以降を全削除してから新データを挿入します。

---

## 認証付きヘッダ例
- Content-Type: application/json
- Authorization: Bearer <SHARED_SECRET_TOKEN>
- X-Signature: sha256=<HMAC_HEX>   # 任意（HMAC検証を行う場合）
> HMAC 方式の検証をする場合は、X-Signature に sha256=<hex> の形でボディの HMAC を送ってもらい、Apps Script 側で検証します

---

## Webhook テスト（curl例）

> curl -X POST 'https://script.google.com/macros/s/XXXX/exec' \

>   -H 'Content-Type: application/json' \

>   -H 'Authorization: Bearer YOUR_SHARED_TOKEN' \

>   -d '{"action":"append","fileName":"webhook","sheetName":"Sheet1","data":[["a","b"]]}'


---

## 🧑‍💻 作者

**Ryohma U.**  
ポートフォリオ：[https://www.rnsystem.jp](https://www.rnsystem.jp)

---

> 💡 **補足**  
> このコードは教育・学習目的で公開しています。  
> 実運用時は必ずテーマ構成やメタオブジェクト名を各店舗環境に合わせて変更してください。
