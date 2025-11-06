exports.handler = async function(event) {
  const params = event.queryStringParameters || {};
  const structure = { courseId: params.courseId || 'cosmetology-14', chapters: [
    { id: 'FND-CH6', title: 'Chemistry & Chemical Safety (Foundations 1e, Ch 6)' }
  ]};
  return { statusCode: 200, body: JSON.stringify(structure) };
};
