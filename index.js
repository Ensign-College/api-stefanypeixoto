const express = require('express'); // express makes APIs - connect frontend to database

const app = express(); // Create an express application

app.listen(3000); // Listen from web requests from the frontend and don't stop

const boxes = [
    {boxId:1},
    {boxId:2},
    {boxId:3},
    {boxId:4}
];
// 1- URL
// 2- a function to return boxes 
// req= the request from the browser
// res= the response to the browser
app.get('/boxes', (req, res)=>{
    // send boxes to th browser
    res.send(JSON.stringify(boxes)); // convert boxes to a string

}); // Return boxes to the user

console.log("Hello");
