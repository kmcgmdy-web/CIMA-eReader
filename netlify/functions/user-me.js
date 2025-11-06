exports.handler = async function() {
  // In production verify auth token and pull user from CIMA
  return { statusCode: 200, body: JSON.stringify({ id: 'u123', name: 'Ava Martinez', role: 'student' }) };
};
