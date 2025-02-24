const Database = require('better-sqlite3');
const db = new Database('./webbutiken.db', {verbose: console.log});

db.exec('PRAGMA foreign_keys = ON;');

// Produkthantering
const query = `SELECT
products.product_id,
products.name,
products.description,
products.price,
products.stock_quantity,
manufacturers.name AS manufacturer,
categories.name AS category
FROM products
JOIN manufacturers ON products.manufacturer_id = manufacturers.manufacturer_id
LEFT JOIN products_categories ON products.product_id = products_categories.product_id
LEFT JOIN categories ON products_categories.category_id = categories.category_id
`

function getAllProducts () {
    return db.prepare(query).all();
}

function getProductsById(id) {
    return db.prepare(`${query} WHERE products.product_id= ?`).get(id);
}

function searchProductsByName(name) {
    return db.prepare(`${query} WHERE products.name LIKE ?`).all(`%${name}%`);
}

function getCategoryById(id) {
    return db.prepare(`${query} WHERE categories.category_id = ?`).get(id); 
}

function addNewProduct(manufacturer_id, name, description, price, stock_quantity){
    try {
        const stmt = db.prepare('INSERT into products (manufacturer_id, name, description, price, stock_quantity) VALUES (?,?,?,?,?)');
        return db.run(manufacturer_id, name, description, price, stock_quantity);
    } catch (err) {
        console.log("Failed to add product", err)
    }
}

function updateProducts(id, manufacturer_id, name, description, price, stock_quantity) {
    try{
        const stmt = db.prepare('UPDATE products SET manufacturer_id = ?, name = ?, description = ?, price = ?, stock_quantity = ? WHERE product_id = ? ');
        return stmt.run(manufacturer_id, name, description, price, stock_quantity, id);
    } catch(err){
        console.log('Failed to update product: ', err)
    }
}

function deleteProducts(id) {
    const stmt = db.prepare('DELETE FROM products WHERE product_id = ?');
    return stmt.run(id);
}

// Kundhantering
    const customerQuery = `SELECT 
    customers.customer_id AS Customer_Id, 
    customers.name AS Name, 
    customers.email AS Email, 
    customers.phone AS Phone_Nr, 
    customers.address AS Address, 
    customers.password AS Password,
    JSON_GROUP_ARRAY(JSON_OBJECT('Order_Nr', orders.order_id, 'Order_Date', orders.order_date)) AS Orders
  FROM customers
  LEFT JOIN orders ON orders.customer_id = customers.customer_id
  WHERE customers.customer_id = ?
  GROUP BY customers.customer_id
  `

  function getCustomerById (id) {
    return db.prepare(customerQuery).get(id);
  }

  function updateCustomer(name, email, phone, address, id) {
    try {
        const stmt = db.prepare('UPDATE customers SET name = ?, email = ?, phone = ?, address = ? WHERE customer_id = ?');
        stmt.run(name, email, phone, address, id);

        // Hämta och returnera den uppdaterade kundens data
        return db.prepare('SELECT * FROM customers WHERE customer_id = ?').get(id);
    } catch (err) {
        console.error('Failed to update customer: ', err);
        return null;
    }
}

const orderQuery = `SELECT
orders.order_id AS Order_Nr, 
orders.order_date AS Order_Date,
products.name AS Product,
orders_products.quantity AS Quantity,
orders_products.unit_price AS Unit_Price
FROM customers
LEFT JOIN orders ON orders.customer_id = customers.customer_id
LEFT JOIN orders_products ON orders_products.order_id = orders.order_id
LEFT JOIN products ON products.product_id = orders_products.product_id
WHERE customers.customer_id = ?
`

function getOrderByCustomer() {
    const stmt = db.prepare(orderQuery);
    return stmt.all(id);
}

const productStatsQuery = `SELECT 
      categories.name AS Category,
      COUNT(products.product_id) AS Products,
      AVG(products.price) AS Average_Price
    FROM categories
    LEFT JOIN products_categories ON products_categories.category_id = categories.category_id
    LEFT JOIN products ON products.product_id = products_categories.product_id
    GROUP BY categories.category_id
  `
function getProductStats() {
    const stmt = db.prepare(productStatsQuery);
    return stmt.all();
}

const productReviewQuery = `SELECT 
products.name AS Product, 
AVG(reviews.rating) AS Average_Score
FROM products
LEFT JOIN reviews ON reviews.product_id = products.product_id
GROUP BY products.product_id
`
function getProductReview() {
    const stmt = db.prepare(productReviewQuery)
    return stmt.all();
}

function cascadeDelete() {
    // Skapar ny tabell 
    db.prepare(`CREATE TABLE new_reviews (
        review_id INTEGER PRIMARY KEY,
        product_id INTEGER, 
        customer_id INTEGER,
        rating INTEGER,
        comment TEXT,
        FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE)`).run();
    // Kopiera data från reviews till new reviews
    db.prepare(`INSERT INTO new_reviews (review_id, product_id, customer_id, rating, comment)
    SELECT review_id, product_id, customer_id, rating, comment FROM reviews`).run();

    //Byter namn på nya tabellen och droppar den gamla. 
    db.prepare(`DROP TABLE reviews;`).run();
    db.prepare(`ALTER TABLE new_reviews RENAME TO reviews`).run()
}

function cascadeUpdate() {
    // Skapar ny tabell 
    db.prepare(`CREATE TABLE IF NOT EXISTS new_products_categories (
      id INTEGER PRIMARY KEY,
      product_id INTEGER,
      category_id INTEGER,
      FOREIGN KEY (product_id) REFERENCES products (product_id) ON UPDATE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories (category_id) ON UPDATE CASCADE)`).run();

  // Kopiera data från product_categories till new_product_categories
    db.prepare(`INSERT INTO new_products_categories (id, product_id, category_id)
        SELECT id, product_id, category_id FROM products_categories
    `).run();

  // Byter namn på nya tabellen och droppar den gamla
    db.prepare(`DROP TABLE products_categories`).run();
    db.prepare(`ALTER TABLE new_products_categories RENAME TO products_categories`).run();
}

module.exports = {getAllProducts, getProductsById, searchProductsByName, getCategoryById, addNewProduct, updateProducts, deleteProducts, getCustomerById, updateCustomer, getOrderByCustomer, getProductStats, getProductReview};
