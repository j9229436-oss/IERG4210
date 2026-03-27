# Database Setup Instructions

## SQLite Database Setup

This project uses SQLite3 as the database. The database is automatically initialized when you run the server for the first time.

### Automated Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run the Server**
   ```bash
   npm start
   ```
   or
   ```bash
   node server.js
   ```

The `db.js` file will automatically:
- Create the SQLite database file (`ecommerce.db`) if it doesn't exist
- Create the `categories` table with initial sample categories (Gaming, Food)
- Create the `products` table with initial sample products
- Insert default product data on first run

### Database Tables

#### Categories Table
```sql
CREATE TABLE categories (
  catid INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);
```

#### Products Table
```sql
CREATE TABLE products (
  pid INTEGER PRIMARY KEY AUTOINCREMENT,
  catid INTEGER NOT NULL,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  description TEXT,
  image_url TEXT,
  thumbnail_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(catid) REFERENCES categories(catid) ON DELETE CASCADE
);
```

### Sample Data Inserted

**Categories:**
- Gaming
- Food

**Products:**
- Gaming Controller ($29.99)
- Gaming Keyboard ($79.99)
- Gaming Glasses ($49.99)
- Basic White Bread ($3.30)
- Fresh Beef ($10.00)

### Resetting the Database

To reset the database and start fresh:

1. Delete the `ecommerce.db` file:
   ```bash
   rm ecommerce.db
   ```

2. Run the server again:
   ```bash
   npm start
   ```

The database will be recreated with the default sample data.

### Database Location

The SQLite database file (`ecommerce.db`) will be created in the root directory of the project.

### Accessing the Database

To manually inspect or modify the database, you can use the `sqlite3` command-line tool:

```bash
sqlite3 ecommerce.db
```

Example queries:
```sql
-- View all categories
SELECT * FROM categories;

-- View all products
SELECT * FROM products;

-- Count products
SELECT COUNT(*) FROM products;
```

## Notes

- The database auto-initializes, so no manual setup is required
- The sample data is only inserted if the categories table is empty
- All uploaded product images are stored in the `/uploads` directory
- The database file is included in the repository and can be committed to version control
