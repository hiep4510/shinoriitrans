export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare("SELECT * FROM stories").all()
  return Response.json(results)
}
