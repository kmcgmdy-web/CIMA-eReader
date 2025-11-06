let annotations = [];
exports.handler = async function(event) {
  if(event.httpMethod === 'POST'){
    const body = JSON.parse(event.body || '{}');
    const entry = { id: 'a'+(annotations.length+1), ...body, createdAt: new Date().toISOString(), userName: body.userId || 'guest' };
    annotations.push(entry);
    return { statusCode:200, body: JSON.stringify(entry) };
  } else {
    const q = (event.queryStringParameters || {}).chapterId;
    const out = q ? annotations.filter(a=>a.chapterId === q) : annotations;
    return { statusCode:200, body: JSON.stringify(out) };
  }
};
