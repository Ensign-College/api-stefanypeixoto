const express = require('express'); // express makes APIs - connect frontend to database

const redis = require('redis');// import the redis class from the library
const bodyParser = require('body-parser');
const cors = require('cors'); 

const options = {
    origin:'http://localhost:3000', // allow our frontend to call this backend
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}

const app = express(); // Create an express application 
//app.listen(3000); // Listen from web requests from the frontend and don't stop
const port =3001; // port number 
app.use(bodyParser.json()); // makes body
app.use(cors(options)); // allow frontend to call backend
const redisClient = redis.createClient({
    host: 'localhost', // Redis host
    port: 6379,        // Redis port
});

const { addOrder, getOrder } = require("./.services/orderservice.js"); // import the addOrder function from the orderservice.js file
const { addOrderItem, getOrderItem } = require("./.services/orderItems.js"); // import the addOrderItem function from the OrderItems.js file
const fs = require("fs"); // import the file system library
const Schema = JSON.parse(fs.readFileSync("./orderItemSchema.json", "utf8")); // read the orderItemSchema.json file and parse it as JSON
const Ajv = require("ajv"); // import the ajv library
const ajv = new Ajv(); // create an ajv object to validate JSON

// Order
app.post("/orders", async (req, res) => {
	let order = req.body;
    let responseStatus = 200;
    const contentType = req.get('Content-Type');
    console.log('Content-Type:', contentType);
	// order details, include product quantity and shipping address 
	if (!order || !order.products) {
        responseStatus = 400;
        res.status(400).send("Invalid request body: order or products are missing");
        return;
      }    
	
	if (responseStatus === 200) {
	    try {
	    // addOrder function to handle order creation in the database
	    await addOrder ({ redisClient, order });
	    } catch (error) {
	    console.error(error);
	    res.status(500).send("Internal Server Error");
	    return;
	    }
    } else {
        res.status(resposeStatus);
        res.send(
        `Missing one of the following fields: ${
        order.productQuantity ? "" : "productQuantity"
        } ${order.ShippingAddress ? "" : "ShippingAddress"}`
        );
    }
    res.status(responseStatus).send();
    });    

app.get("/orders/:orderID", async (req, res) => {
    // get the order from the database
    const orderId = req.params.orderId;
    let order = await getOrder({redisClient, orderId });
    if(order === null) {
        res.status(404).send("Order not found");
    } else {
        res.json(order);
    }
    });

app.post("/orderItems", async (req, res) => {
    try {
        console.log("Schema:", Schema);
        const validate = ajv.compile(Schema);
        const valid = validate(req.body);
        if (!valid) {
            return res.status(400).json({ error: "Invalid request body" });
        }
        console.log("Request Body:", req.body);
    
        // Calling addOrderItem function and storing the result 
        const orderItemId = await addOrderItem({
            redisClient, 
            orderItem: req.body, 
        });
            
           // Responding with the result
        res
        .status
        .json({orderItemId, message: "Order item added successfully"});
    } catch (error) {
        console.error("Error adding order item:", error);
        res.status(500).json({error: "Internal server error"});
    }
});

app.get("/orderItems/:orderItemId", async (req, res) => {
    try {
        const orderItemId = req.params.orderItemId;
        const orderItem = await getOrderItem({ redisClient, orderItemId});
        res.json(orderItem);
    } catch (error) {
        console.error("Error getting order item:", error);
        res.status(500).json({error: "Internal server error"});
    }
}); 
    
app.get("/product/:productKey", async (req, res) => {
    let product = await redisClient.json.get(`product:${req.params.productKey}`);
    res.json(product);
});

// app.get("/products", async (req, res) => {
//     let product = await redisClient.json.get("product");
//     res.json(product);
// });

app.listen(port,()=>{
    redisClient.connect(); // connect to the database!!!!!
    console.log(`Listening on port: ${port}`); // template literal
}); // listen for web request from the frontend and dont stop

//http://localhost:3000/boxes

// app.get("",async (req, res)=>{
//     res.send("Hey");
// })

// 1- URL
// 2- a function to return boxes 
// req= the request from the browser
// res= the response to the browser

app.get('/boxes',async (req, res)=>{
    let boxes = await redisClient.json.get('boxes',{path:'$'}); // get the boxes
    // send boxes to the browser
    res.json(boxes[0]); // convert boxes to a string

}); // Return boxes to the user

//A function to create a new product
app.post('/products', async (req, res) => {
    const newProduct = req.body;

    try {
        // Assuming newProduct contains necessary fields like productID
        const productKey = `product:${newProduct.productID}-${Date.now()}`;

        // Check if the product already exists in Redis
        const existingProduct = await redisClient.json.get(productKey);

        if (existingProduct !== null) {
            // If the product already exists, return an error
            console.error(`Product ${productKey} already exists in Redis`);
            return res.status(400).json({ error: `Product ${productKey} already exists` });
        }

        // If the product does not exist, add it to Redis
        await redisClient.json.set(productKey, '.', newProduct);
        console.log('Product added successfully to Redis');
        res.json(newProduct); // Respond with the newly added product
    } catch (error) {
        console.error('Error adding product to Redis:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/boxes', async (req, res)=>{// async means we will await promises
    const newBox = req.body;
    newBox.id = parseInt(await redisClient.json.arrLen('boxes','$'))+1;//the user shouldn't be allowed to choose the ID
    await redisClient.json.arrAppend('boxes', '$',newBox); //saves the JSON in redis
    res.json(newBox);//respond with a new box
});

const searchProducts = async ({ redisClient, query, key, isText }) => {
    try {
        let value = query[key];

        // Construct the search query expression based on the key and value
        const indexName = 'idx:Product';
        const queryExpression = isText
            ? `@${key}:(${value})`
            : `@${key}:{${value}}`;

        // Perform the search query using RediSearch
        const resultObject = isText
            ? await redisClient.ft.search(indexName, queryExpression)
            : await redisClient.ft.search(indexName, queryExpression);

        // Map the search results to a more usable format
        return resultObject.documents.map(result => result.value);
    } catch (error) {
        console.error('Error in searchProducts:', error);
        throw error;
    }
};

// Create Tag type indexes in Redis - requiring exact match
const exactMatchProductFields = () => {
    return [
        "sku",
        "name",
        "productId",
        "image",
        "price"
    ];
};

// Create Text type indexes in Redis - allowing partial matching
const partiallyMatchProductFields = () => {
    return [
        "sku",
        "name",
        "productId",
        "image",
        "price"
    ];
};

module.exports = { searchProducts, exactMatchProductFields, partiallyMatchProductFields };