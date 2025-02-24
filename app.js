const express = require('express');
const {getAllProducts, getProductsById, searchProductsByName, getCategoryById, addNewProduct, updateProducts, deleteProducts, getCustomerById, updateCustomer, getOrderByCustomer, getProductStats, getProductReview } = require('./database');
const app = express();
const PORT = 8000; 

app.use(express.json());

app.listen(PORT, () => {
    console.log('server is running');
})

app.get('/', (req,res) => {
    res.send("Hello World");
})

//Få ut alla produkter
app.get('/products', (req,res) => {
    res.json(getAllProducts())
});

//Produkt per id
app.get('/products/:id', (req,res) => {
    res.json(getProductsById(req.params.id))
}); 

//Sök per namn
app.get('/products/:name', (req,res) => {
    res.json(searchProductsByName(req.params.name))
});

//Sök produkt per namn
app.get('/products/search/:name', (req,res) => {
    res.json(searchProductsByName(req.params.name))
});

//Kategori per id
app.get ('/products_categories/:id', (req,res) => {
    res.json(getCategoryById(req.params.id))
});

//Lägg till ny produkt
app.post('/products', (req,res) => {
    const {manufacturer_id, name, description, price, stock_quantity } = req.body;
    res.status(201).json(addNewProduct(req.manufacturer_id, name, description, price, stock_quantity))
});


//Uppdatera produkt
/*{
    "name": "Johan rehn",
    "email": "john.doe@example.com",
    "phone": "1234567890",
    "address": "123 Main St, Cityville"
  }*/
app.put('/products/:id', (req,res) => {
    const {manufacturer_id, name, description, price, stock_quantity } = req.body;
    res.status(201).json(updateProducts(req.params.id, manufacturer_id, name, description, price, stock_quantity))
});

//Radera produkt
app.delete('/products/:id', (req,res) => {
    res.send(deleteProducts(req.params.id));
});

//Kund per id
app.get('/customers/:id', (req,res) => {
    res.json(getCustomerById(req.params.id));
});

//Uppdatera kunduppgifter
app.put('/customers/:id', (req, res) => {
    const { name, email, phone, address } = req.body;
    const customerId = req.params.id;
  
    const updatedCustomer = updateCustomer(name, email, phone, address, customerId);
  
    if (updatedCustomer) {
        res.status(200).json(updatedCustomer);  // Returnera den uppdaterade kundens data
    } else {
        res.status(400).json({ message: 'Failed to update customer.' });  // Misslyckades med att uppdatera
    }
  });

// Kund order
app.get('/customers/:id/orders', (req,res) => {
    res.send(getOrderByCustomer(req.params.id));
});

//Produkt statistik 
app.get("/products/stats/categories", (req, res) => {
    res.send(getProductStats());
  });

// Produkt review
  app.get("/products/stats/reviews", (req, res) => {
    res.send(getProductReview());
  });