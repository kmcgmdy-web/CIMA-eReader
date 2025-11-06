exports.handler = async function(event) {
  const q = (event.queryStringParameters || {}).contentId || 'FND-CH6';
  if(q === 'FND-CH6'){
    return { statusCode: 200, body: JSON.stringify({
      id: 'FND-CH6',
      title: 'Chemistry & Chemical Safety',
      chapter: 'Foundations 1e - Chapter 6',
      type: 'pdf',
      // Served as a relative asset within the same site; avoid exposing direct download links
      url: '/assets/Foundations1e_Ch6.pdf'
    }) };
  }
  return { statusCode: 404, body: JSON.stringify({ error: 'Not found' }) };
};
