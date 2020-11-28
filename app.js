const express = require('express')
    const app = express()
    const port = 3000
    app.use(express.json())

    // Create Connection Pool
    const mysql = require("mysql2/promise");

    const pool = mysql.createPool({
            host: "localhost",
            port: 3306,
            user: "root",
            password: "K@lyani",
            database: "shopping_app_db",
            connectionLimit: 10
    });

    //const Joi = require('joi');

    const options = {
    abortEarly: false, // include all errors
    allowUnknown: true, // ignore unknown props
    stripUnknown: true // remove unknown props
    };

    // Create Routes
    app.get('/', (req,res)=>res.send("API Server working"));
    app.get('/api/users', getAllUsers);
    app.post('/api/users', createUser);
    app.post("/api/users/login",login);
    app.get('/api/products', getAllProducts);
    app.post('/api/products', addProducts);
    app.get('/api/orders', getAllOrders);
    app.post('/api/orders', addOrders);

    async function getAllUsers(req,res){    
        const result = await pool.query("select * from users");    
        res.status(200).json(result[0]);
    }

    async function createUser(req,res){
        let user = req.body;
        let params = [ user.username, user.email, user.password,user.role];
        const result = await pool.query("insert into users (username,email,password,role) values ( ?,?,?,?)", params);    
        res.status(201).json({id:result[0].insertId});        
    }

   
    async function login(req,res){
        let {email,password} = req.body;
        let params = [email,password];
        let result = await pool.query ("select id,username,email,role from users where email=? and password = ?", params);
        let users = result[0];
        if(users.length == 0){
            res.json({message:"Invalid Login Credentials"});
        }
        else{
            let user = users[0];
            res.json(user);
        }
    }

    async function getAllProducts(req,res){    
        const result = await pool.query("select * from products");    
        res.status(200).json(result[0]);
    }
    async function addProducts(req,res){
        let prod = req.body;
        let params = [ prod.product_id,prod.product_name, prod.product_price, prod.product_description,prod.category,prod.productrange];
        const result = await pool.query("insert into products (product_id,product_name,product_price,product_description,category,productrange) values ( ?,?,?,?,?,?)", params);    
        res.status(201).json({id:result[0].insertId});        
    }

    async function getAllOrders(req,res){    
        const result = await pool.query("select * from orders o,order_items oi, products p where o.id=oi.order_id AND p.product_id=oi.product_id "); 

        res.status(200).json(result[0]);
    }
    async function addOrders(req,res){
        let order = req.body;
        const items = order.items;
        let total_amount = 0; 
        for(let item of items){
            total_amount = total_amount+item.price*item.quantity;
        }
        
        let params = [order.user_id,order.total_amount, order.order_date, order.status];
        const result = await pool.query("insert into orders (user_id,total_amount,order_date,status) values (?,?,?,?)", params); 
        let order_id = result[0].insertId;
        
        
        for(let item of items){
            
            let itemparams = [order_id,item.product_id, item.price, item.quantity];
        const result = await pool.query("insert into order_items (order_id,product_id, price, quantity) values (?,?,?,?)", itemparams); 
        }   
        res.status(201).json({id:order_id});        
    }

    // Create Commmon Error Handler
    app.use(function (err, req, res, next) {
        console.log("common error handler")
        console.error(err);
        res.json({errorMessage:err.message});
    })

    app.listen(port, () => console.log(`app listening on port port!`))