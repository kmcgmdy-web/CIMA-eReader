let ctx = {};
exports.handler = async function(event) {
  if(event.httpMethod === 'POST'){
    const body = JSON.parse(event.body || '{}');
    ctx = { ...ctx, ...body, updatedAt: new Date().toISOString() };
    return { statusCode:200, body: JSON.stringify(ctx) };
  }
  return { statusCode:200, body: JSON.stringify(ctx) };
};
