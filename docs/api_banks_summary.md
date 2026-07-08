# СВКА — Сводная документация банковских REST API
# Версия: 1.0 | Дата: 2026-07-07

---

## Обзор

| Банк | API | Назначение для СВКА | Статус |
|---|---|---|---|
| Optima Bank | Business API | Остатки по счетам, входящие QR/POS | ✅ Работает (тест) |
| Айыл Банк | Open API (RKO) | Выписка счёта (входящие + исходящие) | ⚠️ Хост уточняется |
| Айыл Банк | Business Client API | Баланс по счёту | ✅ Работает (stage) |

> ⚠️ **Критично для СВКА:** Ни один из задокументированных API не предоставляет выписку исходящих платежей поставщикам от Optima Bank. Основной источник исходящих — **Айыл Банк Open RKO API**. Наличие аналогичного endpoint у Optima уточняется.

---

## 1. Optima Bank — Business API

### Реквизиты подключения

| Параметр | Значение |
|---|---|
| Base URL (прод) | `https://api.optimabusiness.kg` |
| Base URL (тест) | `https://test-ob.optimabank.kg` |
| Auth | `X-API-KEY: <ключ>` header ✅ |
| SSL | `verify=False` / `-k` (проблема сертификата на стороне банка) |
| Ключ создаёт | Только **первый подписант** в Optima Business |
| Airflow Variable | `SVKA_OPTIMA_API_KEY` |

> ✅ Auth header `X-API-KEY` подтверждён live-тестом — даёт `200 OK` на тест-сервере.

### Категории API-ключа

| # | Категория | Endpoint |
|---|---|---|
| 4 | Выписка по POS и QR-платежам | `GET /api/v1/get-pos-operation-statement` |
| 5 | Выписка по QR-платежам | `GET /api/v1/get-qr-operation-statement` |
| 6 | Остатки по счетам | `GET /api/v1/get-account-infos-by-filter` |

> Ключ без нужной категории → `500`. Один ключ = одна категория.

---

### Endpoint 1 — Остатки по счетам ✅

```
GET /api/v1/get-account-infos-by-filter
```

**Параметры запроса**

| Параметр | Тип | Обязательный | Описание |
|---|---|---|---|
| `currencyIsoCodes` | String | Да | Валюты: `KGS,USD` |
| `legalPartyId` | String | Да | ID компании в системе Optima (не ИНН) |

**Пример**
```bash
curl -X GET \
  "https://test-ob.optimabank.kg/api/v1/get-account-infos-by-filter?currencyIsoCodes=KGS&legalPartyId=373384" \
  -H "X-API-KEY: your_key" -k
```

**Ответ**
```json
[
  { "account": "1090820902160229", "type": "RKO", "currencyIsoCode": "KGS", "balance": 46898.42, "plannedBalance": 46898.42 },
  { "account": "1091820935410262", "type": "RKO", "currencyIsoCode": "KGS", "balance": 0.0,     "plannedBalance": 0.0 },
  { "account": "1090820287870141", "type": "RKO", "currencyIsoCode": "KGS", "balance": 23943.12, "plannedBalance": 23943.12 }
]
```

> Live-тест 2026-06-25: **200 OK**, 3 RKO-счёта получены.

---

### Endpoint 2 — Выписка по POS и QR (ВХОДЯЩИЕ) ⚠️

```
GET /api/v1/get-pos-operation-statement
```

> Только входящие платежи (клиенты платят компании). Для сверки исходящих не подходит.

**Параметры запроса**

| Параметр | Тип | Обязательный | Описание |
|---|---|---|---|
| `startDate` | String (yyyy-MM-dd) | Да | Начало периода |
| `endDate` | String (yyyy-MM-dd) | Да | Конец периода (**макс. 14 дней**) |
| `accountNumber` | String | Да | Номер счёта получателя |

**Ключевые поля ответа `posOperations[]`**

| Поле | Описание |
|---|---|
| `operationProcessedDateTime` | Дата и время транзакции |
| `operationTransferDate` | Дата зачисления |
| `requisite` | ⚠️ Маскированный номер карты клиента — НЕ реквизиты поставщика |
| `operationSum` | Сумма транзакции |
| `operationTransferSum` | Сумма после комиссии |
| `posTerminalCode` | Код POS-терминала |

> Live-тест: `401` — нужна категория 4 ключа.

---

### Endpoint 3 — Выписка по QR (ВХОДЯЩИЕ) ⚠️

```
GET /api/v1/get-qr-operation-statement
```

**Параметры запроса**

| Параметр | Тип | Обязательный | Описание |
|---|---|---|---|
| `legalPartyId` | String | Да | ID компании |
| `startDate` | String (yyyy-MM-dd) | Да | Начало периода (макс. 14 дней) |
| `endDate` | String (yyyy-MM-dd) | Да | Конец периода |
| `salePointCodes` | String | Да | Коды торговых точек: `1,2` |

**Ключевые поля ответа `qrOperations[]`**

| Поле | Описание |
|---|---|
| `stan` | Номер чека |
| `requisite` | Номер счёта плательщика (не маскирован для QR) |
| `operationName` | `"Платеж по OptimaQR от Иван И."` |
| `operationSum` | Сумма транзакции |
| `description` | Назначение платежа |

---

### Известные ошибки Optima API

| HTTP | Ситуация |
|---|---|
| 401 | Неверный ключ или неверный header name |
| 500 | Ключ не той категории |
| 403 | Ключ не связан с `legalPartyId` |
| 400 | Отсутствуют обязательные параметры |

---

### Открытые вопросы Optima

| Вопрос | Статус |
|---|---|
| Есть ли endpoint выписки РС (исходящие переводы поставщикам)? | ❓ Уточнить у банка |
| Использует ли СВКА Optima для исходящих или только Айыл Банк? | ❓ Уточнить на встрече |

**Поддержка Optima Bank:** WhatsApp +996 990 905 959 · Telegram +996 551 141 490 · Тел. +996 312 670 779

---

## 2. Айыл Банк — Open API (RKO)

### Реквизиты подключения

| Параметр | Значение |
|---|---|
| Base URL | `http://<host>:8085` (**хост уточняется у банка**) |
| Auth | `apiKey: <ключ>` header (статический) |
| SSL | HTTP — без TLS |
| Airflow Variable | `SVKA_AYIL_BANK_API_KEY` |

---

### Endpoint 1 — Балансы по всем счетам

```
GET /api/rko/open-api/all-accounts-balance
```

**Пример**
```bash
curl -X GET "http://<host>:8085/api/rko/open-api/all-accounts-balance" \
  -H "apiKey: your_key"
```

**Ответ**
```json
[
  { "id": "uuid", "taccount": "XXXX", "nameAccount": "ООО Название", "codeCurrency": "417", "balance": 18869426.90 },
  { "id": "uuid", "taccount": "XXXX", "nameAccount": "ООО Название", "codeCurrency": "840", "balance": 5171062.37 }
]
```

> Коды валют: `417` = KGS, `840` = USD

---

### Endpoint 2 — Баланс по одному счёту

```
GET /api/rko/open-api/balance?account=<номер>
```

**Ответ**
```json
{ "balanceAmount": 18869426.90 }
```

---

### Endpoint 3 — Выписка по счёту ✅ (основной для СВКА)

```
GET /api/rko/open-api/account-statement
```

> ⚠️ Метод GET, но параметры передаются в **теле запроса** (JSON body), не в query string.

**Headers**

| Заголовок | Значение |
|---|---|
| `apiKey` | API-ключ |
| `Content-Type` | `application/json` |

**Тело запроса**

| Поле | Тип | Обязательный | Описание |
|---|---|---|---|
| `guid` | UUID | Да | Генерировать `uuid4()` на каждый запрос |
| `account` | String | Да | Номер счёта |
| `cts` | String (dd.MM.yyyy) | Да | Начало периода |
| `dts` | String (dd.MM.yyyy) | Да | Конец периода |
| `pageid` | Integer | Да | Номер страницы (с 1) |
| `pagesize` | Integer | Да | Размер страницы (рекомендуется 1000) |

**Пример**
```bash
curl -X GET "http://<host>:8085/api/rko/open-api/account-statement" \
  -H "apiKey: your_key" \
  -H "Content-Type: application/json" \
  -d '{"guid":"550e8400-e29b-41d4-a716-446655440000","account":"XXXX","cts":"01.06.2026","dts":"30.06.2026","pageid":1,"pagesize":1000}'
```

**Ключевые поля ответа `row[]`**

| Поле | Описание | Для сверки |
|---|---|---|
| `amount` | Сумма операции | ✅ |
| `currency` | Валюта | ✅ |
| `payType` | `Приход` / `Расход` | ✅ фильтр: `Расход` |
| `state` | Статус | ✅ фильтр: `PROV_IN_BANK` |
| `ground` | Назначение платежа | ✅ → LLM парсинг |
| `receiverName` | Получатель | ✅ → fuzzy matching |
| `receiverInn` | ИНН получателя | ✅ → точное совпадение |
| `payerName` | Плательщик | |
| `payerInn` | ИНН плательщика | |
| `docNumber` | Номер документа | |
| `payDate` | Дата платежа | ✅ |
| `tranDate` | Дата транзакции в банке | |

**Пагинация:** увеличивать `pageid` пока `row.length == pagesize`.

**DAG фильтры:** `payType == "Расход"` AND `state == "PROV_IN_BANK"`

---

### Известные ошибки Айыл Банк Open API

| HTTP | Ситуация |
|---|---|
| 400 | Счёт не принадлежит владельцу ключа |
| 500 | Невалидный apiKey (баг банка — должен быть 401) |

---

## 3. Айыл Банк — Business Client API

### Реквизиты подключения

| Параметр | Значение |
|---|---|
| Base URL (stage) | `https://172.27.47.2:8381/ab-business-client` (= `stage-api.ab.kg:8381`) |
| Base URL (prod) | `http://10.64.120.20:31456/ab-business-client` |
| Auth | JWT Bearer token (получить через `/api/v1/auth/authenticate`) |
| SSL | `verify=False` / `-k` на stage |
| Доступ | Только через Windows инстанс `10.45.12.47` с AmneziaVPN |

> ⚠️ Этот API покрывает только **баланс**. Endpoint выписки не задокументирован.

---

### Шаг 1 — Получение токена ✅

```
POST /api/v1/auth/authenticate
Content-Type: application/json
```

**Тело**
```json
{ "username": "alfa-oil-client-user", "password": "alfa-oil-client-user" }
```

**Пример (Windows cmd)**
```cmd
curl.exe -X POST https://172.27.47.2:8381/ab-business-client/api/v1/auth/authenticate -H "Content-Type: application/json" -d "{\"username\":\"alfa-oil-client-user\",\"password\":\"alfa-oil-client-user\"}" -k
```

**Ответ**
```json
{ "statusCode": 0, "message": "Успешно!", "data": { "access_token": "<jwt_token>" } }
```

> Live-тест 2026-07-03: **200 OK**, токен получен.

---

### Шаг 2 — Баланс по счёту ✅

```
GET /api/v1/business/balance?account=<номер>&currency=KGS
Authorization: Bearer <token>
```

**Пример**
```cmd
curl.exe -X GET "https://172.27.47.2:8381/ab-business-client/api/v1/business/balance?account=1350152009915425&currency=KGS" -H "Authorization: Bearer <token>" -H "Accept: */*" -k
```

**Ответ**
```json
{ "statusCode": 0, "message": "Успешно!", "state": "SUCCESS", "data": 50000.0 }
```

> Live-тест 2026-07-03: **200 OK**, баланс `50000.0 KGS`.

---

## 4. Сводная таблица endpoints

| Банк | API | Endpoint | Статус | Нужен для СВКА |
|---|---|---|---|---|
| Optima | Business | `GET /api/v1/get-account-infos-by-filter` | ✅ Работает | Мониторинг остатков |
| Optima | Business | `GET /api/v1/get-pos-operation-statement` | ⚠️ Нужна категория 4 | Входящие POS (не для сверки исходящих) |
| Optima | Business | `GET /api/v1/get-qr-operation-statement` | ⚠️ Нужна категория 5 | Входящие QR (не для сверки исходящих) |
| Optima | Business | Выписка РС (исходящие) | ❓ Не найден | **Критично — уточнить у банка** |
| Айыл Банк | Open RKO | `GET /api/rko/open-api/account-statement` | ⚠️ Хост TBD | **Основной для сверки** |
| Айыл Банк | Open RKO | `GET /api/rko/open-api/all-accounts-balance` | ⚠️ Хост TBD | Мониторинг остатков |
| Айыл Банк | Business Client | `GET /api/v1/business/balance` | ✅ Работает | Мониторинг остатков |

---

## 5. Скрипты тестирования

| Скрипт | Назначение |
|---|---|
| `CVKA_automation/test_optima_api.py` | Optima Bank — все endpoints |
| `CVKA_automation/test_ayil_bank_api.py` | Айыл Банк — Open RKO + Business Client |
| `CVKA_automation/.env` | Ключи (gitignored) |
| `CVKA_automation/.env.example` | Шаблон переменных |

---

## 6. Открытые вопросы

| # | Вопрос | Банк | Приоритет |
|---|---|---|---|
| 1 | Есть ли endpoint выписки РС (исходящие платежи поставщикам)? | Optima | 🔴 Критично |
| 2 | Какой host/IP для Open RKO API (`http://<host>:8085`)? | Айыл Банк | 🔴 Критично |
| 3 | Есть ли endpoint выписки в Business Client API? | Айыл Банк | 🟡 Желательно |
| 4 | Prod host для Business Client API доступен без Windows инстанса? | Айыл Банк | 🟡 |
