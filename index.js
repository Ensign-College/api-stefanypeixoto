const express = require('express'); // express makes APIs - connect frontend to database

const app = express(); // Create an express application
const Redis = require('redis'); // import the redis class from the library
const bodyParser =require('body-parser');
const cors = require('cors'); 

const options = {
    origin:'http://localhost:3000' // allow our frontend to call this backend
}

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

app.get("",async (req, res)=>{
    res.send("Hey");
})

app.post('/boxes',async (req,res)=>{ // async means we will await promises
    const newBox = req.body; // now we have a box 
    newBox.id= parseInt(await redisClient.json.arrLen('boxes','$'))+1; // the user shouldn't choose the ID
    await redisClient.json.arrAppend('boxes','$',newBox);
    res.json(newBox); // respond with a new box 
})

// 1- URL
// 2- a function to return boxes 
// req= the request from the browser
// res= the response to the browser
app.get('/boxes',async (req, res)=>{
    let boxes = await redisClient.json.get('boxes',{path:'$'}); // get the boxes
    // send boxes to the browser
    res.json(boxes[0]); // convert boxes to a string

}); // Return boxes to the user

console.log("Hello");
