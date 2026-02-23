# Quick Reference Card - 5-Minute Review

Fast lookup list for final revision before exam.

---

## 🎯 Project Structure

```
IERG4210/
├── server.js          ← Backend Application (Express)
├── db.js              ← Database Initialization
├── package.json       ← Dependencies Configuration
├── public/
│   ├── index.html     ← Homepage
│   ├── admin.html     ← Admin Dashboard
│   ├── product.html   ← Product Detail
│   ├── css/style.css
│   └── js/
│       ├── cart.js              ← Shopping Cart
│       ├── index-dynamic.js     ← Homepage Logic
│       ├── admin.js             ← Admin Logic
│       └── Other JS Files
├── uploads/           ← Uploaded Image Storage Location
└── ecommerce.db       ← SQLite Database File
```

---

## 📊 Database Tables

### Categories
```
catid (primary key)  │ name (unique)
─────────────────────┼──────────
1                    │ Gaming
2                    │ Food
```

### Products
```
pid  │ catid │ name              │ price  │ description  │ image_url
─────┼───────┼──────────────────┼────────┼──────────────┼────────────
1    │ 1     │ Gaming Controller │ 29.99  │ ...          │ /uploads/...
2    │ 1     │ Gaming Keyboard   │ 79.99  │ ...          │ /uploads/...
3    │ 2     │ Basic White Bread │ 3.30   │ ...          │ /uploads/...
```

---

## 🔌 Essential API Endpoints to Remember

| Purpose | Method | Endpoint | Return |
|---------|--------|----------|--------|
| Get all categories | GET | `/api/categories` | `[{catid, name}, ...]` |
| Get single category | GET | `/api/categories/:catid` | `{catid, name}` |
| Create category | POST | `/api/categories` | `{catid, name}` |
| Delete category | DELETE | `/api/categories/:catid` | `{message}` |
| Get all products | GET | `/api/products` | `[{pid, catid, ...}, ...]` |
| Filter by category | GET | `/api/products?catid=1` | `[{...}, ...]` |
| Get single product | GET | `/api/products/:pid` | `{pid, catid, ...}` |
| Create product | POST | `/api/products` | `{pid, ...}` |
| Edit product | PUT | `/api/products/:pid` | `{message}` |
| Delete product | DELETE | `/api/products/:pid` | `{message}` |

---

## 🔑 Core Concepts Explained

### fetch() - Call API
```javascript
fetch('/api/products')
  .then(res => res.json())          // Parse JSON
  .then(data => console.log(data))  // Use data
  .catch(err => console.error(err)) // Error handling
```

### localStorage - Save Shopping Cart
```javascript
// Save
localStorage.setItem('shoppingCart', JSON.stringify(cartData))

// Load
const saved = localStorage.getItem('shoppingCart')
const data = JSON.parse(saved)
```

### Parameterized Query - SQL Safety
```javascript
// ✅ Safe
db.run('SELECT * FROM products WHERE catid = ?', [catid])

// ❌ Unsafe
db.run('SELECT * FROM products WHERE catid = ' + catid)
```

### Event Delegation - Dynamic Buttons
```javascript
document.querySelectorAll('.add-to-cart').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const productId = e.target.dataset.productId
    shoppingCartUI.addItem(productId, 1)
  })
})
```

---

## 💾 Shopping Cart Data Structure

### localStorage Storage Format
```json
{
  "shoppingCart": [[123, {pid: 123, qty: 2, name: "...", price: 29.99}],
                    [456, {pid: 456, qty: 1, name: "...", price: 79.99}]]
}
```

### Map in cart.js
```javascript
this.items = new Map()
// Access: const item = this.items.get(123)
// Add: this.items.set(123, {pid, qty, name, price, image_url})
// Check: this.items.has(123)
// Remove: this.items.delete(123)
```

---

## 📁 3 Most Important Frontend Files

### 1️⃣ index-dynamic.js - Homepage
**What it does**: Load categories and products
```javascript
loadCategories()   // GET /api/categories → Generate navigation
loadProducts()     // GET /api/products?catid=X → Display product cards
handleCartButtons() // Add event listeners to buttons
```

### 2️⃣ cart.js - Shopping Cart System
**What it does**: ShoppingCart class manages cart
```javascript
constructor()   // Initialize, load from localStorage
addItem()       // Add product (check if exists first)
removeItem()    // Remove product
getTotal()      // Calculate total price
save()          // Save to localStorage
```

### 3️⃣ admin.js - Admin Dashboard
**What it does**: CRUD for products and categories
```javascript
loadProducts()    // List all products
editProduct()     // Get product details, populate form
deleteProduct()   // Delete after confirmation, reload
handleFormSubmit() // POST (create) or PUT (update)
```

---

## 🖼️ Image Processing Flow

```
User uploads → Multer validates
             ├─ Check MIME type
             ├─ Check file size (< 10MB)
             └─ Save to /uploads/
             
Sharp generates thumbnail
├─ Read original image
├─ Resize and compress
└─ Save to /uploads/thumbnails/

Database stores paths
├─ image_url: '/uploads/123.jpg'
└─ thumbnail_url: '/uploads/thumbnails/123.jpg'
```

---

## 🔒 Security Checklist

- ✅ **Input Validation**: Use express-validator
  ```javascript
  body('name').trim().isLength({ min: 1 }).escape()
  ```

- ✅ **SQL Injection Prevention**: Parameterized queries
  ```javascript
  db.run('WHERE id = ?', [id])  // Use ? placeholders
  ```

- ✅ **File Validation**: Check MIME type and size
  ```javascript
  const allowedMimes = ['image/jpeg', 'image/png', ...]
  limits: { fileSize: 10 * 1024 * 1024 }  // 10MB
  ```

- ✅ **Data Consistency**: CASCADE delete
  ```sql
  FOREIGN KEY(catid) REFERENCES categories(catid) ON DELETE CASCADE
  ```

---

## 🔄 Complete User Journey

### Scenario: User Purchases Product

```
1. Visit index.html
   ↓
2. JavaScript runs loadCategories() & loadProducts()
   ↓
3. API calls GET /api/categories & /api/products
   ↓
4. Page displays all product cards
   ↓
5. User clicks "Add to Cart"
   ↓
6. handleCartButtons() triggered
   ├─ Call shoppingCartUI.addItem(pid)
   ├─ cart.js calls GET /api/products/pid
   ├─ Store product data in Map
   └─ localStorage.setItem() persist
   ↓
7. UI updates: "Added!" feedback, cart counter +1
```

---

## 🚀 Deployment Info

### Local Run
```bash
npm start  # Start server, listen on localhost:3000
```

### Remote Deployment (Azure)
```bash
# Nginx reverse proxy
proxy_pass http://localhost:3000

# Background run with screen
screen -S nodeapp
npm start

# Static files
location /uploads/ {
  root /home/IERG4210/website;
}
```

---

## ❓ Common "Why" Questions

| Question | Answer |
|----------|--------|
| Why localStorage? | Client-side persistence, no backend session needed |
| Why thumbnails? | Faster list page loading |
| Why validate input? | Prevent SQL injection, XSS, malicious uploads |
| Why use Map? | Fast ID-based lookup |
| Why parameterized query? | Prevent SQL injection |
| Why Multer? | Handle file upload middleware |
| Why Sharp? | Image processing and thumbnail generation |
| Why Nginx? | Reverse proxy, forward requests to Node.js |

---

## 👉 Core JavaScript Concepts

- **fetch()**: Asynchronous HTTP request
- **then()**、**catch()**: Promise chaining
- **async/await**: Async syntax sugar (Promise simplified)
- **Map**: Key-value pair data structure
- **localStorage**: Browser local storage
- **JSON.stringify() / JSON.parse()**: Object-JSON conversion
- **Event listeners**: addEventListener, event delegation
- **DOM manipulation**: querySelector, innerHTML, classList

---

## 📋 "Safe Answer" Template for Interview

**Listen carefully → Provide layered answer**

```
Short Version (1 sentence):
"[Feature] implemented through [technology] at [location]"

Detailed Version (3-4 sentences):
"User does [action] on frontend, JavaScript calls [API],
backend processes at [route], interacts with [table],
returns data to frontend, updates [UI element]"

Technical Details (if asked deeper):
"Specifically uses [library/tech],
security measures include [safety consideration],
performance optimization includes [perf consideration]"
```

---

## ⏰ 5-Minute Review Checklist

Before entering exam, confirm:

- [ ] What project does → E-commerce website
- [ ] Tech stack → Node.js, Express, SQLite, JavaScript
- [ ] 2 tables → Categories, Products
- [ ] How frontend calls API → fetch()
- [ ] Cart persistence → localStorage
- [ ] Image upload flow → Multer + Sharp
- [ ] Database safety → Parameterized queries
- [ ] Category delete effect → CASCADE delete products
- [ ] Main files → server.js, cart.js, admin.js, index-dynamic.js
- [ ] Design rationale → security, performance, user experience

---

Great job preparing! Remember, interviewers want to see you **explain architecture and flow**, not memorize every code line.

💪 **Believe in yourself!**
