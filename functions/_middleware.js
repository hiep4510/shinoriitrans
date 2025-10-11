export async function onRequest({ request, next }) {
  const response = await next()
  response.headers.set('Access-Control-Allow-Origin', '*')
  return response
}
