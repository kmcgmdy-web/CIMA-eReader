exports.handler = async function() {
  return { statusCode: 200, body: JSON.stringify([{ courseId: 'cosmetology-14', title: 'Cosmetology 14', progress: 0.2 }]) };
};