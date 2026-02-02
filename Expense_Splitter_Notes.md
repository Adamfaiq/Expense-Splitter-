# 🧠 SYSTEM NOTE – Expense Splitter Project

---

## 📦 FEATURE 1: User Authentication (JWT)

### 1️⃣ Nama Feature
**Authentication** – Register, Login, Token-based access control

### 2️⃣ Masalah Dunia Sebenar
- Sistem tak tahu siapa yang buat request
- Tanpa auth, semua orang boleh create/edit/delete expense orang lain
- Tak boleh track siapa bayar apa

### 3️⃣ Analogi Mudah
**Auth = IC / Pas Masuk Bangunan**
- Nak masuk bangunan → kena tunjuk IC
- Takde IC → kena balik
- Token JWT = IC digital kau

### 4️⃣ Apa Jadi Kalau TAK Ada?
- Anyone boleh create group, add expense, settle payment
- Data orang lain boleh diedit/deleted
- Sistem tak boleh trust siapa yang buat request

### 5️⃣ Peranan Dalam Sistem
```
Request → Auth Middleware → Routes → DB → Response
```
- Auth middleware duduk SEBELUM routes
- Kalau token invalid/missing → block request terus
- Kalau valid → attach userId ke request, proceed

### 6️⃣ Aliran Ringkas
```
Register/Login
    ↓
Server generate JWT token
    ↓
Client save token
    ↓
Every request → send token in Authorization header
    ↓
Auth middleware verify token
    ↓
Routes jalan (req.userId available)
```

### 7️⃣ Kalau Rosak / Salah Setup
- `401 Unauthorized` – token missing or invalid
- `secretOrPrivateKey must have a value` – JWT_SECRET tak ada dalam .env
- Token expired – user kena login balik

### 8️⃣ Minimum vs Production
**Minimum (ours):**
- Register, login, JWT token (7 days expiry)

**Production:**
- Refresh token
- Token revocation (blacklist)
- Password reset flow
- Rate limiting on login attempts

### 9️⃣ Ayat Dunia Kerja
*"Auth middleware ensures hanya authenticated users boleh access protected resources, dan setiap request diikat dengan identity user via JWT token."*

### 🔟 Nota Peribadi
Baru faham kenapa auth middleware duduk sebelum routes – sebab kita nak block unauthorized requests BEFORE any business logic runs.

---

## 📦 FEATURE 2: Groups

### 1️⃣ Nama Feature
**Groups** – Manage kumpulan users untuk expense splitting

### 2️⃣ Masalah Dunia Sebenar
- Kita ada ramai kawan, tapi groups berbeza (geng makan vs geng travel)
- Kena track siapa ada dalam group mana
- Expense mesti linked ke specific group

### 3️⃣ Analogi Mudah
**Group = WhatsApp Group**
- "Weekend Trip" ada 3 orang
- "Geng Makan" ada 5 orang
- Tak semua orang dalam semua group

### 4️⃣ Apa Jadi Kalau TAK Ada?
- Tak tahu siapa involved dalam expense
- Expenses terserabut – tak organised
- Tak boleh filter "show me expenses for this trip only"
- Settlement calculation jadi confusing

### 5️⃣ Peranan Dalam Sistem
**Group = Parent untuk semua Expenses**
```
Group (Weekend Trip)
    ├── Expense 1 (Dinner)
    ├── Expense 2 (Hotel)
    └── Expense 3 (Transport)
```
- Semua expense MESTI linked ke 1 group
- Members list jadi reference untuk split

### 6️⃣ Aliran Ringkas
```
Auth (login)
    ↓
POST /api/groups (create group + add members)
    ↓
GET /api/groups (list all groups)
    ↓
GET /api/groups/:id (get specific group)
```

### 7️⃣ Kalau Rosak / Salah Setup
- Members array kosong → tak boleh split
- groupId invalid → expense creation fails
- Members tak exist → "Some members not found" error

### 8️⃣ Minimum vs Production
**Minimum (ours):**
- groupName, members array, createdBy

**Production:**
- Group admin/permissions
- Invite link system
- Group image/avatar
- Archive/leave group

### 9️⃣ Ayat Dunia Kerja
*"Groups feature segregates expenses by social circle, memungkinkan users organize bills based on different friend groups atau occasions."*

### 🔟 Nota Peribadi
Faham kenapa group mesti ada dulu sebelum expense – members list dalam group jadi auto-reference untuk split options.

---

## 📦 FEATURE 3: Expenses + Items

### 1️⃣ Nama Feature
**Expenses & Expense Items** – Record bills dan breakdown per item

### 2️⃣ Masalah Dunia Sebenar
- Satu bill ada banyak items (nasi, mee, air)
- Ada items personal (1 orang makan), ada shared (semua share)
- Kena track siapa makan apa untuk fair calculation

### 3️⃣ Analogi Mudah
**Expense = Resit, Items = Line items atas resit**
- 1 resit (Expense) boleh ada banyak line items
- Setiap line item = 1 row dalam ExpenseItem table
- Resit store "siapa bayar dulu + total"
- Line items store "apa diorder + siapa makan"

### 4️⃣ Apa Jadi Kalau TAK Ada?
- Tak boleh breakdown siapa makan apa
- Split jadi unfair (everyone split sama rata walaupun consumption berbeza)
- Disputes – "aku tak order item mahal tu!"
- Calculation jadi inaccurate

### 5️⃣ Peranan Dalam Sistem
```
Expense (parent) – siapa bayar, total, tarikh
    ├── Item 1: Steamboat Set A RM45 (shared – 3 orang)
    ├── Item 2: Extra Prawns RM15 (shared – 2 orang)
    └── totalAmount auto-calculated dari items
```
- Expense = container/parent
- Items = granular detail untuk calculation
- `type` field (personal/shared) guide how to split
- `participants` array determine siapa involved per item

### 6️⃣ Aliran Ringkas
```
POST /api/expenses
    ↓
Send: groupId, paidBy, items[]
    ↓
Server auto-calculate totalAmount dari items
    ↓
Create 1 Expense + N ExpenseItems (linked via expenseId)
    ↓
GET /api/expenses/group/:groupId (list all)
PUT /api/expenses/:id (edit)
DELETE /api/expenses/:id (delete expense + items)
```

### 7️⃣ Kalau Rosak / Salah Setup
- items array kosong → "Missing required fields"
- participants empty → item jadi "free" (nobody pays)
- type salah → personal item split ramai orang (unfair)
- expenseId missing → items jadi orphan (no parent)
- Delete expense → items & settlements auto-deleted too

### 8️⃣ Minimum vs Production
**Minimum (ours):**
- itemName, price, type (personal/shared), participants array
- Auto-calculate totalAmount
- Edit & Delete

**Production:**
- Item categories (food/transport/entertainment)
- Receipt image upload
- Tax/service charge handling
- Custom split ratio (70-30 instead of equal)
- Expense history with filters

### 9️⃣ Ayat Dunia Kerja
*"Expenses table acts as transaction container linking payer to group, while ExpenseItems enable per-item cost allocation ensuring fair split based on actual consumption."*

### 🔟 Nota Peribadi
Baru faham kenapa kita butuh 2 tables (Expense + ExpenseItem) bukan 1. Kalau 1 table je, data payer/total kena repeat untuk every item – wasteful & confusing.

---

## 📦 FEATURE 4: Settlement Calculation (Summary)

### 1️⃣ Nama Feature
**Group Summary** – Auto-calculate siapa hutang siapa

### 2️⃣ Masalah Dunia Sebenar
- Lepas makan, kena kira siapa bayar berapa
- Manual calculation error-prone & confusing
- Especially susah kalau ada banyak expenses dalam 1 group

### 3️⃣ Analogi Mudah
**Summary = Accountant yang kira semua bills**
- Tengok semua resit dalam group
- Kira berapa setiap orang consume
- Kira berapa setiap orang dah bayar
- Calculate siapa hutang siapa

### 4️⃣ Apa Jadi Kalau TAK Ada?
- Kena manual calculate – error prone
- Disputes – "aku rasa aku bayar lebih"
- Confusing kalau ada banyak expenses
- Tak transparent – tak nampak breakdown

### 5️⃣ Peranan Dalam Sistem
```
GET /api/summary/group/:groupId
    ↓
Fetch all expenses in group
    ↓
Fetch all items → calculate per-person consumption
    ↓
Compare: what each person PAID vs what they CONSUMED
    ↓
positive balance = owes money
negative balance = should get money back
    ↓
Match debtors with creditors → generate settlement list
```

### 6️⃣ Aliran Ringkas
**Calculation Logic:**
```
1. Loop semua items
2. Per item: splitAmount = price ÷ participants.length
3. Add splitAmount ke each participant's "consumed" total
4. Compare consumed vs paid per user
5. Balance = consumed - paid
   - Positive → owes money (debtor)
   - Negative → should get back (creditor)
6. Match debtors → creditors = final settlement
```

**Example:**
```
John paid RM60 total
- Steamboat RM45 ÷ 3 = RM15 each
- Extra Prawns RM15 ÷ 2 = RM7.50 each (John + Sarah)

John consumed:  RM15 + RM7.50 = RM22.50
Sarah consumed: RM15 + RM7.50 = RM22.50
Mike consumed:  RM15

Settlement:
Sarah → John: RM22.50
Mike  → John: RM15.00
```

### 7️⃣ Kalau Rosak / Salah Setup
- participants array kosong → item consumption = 0 (free item)
- Wrong groupId → empty result
- Division error → floating point issues (use .toFixed(2))

### 8️⃣ Minimum vs Production
**Minimum (ours):**
- Calculate balances per user
- Generate settlement pairs (who owes who)

**Production:**
- Optimized settlement (minimize number of transactions)
- Currency conversion
- Settlement history
- Partial payment support

### 9️⃣ Ayat Dunia Kerja
*"Summary route aggregates all expenses in a group, calculates per-user consumption vs payment, then generates optimized settlement pairs showing who owes who."*

### 🔟 Nota Peribadi
Baru faham calculation flow – kunci dia kat "consumed vs paid". Positive balance = hutang, negative = should get back. Simple tapi powerful.

---

## 📦 FEATURE 5: Settlement Tracking

### 1️⃣ Nama Feature
**Settlement Tracking** – Track & mark payments as done

### 2️⃣ Masalah Dunia Sebenar
- Dah kira siapa hutang siapa, tapi tak track siapa dah bayar
- Nanti confuse – "aku dah bayar dah!"
- Tak ada proof/record of payment

### 3️⃣ Analogi Mudah
**Settlement = Checklists sebelum balik dari outing**
- ☐ Sarah bayar John RM22.50
- ☐ Mike bayar John RM15.00
- Lepas bayar → tick ✅
- Status: pending → paid

### 4️⃣ Apa Jadi Kalau TAK Ada?
- Tak tahu siapa dah bayar siapa
- Possible double payment
- Disputes – "aku dah bayar!"
- No history/audit trail

### 5️⃣ Peranan Dalam Sistem
```
POST /api/settlements (create pending settlement)
    ↓
PUT /api/settlements/:id/pay (mark as paid)
    ↓
GET /api/settlements/group/:groupId (view all)
```
- Settlement record created AFTER summary calculation
- Status flow: pending → paid
- paidAt timestamp recorded when marked as paid

### 6️⃣ Aliran Ringkas
```
Get Summary (calculate who owes who)
    ↓
Create Settlement record (status: pending)
    ↓
Person pays in real life
    ↓
Mark Settlement as paid (status: paid, paidAt: timestamp)
    ↓
Get all settlements → see full payment history
```

### 7️⃣ Kalau Rosak / Salah Setup
- Mark paid twice → "Already paid" error (400)
- Settlement not found → 404
- Empty body on PUT → "Unexpected end of JSON" (Express 5 bug – send {} as body)

### 8️⃣ Minimum vs Production
**Minimum (ours):**
- Create settlement
- Mark as paid
- View all settlements by group

**Production:**
- Payment gateway integration (online payment)
- Partial payment support
- Payment proof upload
- Push notification when someone pays
- Settlement expiry/reminder

### 9️⃣ Ayat Dunia Kerja
*"Settlement tracking provides a clear audit trail of who owes what and payment status, preventing disputes dan ensuring transparency dalam group expense management."*

### 🔟 Nota Peribadi
Faham kenapa settlement butuh separate model – kena track individual payments, bukan just calculate. Ada difference antara "kira hutang" vs "track bayaran".

---

## 🏗️ PROJECT STRUCTURE

```
Expense Splitter/
├── .env                          # Environment variables
├── package.json
├── server.js                     # Express app setup + routes
├── db.js                         # MongoDB connection
├── test-db.js                    # Database test script
├── models/
│   ├── User.js                   # User schema
│   ├── Group.js                  # Group schema
│   ├── Expense.js                # Expense schema
│   ├── ExpenseItem.js            # Expense items schema
│   └── Settlement.js             # Settlement schema
├── routes/
│   ├── auth.js                   # Register & Login
│   ├── groups.js                 # CRUD groups
│   ├── expenses.js               # CRUD expenses + items
│   ├── summary.js                # Settlement calculation
│   └── settlements.js            # Settlement tracking
└── middleware/
    ├── auth.js                   # JWT verification
    └── errorHandler.js           # Global error handling
```

---

## 🔗 DATABASE RELATIONSHIPS

```
User (1) ──→ (Many) Group.members
User (1) ──→ (Many) Group.createdBy
Group (1) ──→ (Many) Expense
Expense (1) ──→ (Many) ExpenseItem
ExpenseItem (Many) ──→ (Many) User (via participants[])
Settlement links: User (from) → User (to) within Group
```

---

## 📍 API ROUTES REFERENCE

```
PUBLIC:
POST   /api/auth/register          – Register user
POST   /api/auth/login             – Login

PROTECTED (need Bearer token):
POST   /api/groups                 – Create group
GET    /api/groups                 – Get all groups
GET    /api/groups/:id             – Get single group

POST   /api/expenses               – Create expense + items
GET    /api/expenses/group/:gid    – Get expenses by group
PUT    /api/expenses/:id           – Edit expense
DELETE /api/expenses/:id           – Delete expense

GET    /api/summary/group/:gid     – Get settlement summary

POST   /api/settlements            – Create settlement
PUT    /api/settlements/:id/pay    – Mark as paid
GET    /api/settlements/group/:gid – Get all settlements
```

---

## 🐛 BUGS & FIXES ENCOUNTERED

| Bug | Cause | Fix |
|-----|-------|-----|
| `secretOrPrivateKey must have a value` | JWT_SECRET missing in .env | Added JWT_SECRET to .env |
| `E11000 duplicate key` | Users already existed from test-db.js | Used existing users |
| `findByIdDelete is not a function` | Typo – wrong method name | Changed to `findByIdAndDelete` |
| `Unexpected end of JSON input` | Express 5 – PUT with empty body crashes | Send `{}` as body instead of empty |
| `Cannot find module './routes/settlements'` | File not created yet | Created the file |

---

## 💡 KEY LEARNINGS

1. **"Show the damn brick first"** – Belajar dari concrete example, bukan abstract theory
2. **1 table + field type > 2 separate tables** – Simpler queries, easier maintain
3. **Expense (parent) + Items (children)** – Avoid data duplication
4. **Auth middleware sebelum routes** – Block unauthorized BEFORE business logic
5. **consumed vs paid = settlement calculation** – Core logic of expense splitting
6. **Settlement ≠ Summary** – Summary = calculate, Settlement = track payment
