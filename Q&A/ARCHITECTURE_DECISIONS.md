# Architecture Decisions and Design Rationale

This document explains the **why** behind technical choices in your code. Critical for deep Q&A.

---

## 🏗️ Overall Architecture Decisions

### Decision 1: Why Choose Express.js?

**Background**: Need to build RESTful API server

**Choice**: Express.js (lightweight Node.js framework)

**Rationale**:
- ✅ Simple to learn, suitable for small-to-medium projects
- ✅ Rich middleware ecosystem (Multer, express-validator)
- ✅ High flexibility, wide customization
- ✅ Performance adequate for e-commerce apps
- ✅ Active community, comprehensive documentation

**Why not alternatives**:
- Django (Python): Too heavy, unnecessary features
- Flask (Python): Too simple, too much manual integration
- ASP.NET: Steep learning curve, complex deployment

---

### Decision 2: Why Choose SQLite?

**Background**: Need to store products, categories, order data

**Choice**: SQLite3 (lightweight relational database)

**Rationale**:
- ✅ No separate database server needed (file-based)
- ✅ Zero configuration, fast development
- ✅ Supports medium-sized datasets well
- ✅ Supports ACID transactions, data safety
- ✅ Simple deployment (copy .db file)

**Why not alternatives**:
- MySQL: Needs separate installation, too complex for small projects
- PostgreSQL: Powerful but unnecessary, high learning cost
- MongoDB: Schema-less not optimal for structured e-commerce data

---

### Decision 3: Why Use localStorage for Shopping Cart?

**Background**: Shopping cart needs persistence after browser closes

**Choice**: Browser localStorage API

**Rationale**:
- ✅ Client-side storage, no backend processing
- ✅ Auto-persists (data survives refresh)
- ✅ Simple API: `localStorage.setItem()` and `getItem()`
- ✅ Perfect for temporary cart without login
- ✅ Reduces backend server load

**Why not alternatives**:
- Backend sessions: Need session management, database, complexity
- Cookies: Size limited (4KB), wastes bandwidth
- IndexedDB: Overly powerful for this project, high learning cost

---

### Decision 4: Why Use Multer?

**Background**: Admin needs to upload product images

**Choice**: Multer middleware (Node.js file upload library)

**Rationale**:
- ✅ Designed for Express file uploads
- ✅ Built-in file validation (size, type)
- ✅ Flexible storage configuration
- ✅ Security considerations (preventing malicious files)

**Flow**:
```
Upload form → Multer validation → Save file → Return path
```

---

### Decision 5: Why Use Sharp?

**Background**: Product images need multiple versions (original + thumbnail)

**Choice**: Sharp (high-performance image processing library)

**Rationale**:
- ✅ Auto-generate thumbnails, faster page load
- ✅ Image compression saves storage and bandwidth
- ✅ High performance (based on libvips C+ library)
- ✅ Supports format conversion

**Application**:
```javascript
sharp(uploadedImagePath)
  .resize(200, 200)           // Scale to 200x200
  .toFile(thumbnailPath)      // Save thumbnail
```

**Advantage**:
- Original (2MB) → Product detail page (high-res)
- Thumbnail (50KB) → Product list (fast load)

---

## 🔒 Security Design Decisions

### Decision 6: Why Use express-validator?

**Problem**: Users might input malicious data (SQL injection, XSS)

**Solution**: express-validator middleware

**Example**:
```javascript
app.post('/api/categories',
  body('name')
    .trim()              // Remove leading/trailing spaces
    .isLength({ min: 1 }) // Minimum 1 character
    .escape(),            // Escape HTML special chars
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Safe name value
  }
);
```

**Protection**:
- ✅ trim(): Prevent space tricks
- ✅ isLength(): Block extremely short/long input
- ✅ escape(): Escape ><characters, prevent XSS

---

### Decision 7: Why Use Parameterized Queries?

**Problem**: Direct string concatenation causes SQL injection

**Dangerous Code**:
```javascript
// ❌ SQL injection vulnerability
db.run(`INSERT INTO products (name) VALUES ('${name}')`)

// Hacker inputs: '; DROP TABLE products; --
// Actually executes: INSERT INTO products (name) VALUES (''); DROP TABLE products; --
```

**Safe Code**:
```javascript
// ✅ Parameterized query
db.run('INSERT INTO products (name) VALUES (?)', [name])

// ? auto-escapes, attack becomes plain string
```

**Why it works**:
- SQL and data separated
- Database driver auto-escapes
- Can't change SQL structure

---

### Decision 8: Why Validate File Type?

**Problem**: Uploads could contain viruses or inappropriate content

**Solution**:
```javascript
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'));
  }
};

const upload = multer({
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});
```

**Protections**:
- ✅ MIME type check: Only images
- ✅ File size limit: Prevent storage overflow
- ✅ Files saved in isolated folder: /uploads/

---

## 🗄️ Database Design Decisions

### Decision 9: Why Use FOREIGN KEY?

**Background**: Products belong to categories, need relationship

**Design**:
```sql
CREATE TABLE products (
  pid INTEGER PRIMARY KEY,
  catid INTEGER NOT NULL,
  ...
  FOREIGN KEY(catid) REFERENCES categories(catid)
);
```

**Benefits**:
- ✅ Data integrity: Can't reference non-existent category
- ✅ Referential integrity: Category must exist to own products

---

### Decision 10: Why Use CASCADE Delete?

**Problem**: What happens to products when deleting category?

**Solution**:
```sql
CREATE TABLE products (
  ...
  FOREIGN KEY(catid) REFERENCES categories(catid) 
  ON DELETE CASCADE
);
```

**Three Option Comparison**:

| Option | Meaning | Use Case |
|--------|---------|----------|
| CASCADE | Delete children too | This project: Delete category → delete products |
| RESTRICT | Refuse if children exist | Important data: Prevent accidents |
| SET NULL | Set to null (orphan) | Gentle delete: Keep data but lose association |

**Why CASCADE**:
- In e-commerce, categories and products are one-to-many
- Deleting category should clean up products
- Otherwise leaves orphaned product records

---

## 🎨 Frontend Architecture Decisions

### Decision 11: Why Use Map for Shopping Cart?

**Background**: Cart needs multiple products, fast lookup

**Code Structure**:
```javascript
class ShoppingCart {
  constructor() {
    this.items = new Map();  // pid → product object
  }
  
  addItem(pid, qty) {
    if (this.items.has(pid)) {
      // Fast lookup O(1)
      this.items.get(pid).qty += qty;
    } else {
      // Fast insert
      this.items.set(pid, {pid, qty, name, price, image_url});
    }
  }
}
```

**Map vs Object vs Array Comparison**:

| Data Structure | Lookup | Iteration | Insert/Delete | Best For |
|---|---|---|---|---|
| Map | O(1) | forEach | O(1) | This project ✅ |
| Object | O(1) | for-in | O(1) | Simple cases |
| Array | O(n) | for-of | O(n) | Lists |

**Why Map**:
- Fast lookup (locate by pid quickly)
- forEach syntax clear
- set() and has() methods semantic
- Ideal for key-value pairs

---

### Decision 12: Why Separate Thumbnail and Original?

**Problem**: Large image sizes impact loading speed

**Solution**:
```
Original (image_url)    → Product detail page → Full size, high-res
Thumbnail (thumbnail_url) → Product list       → 200x200px, fast load
```

**Performance Comparison**:
```
List page with 10 products:
- Using originals (~2MB each): Load 20MB → Slow
- Using thumbnails (~50KB each): Load 500KB → 40x faster
```

---

### Decision 13: Why Use fetch() API?

**Background**: Frontend needs backend communication

**Choice**: Native JavaScript fetch API

**Rationale**:
- ✅ Standard API, no external library
- ✅ Promise-based, async-friendly
- ✅ Supports async/await syntax
- ✅ Modern browsers support

**Code Comparison**:
```javascript
// Old XMLHttpRequest
const xhr = new XMLHttpRequest();
xhr.open('GET', '/api/products');
xhr.onload = () => { ... };

// Modern fetch
fetch('/api/products')
  .then(r => r.json())
  .then(data => { ... })
```

**Why fetch**:
- Cleaner syntax
- Native support, no jQuery
- Promise chaining more intuitive

---

## 📂 File Organization Decisions

### Decision 14: Why Separate cart.js?

**Organization**:
```
public/js/
├── cart.js              ← ShoppingCart class (single responsibility)
├── index-dynamic.js     ← Homepage logic
├── admin.js             ← Admin logic
└── script.js            ← Initialization
```

**Benefits**:
- ✅ Single responsibility: Each file has clear purpose
- ✅ Maintainability: Change cart logic only in cart.js
- ✅ Reusability: Multiple pages can import cart.js
- ✅ Clear structure: Easy to understand and test

---

### Decision 15: Why admin.html Completely Separate?

**Design**:
```
Public Pages (anyone):
├── index.html        ← Homepage
├── product.html      ← Product detail
└── category1.html    ← Category

Admin Pages (should add auth):
└── admin.html        ← Management
```

**Current Gap**:
- ❌ admin.html has no authentication
- ❌ Anyone can access admin

**Better Approach**:
```javascript
// Add to admin.js start:
function checkAuth() {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    window.location.href = '/login.html';
  }
}
checkAuth();
```

---

## 🌐 API Design Decisions

### Decision 16: Why RESTful Style?

**REST Principles**:
```
GET    /api/products      ← Get list
GET    /api/products/:id  ← Get detail
POST   /api/products      ← Create
PUT    /api/products/:id  ← Update
DELETE /api/products/:id  ← Delete
```

**Advantages**:
- ✅ Standard, easy to understand
- ✅ Stateless design, scalable
- ✅ Aligns with HTTP semantics
- ✅ Easy frontend integration

**Non-REST example (avoid)**:
```javascript
// ❌ Non-standard
/api/getProduct
/api/createProduct
/api/updateProduct
```

---

### Decision 17: Why Support ?catid Query Parameter?

**Code**:
```javascript
app.get('/api/products', (req, res) => {
  const catid = req.query.catid;
  
  let query = 'SELECT * FROM products';
  let params = [];
  
  if (catid) {
    query += ' WHERE catid = ?';
    params.push(catid);
  }
  
  db.all(query, params, (err, rows) => { ... });
});
```

**Usage**:
```
GET /api/products         ← All products
GET /api/products?catid=1 ← Gaming category
```

**Why**:
- Flexibility: Same endpoint, multiple queries
- RESTful standard: Use query params for filtering
- Maintainability: Don't need multiple endpoints

---

## 🚀 Deployment Decisions

### Decision 18: Why Use Nginx Reverse Proxy?

**Architecture**:
```
Client
  ↓
Nginx (listen port 80)
  ↓
Node.js (listen port 3000)
```

**Nginx Config**:
```nginx
server {
    listen 80;
    location / {
        proxy_pass http://localhost:3000;
    }
    location /uploads/ {
        root /home/IERG4210/website;
    }
}
```

**Why needed**:
- ✅ Node.js can't directly listen on port 80 (needs root)
- ✅ Nginx excellent performance, handles many connections
- ✅ Separate static from dynamic content
- ✅ Easy horizontal scaling (multiple Node instances)

---

### Decision 19: Why Use screen for Background Run?

**Commands**:
```bash
screen -S nodeapp  # Create screen session
npm start          # Start app
# Ctrl+A, D detach

screen -r nodeapp  # Reattach
```

**Comparison**:
| Method | Pros | Cons |
|--------|------|------|
| screen | Simple, reattachable | Manual management |
| nohup | Simple execution | No interaction |
| systemd | Auto-restart | Needs root setup |
| PM2 | Professional, auto-restart | Extra installation |

**Current Choice**:
- ✅ screen sufficient and straightforward

---

## 📊 Design Decisions Summary Table

| Technical Decision | Choice | Rationale | Alternative |
|---|---|---|---|
| Server | Express.js | Simple, flexible | Django, Flask |
| Database | SQLite | Zero-config | MySQL, PostgreSQL |
| Shopping Cart | localStorage | Client persistence | Backend sessions |
| File Upload | Multer | Express integration | formidable |
| Image Processing | Sharp | High performance | ImageMagick |
| Input Validation | express-validator | Express integration | joi, yup |
| Frontend Requests | fetch | Native API | axios, jQuery |
| Cart Data | Map | Fast lookup | Object, Array |
| Image Storage | Dual version | Performance | Single original |
| API Style | REST | Standard design | RPC, GraphQL |

---

## 🎓 Interview Emphasis

Important: **Design rationale reflects engineering thinking**

✅ Good Answer:
> "I chose localStorage for client-side cart persistence, reducing backend session management complexity and server load while keeping a temporary cart across sessions."

❌ Bad Answer:
> "I just used localStorage, no particular reason."

**Remember**: Technical choices show **system thinking** and **problem-solving skills**.

---

Excellent work preparing comprehensively!
