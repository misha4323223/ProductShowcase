// DEPRECATED: Этот файл больше не используется
// Webhook обрабатывается в broadcast-notifications функции
module.exports.handler = async (event) => {
  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
