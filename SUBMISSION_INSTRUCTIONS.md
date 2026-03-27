g# IERG4210 E-commerce Project Submission

## Project Overview

This is a full-stack e-commerce website built with:
- **Backend:** Node.js with Express.js
- **Frontend:** HTML5, CSS3, JavaScript (React-like patterns)
- **Database:** SQLite3
- **File Upload:** Multer + Sharp (image processing)
- **Validation:** Express-validator

## Submission Contents

### Files Included

```
.
├── package.json                    # Node.js dependencies
├── server.js                       # Main backend server (Express)
├── db.js                          # Database initialization and setup
├── README.md                       # Original project README
├── DB_SETUP_INSTRUCTIONS.md       # Database setup guide
├── SUBMISSION_INSTRUCTIONS.md     # This file
├── .gitignore                     # Git ignore file
├── public/                        # Frontend (static HTML/CSS/JS)
│   ├── index.html                # Home page
│   ├── product.html              # Product detail page
│   ├── admin.html                # Admin dashboard
│   ├── category1.html            # Category page
│   ├── products.json             # Product metadata
│   ├── css/
│   │   └── style.css             # Styling
│   ├── js/
│   │   ├── script.js             # Global scripts
│   │   ├── cart.js               # Shopping cart logic
│   │   ├── products.js           # Product listing
│   │   ├── index-dynamic.js      # Home page dynamic content
│   │   ├── product-dynamic.js    # Product page dynamic content
│   │   └── admin.js              # Admin panel logic
│   └── images/                   # Product images
├── uploads/                       # Directory for user uploads (auto-created)
├── ecommerce.db                  # SQLite database (auto-created on first run)
└── node_modules/                 # Installed packages (NOT included in submission)
```

### Excluded Files

The following are **NOT included** in this submission:
- `node_modules/` - Install via `npm install`
- `.git/` - Version control metadata
- `package-lock.json` - Will be regenerated

### Sensitive Information

All sensitive information has been removed/masked:
- ✅ IP addresses masked (changed to `YOUR_SERVER_IP`)
- ✅ No API keys or tokens included
- ✅ No passwords in code
- ✅ No authentication tokens stored in files

## How to Rebuild and Run

### Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

### Step 1: Extract the Submission

```bash
unzip IERG4210_submission.zip
cd IERG4210
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages from `package.json`:
- express
- express-validator
- body-parser
- multer
- sharp
- sqlite3

### Step 3: Start the Server

```bash
npm start
```

or

```bash
node server.js
```

**Output:**
```
Connected to SQLite database at: [path]/ecommerce.db
Categories table ready
Products table ready
Server listening on port 3000
Server running at http://localhost:3000
```

### Step 4: Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

### Database Auto-Initialization

On first run, the `db.js` file will automatically:
1. Create the SQLite database file (`ecommerce.db`)
2. Create the `categories` table
3. Create the `products` table
4. Insert sample data (Gaming and Food categories with 5 demo products)

**No manual database setup is required.**

## Project Structure

### Backend

**server.js** - Main Express server with APIs:
- `GET /api/categories` - Get all categories
- `GET /api/categories/:catid` - Get single category
- `POST /api/categories` - Create new category
- `PUT /api/categories/:catid` - Update category
- `DELETE /api/categories/:catid` - Delete category
- `GET /api/products` - Get all products (with optional category filter)
- `GET /api/products/:pid` - Get single product
- `POST /api/products` - Create product with image upload
- `PUT /api/products/:pid` - Update product
- `DELETE /api/products/:pid` - Delete product
- Static file serving from `/public` directory

**db.js** - Database initialization:
- SQLite database setup
- Table creation with foreign keys
- Sample data initialization
- Connection management

### Frontend

**index.html** - Home page with category listing and product display
- Responsive design
- Dynamic product loading
- Shopping cart integration

**product.html** - Individual product detail page
- Product information display
- Add to cart functionality
- Image gallery

**admin.html** - Admin dashboard (no authentication)
- Category management (CRUD)
- Product management (CRUD)
- Image upload with thumbnail generation

**Styling and Scripts:**
- `css/style.css` - Global styles with responsive design
- `js/script.js` - Common utility functions
- `js/cart.js` - Shopping cart state management
- `js/products.js` - Product fetching and rendering
- `js/admin.js` - Admin dashboard functionality
- `js/index-dynamic.js` - Home page dynamic content
- `js/product-dynamic.js` - Product page dynamic content

## Features Implemented

### Core Features
- ✅ Product browsing by category
- ✅ Shopping cart with persistence (localStorage)
- ✅ Product detail page
- ✅ Admin dashboard for product management
- ✅ Category management
- ✅ Image upload with thumbnail generation
- ✅ Form validation (server-side)

### Technical Features
- ✅ RESTful API design
- ✅ SQLite database with proper schema
- ✅ File upload handling (Multer)
- ✅ Image processing (Sharp for thumbnails)
- ✅ Input validation (Express-validator)
- ✅ Responsive frontend design
- ✅ localStorage for shopping cart persistence

## Important Notes

### Admin Panel Authentication
⚠️ **Note:** The admin dashboard (`/admin.html`) currently has **NO authentication**. This is intentional for this submission. In a production environment, you should add:
- Login page with username/password
- JWT token-based authentication
- Session management

### Directory Permissions
Ensure the `uploads/` directory is writable:
```bash
chmod 755 uploads/
```

### Port Configuration
The server runs on port 3000 by default. To change the port, modify the `PORT` variable in `server.js`:
```javascript
const PORT = 3000; // Change this value
```

### Image Paths
Product images should be placed in:
- `/public/images/` - Original images
- `/uploads/` - User-uploaded images and thumbnails

## Testing the Application

### Home Page
```
http://localhost:3000/
```
View all products organized by category

### Product Detail
```
http://localhost:3000/product.html?pid=1
```
View detailed info for product ID 1

### Admin Dashboard
```
http://localhost:3000/admin.html
```
Manage products and categories (no auth required)

### Shopping Cart
- Click "Add to Cart" on any product
- Cart persists in browser's localStorage
- View cart by clicking cart icon/button

## API Testing

### Get All Products
```bash
curl http://localhost:3000/api/products
```

### Get Products by Category
```bash
curl http://localhost:3000/api/products?catid=1
```

### Create New Category
```bash
curl -X POST http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -d '{"name":"Electronics"}'
```

### Create Product (with image)
```bash
curl -X POST http://localhost:3000/api/products \
  -F "catid=1" \
  -F "name=New Product" \
  -F "price=29.99" \
  -F "description=Product description" \
  -F "image=@/path/to/image.jpg"
```

## Database Reset

To reset the database and start fresh with sample data:

```bash
rm ecommerce.db
npm start
```

## Troubleshooting

### Port 3000 Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Change port in server.js or kill the process
kill -9 <PID>
```

### Module Not Found Error
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Database Locked Error
```bash
# Ensure no other process is accessing the database
# Try deleting ecommerce.db and restarting
rm ecommerce.db
npm start
```

### Image Upload Issues
```bash
# Ensure uploads directory exists and is writable
mkdir -p uploads/thumbnails
chmod 755 uploads uploads/thumbnails
```

## Deployment

For production deployment (e.g., on Azure, AWS, etc.):

1. Install Node.js on server
2. Extract submission files
3. Run `npm install` (uses production dependencies)
4. Configure web server (Nginx/Apache) to proxy to port 3000
5. Run server with process manager (PM2, systemd, etc.)

Example Nginx configuration:
```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Serve uploaded files
    location /uploads/ {
        alias /path/to/project/uploads/;
    }
}
```

## Files Regenerated on First Run

The following files/directories will be automatically created when you run the server:

- `ecommerce.db` - SQLite database file
- `uploads/` - Directory for product images
- `uploads/thumbnails/` - Directory for thumbnail images

## Support

For issues or clarification on the project:
- Check DB_SETUP_INSTRUCTIONS.md for database help
- Review the Q&A folder in the submission for architecture decisions
- Consult server.js API documentation in code comments

---

**Submission Date:** February 2026
**Course:** IERG4210
**Technology Stack:** Node.js, Express, SQLite3, HTML5, CSS3, JavaScript
