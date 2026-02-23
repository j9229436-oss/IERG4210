# Exam Day Cheat Sheet - Common Pitfalls and Key Points

Remember these during Challenge-Response Q&A to avoid embarrassment or mistakes.

---

## ⚠️ Common Mistakes to Avoid

### 1. ❌ Wrong: "I don't know"
### ✅ Correct: "Let me think... [explain what you do know]"

**Why Important**:
- Saying "I don't know" loses more points
- Explaining partial understanding earns points
- Interviewer wants to see your reasoning

**Example Dialogue**:
```
Q: Why use localStorage?
❌ A: I don't know...

✅ A: I'm not entirely certain, but I recall it stores shopping cart
     data locally in the browser so users can close and reopen  
     their cart later without losing items.
```

---

### 2. ❌ Wrong: "AI wrote it, I don't understand"
### ✅ Correct: "This implements [feature] through [technology]"

**Why Important**:
- Admitting ignorance directly loses points
- Explaining your understanding still earns credit
- Interviewer tests if you understand the code

**Conversion Tips**:
Even if AI-generated, you must understand it. Use:
- "This function does..."
- "This uses... technology to implement..."
- "The code flow is: first..., then..., finally..."

---

### 3. ❌ Wrong: Overly detailed technical info
### ✅ Correct: High-level summary, then detail if asked

**Layered Answer Template**:
```
1. 30-Second Version:
   "[Feature] implemented through [technology] at [location]"

2. 1-Minute Version:
   "Here's how it works: [workflow]..."

3. Technical Details (if pressed):
   "Specifically: [implementation details]..."
```

**Example**:
```
Q: How does shopping cart work?

Short (30s):
"Cart uses Map data structure in memory, then
localStorage persists to browser local storage."

Detailed (1m):
"When user clicks Add to Cart, JavaScript calls
cart.addItem(), checks if product exists, fetches
from API if not, adds to Map, saves to localStorage."

Technical (if asked):
"Map structure is pid -> {pid, qty, name, price, image_url},
save() uses JSON.stringify() and localStorage.setItem()"
```

---

### 4. ❌ Wrong: Unsure technical terms
### ✅ Correct: Explain in simple words, then mention term

**Example**:
```
❌ Interviewer: How do Express middleware work?
❌ You: "It's a function composition pattern..." (making up)

✅ You: "Middleware is code that processes requests before
   reaching routes. For example, Multer middleware validates
   files  before they reach the upload route."
```

---

### 5. ❌ Wrong: Confusing frontend and backend
### ✅ Correct: Clearly state which layer

**Key Terms**:
- Frontend: HTML, JavaScript, Browser
- Backend: Node.js, server.js, Express
- Database: SQLite, Tables, Queries

**Example**:
```
❌ "Shopping cart saves to database" (vague)

✅ "Shopping cart stores in JavaScript Map in frontend memory,
   then persists to browser localStorage, not backend database."
```

---

## 🎯 Must-Answer Questions Directly

### 1. "What's the core functionality?"
**Direct Answer**:
> E-commerce website. Users can browse and shop (cart feature).
> Admin manages products and categories in backend.

**Add**: Mention security or tech specifics

---

### 2. "What technologies did you use?"
**Must Mention**:
- Node.js / Express (backend)
- SQLite (database)
- JavaScript (frontend)
- Multer (file upload)
- Sharp (image processing)

**Often Forgotten**:
- express-validator (input validation)
- localStorage (client storage)
- fetch API (frontend requests)

---

### 3. "What API endpoints exist?"
**3 Primary**:
```
GET  /api/categories      ← Get category list
GET  /api/products        ← Get product list
POST /api/products        ← Create new product (admin)
```

**Full list → See QUICK_REFERENCE.md**

---

### 4. "How prevent SQL injection?"
**Standard Answer**:
> Use parameterized queries with `?` placeholders instead of
> direct string concatenation. Database driver auto-escapes.

**Code Ready**:
```javascript
// ✅ Safe
db.run('SELECT * FROM products WHERE pid = ?', [pid])

// ❌ Unsafe
db.run(`SELECT * FROM products WHERE pid = ${pid}`)
```

---

### 5. "How's shopping cart saved?"
**Standard Answer**:
> Shopping cart uses JavaScript Map in memory, then persists
> to browser localStorage. Survives browser close/reopen.

---

### 6. "Image upload process?"
**Answer Flow**:
1. User selects image in form
2. JavaScript sends FormData to `/api/products`
3. Multer validates file type (images only) and size (< 10MB)
4. Sharp generates thumbnail version
5. Images saved to `/uploads/` folder
6. URLs stored in database

---

### 7. "Relationship between categories and products?"
**Standard Answer**:
> Categories is parent table, Products is child table.
> Each product must belong to one category (FOREIGN KEY).
> Delete category → auto-delete its products (CASCADE).

---

### 8. "Frontend communicates with backend how?"
**Standard Answer**:
> JavaScript fetch() sends HTTP requests to API endpoints.
> Example: `fetch('/api/products')` sends GET, returns JSON
> data that frontend parses and dynamically generates HTML.

**Code Ready**:
```javascript
fetch('/api/products')
  .then(response => response.json())
  .then(data => {
    // Generate HTML and display
  })
```

---

## 🔴 High-Risk Questions

Interviewer likely to press on these:

### Risk 1: "Why Express over Django?"
**Expected Answer**:
- Express lighter weight
- Better Node.js ecosystem
- Simpler deployment
- Better for small-medium projects

**Don't say**: "I don't know the difference"

---

### Risk 2: "Delete category with 100 products - what happens?"
**Expected Answer**:
> CASCADE setting means category deletes, and all 100
> products automatically delete too. Could use SET NULL or
> RESTRICT if want different behavior.

---

### Risk 3: "Map vs plain JavaScript object difference?"
**Expected Answer**:
- Map built for key-value pairs, better performance
- Map supports any key type (object only string)
- Map has has(), get(), set() methods, clearer
- For cart (fast pid lookup), Map optimal

---

### Risk 4: "localStorage limitations?"
**Expected Answer**:
- Space limit: usually 5-10MB
- Storage: only strings (need JSON conversion)
- Not suitable for huge datasets
- Local only, not cross-domain
- User can manually clear

---

### Risk 5: "Multer validation fails - what?"
**Expected Answer**:
> Multer throws error, Express error handler catches
> and returns error message to frontend. File never saved.

---

## 💡 Bonus Point Strategies

### Strategy 1: Explain "why" not just "what"

```
❌ Basic:
"We use Sharp to generate thumbnails"

✅ Bonus:
"We use Sharp for thumbnails to optimize performance.
Product list downloads 10 × 50KB thumbnails (500KB total)
vs 10 × 2MB originals (20MB). 40x faster loading."
```

### Strategy 2: Mention security

```
✅ Bonus:
"We validate file MIME type and size to prevent
malicious uploads and server overflow. Combined with
express-validator for input safety, prevents SQL
injection and XSS attacks."
```

### Strategy 3: Point out improvements

```
✅ Bonus:
"Currently admin dashboard lacks authentication—
anyone can access. Should add login and JWT tokens
for real production use."
```

### Strategy 4: Discuss scalability

```
✅ Bonus:
"SQLite works for our size now, but scaling to
millions of products should migrate to MySQL
or PostgreSQL for performance."
```

---

## 🚨 If Asked Unknown Question

### Step 1: Don't pause over 3 seconds
- Give yourself thinking time but don't appear lost

### Step 2: Connect to related knowledge
```
Q: What's ORM? (not in your project)
A: ORM is Object-Relational Mapping... In our project,
   I directly use SQLite3 API instead of ORM because
   project size doesn't need that abstraction layer.
```

### Step 3: Be honest but confident
```
❌ "Umm... maybe... possibly..." (lacking confidence)

✅ "I haven't used that technology in this project, but
   based on my understanding..." (honest, logical)
```

---

## 📝 Pre-Exam Preparation Checklist

### One Hour Before:
- [ ] Read QUICK_REFERENCE.md once
- [ ] Review all API endpoints
- [ ] Sketch 3-layer architecture (frontend-backend-database)

### 30 Minutes Before:
- [ ] Browse your code quickly
- [ ] Confirm 3 main JavaScript files' purpose
- [ ] Practice 1-2 complete workflows (like "user adds to cart")

### 5 Minutes Before:
- [ ] Deep breath, relax
- [ ] Remember: Interviewer knows code is AI-generated
- [ ] Your goal: Show you **understand and can explain**
- [ ] Part-right is better than silent

### During Exam:
- [ ] Listen carefully, don't rush answering
- [ ] Brief summary first, then dive deep
- [ ] Use code snippets as examples (relevant)
- [ ] Speak clearly, confidently
- [ ] If stuck: "Let me think..."  not "I don't know"

---

## 🧠 Mindset

### Remember:
- ✅ Interviewer knows AI involved
- ✅ Testing your **understanding**, not perfection
- ✅ Partial explanation still earns points
- ✅ Confidence matters more than memorization
- ✅ Pointing out weak points shows maturity

### Expect:
- Maybe 10-20 questions
- All correct unlikely (60-70% already good)
- Deep grasp of 5-6 concepts better than surface knowledge of everything

---

## ✨ Last Words

You've studied. You have documentation. Now be confident:

1. **Understand flow**: How users interact with system
2. **Learn architecture**: Frontend-backend-database cooperation
3. **Know decisions**: Why you chose that technology
4. **Maintain calm**: Partial answers are fine

**Wish you great performance in Challenge-Response Q&A!** 💪

---

Tips: Write a 3-5 minute speech explaining project end-to-end.
Practice 2-3 times before actual Q&A. Confidence comes from preparation.
