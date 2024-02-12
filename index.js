const express = require('express'); // express makes APIs - connect frontend to database

const Redis = require('redis'); // import the redis class from the library
const bodyParser =require('body-parser');
const cors = require('cors'); 

const options = {
    origin:'http://localhost:3000' // allow our frontend to call this backend
}

const app = express(); // Create an express application 
const redisClient = Redis.createClient({
    url:`redis://localhost:6379`
});

//app.listen(3000); // Listen from web requests from the frontend and don't stop
const port =3001; // port number 
app.use(bodyParser.json()); // makes body
app.use(cors(options)); // allow frontend to call backend

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
app.post('/products', async (req, res)=>{// async means we will await promises

    const newProduct = req.body; //creating a new, hard coded, product with dummy data
        
    const productKey = `product:${newProduct.productID}-${Date.now()}`; //creating the unique product ID (to name it in redis), with the productID and the current date information

    try {
        // Set the value of the 'product' key in Redis with the JSON object
        await redisClient.json.set(productKey, '.', newProduct);
        console.log('Product added successfully to Redis');
      } catch (error) {
        console.error('Error adding product to Redis:', error);
      }
    res.json(newProduct);//respond with a new product
});

app.post('/boxes', async (req, res)=>{// async means we will await promises
    const newBox = req.body;
    newBox.id = parseInt(await redisClient.json.arrLen('boxes','$'))+1;//the user shouldn't be allowed to choose the ID
    await redisClient.json.arrAppend('boxes', '$',newBox); //saves the JSON in redis
    res.json(newBox);//respond with a new box
});

app.get('/products', async (req, res) => {
    try {
        const products = await redisClient.keys('product:*'); // Retrieve all keys starting with 'product:'
        const productDetails = await Promise.all(products.map(async (key) => {
            const product = await redisClient.json.get(key);
            return product;
        }));
        res.json(productDetails);
    } catch (error) {
        console.error('Error fetching products from Redis:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});