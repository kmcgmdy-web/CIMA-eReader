let store = [];
exports.handler = async function(event) {
  if(event.httpMethod === 'POST'){
    try{
      const body = JSON.parse(event.body || '{}');
      body.createdAt = new Date().toISOString();
      store.push(body);
      return { statusCode: 200, body: JSON.stringify({ ok:true }) };
    }catch(e){
      return { statusCode: 400, body: JSON.stringify({ error:'bad json' }) };
    }
  } else {
    return { statusCode: 200, body: JSON.stringify(store) };
  }
};
