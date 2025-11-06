exports.handler = async function(event) {
  // TODO: validate JWT, enrollment, license, expiry
  return { statusCode: 200, body: JSON.stringify({ allowed: true }) };
};