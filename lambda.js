


exports.handler = (event, context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message:"Lambda Works!", event, context })
  }
};