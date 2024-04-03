
// const redis = require('redis');// import the redis class from the library

// const redisHost = process.env.REDIS_HOST;
// const redisPort = process.env.REDIS_PORT;

// const redisClient = redis.createClient({
//   host: redisHost, // Redis host
//   port: redisPort,        // Redis port
// });

exports.handler = (event, context) => {
  // event.redisClient = redisClient;

  return {
    statusCode: 200,
    body: JSON.stringify({ message:"Lambda Works!", event, context })
  }
};

exports.postOrders = async (event, context) => {

	let order = req.body;
    let responseStatus = 200;
    const contentType = req.get('Content-Type');
    console.log('Content-Type:', contentType); 
	
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
  res.status(responseStatus).send({message:"you are cool"});
};  

exports.getOrders = async (event, context) => {
  // get the order from the database
  const orderId = req.params.orderId;
  let order = await getOrder({redisClient, orderId });
  if(order === null) {
      res.status(404).send("Order not found");
  } else {
      res.json(order);
  }
  };