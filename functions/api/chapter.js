export async function onRequestGet({ request, env }) {
  const url = new URL(request.url)
  const slug = url.searchParams.get('slug')
  const number = url.searchParams.get('number')

  if (!slug || !number) return new Response('Missing params', { status: 400 })

  const story = await env.DB.prepare('SELECT id FROM stories WHERE slug=?').bind(slug).first()
  if (!story) return new Response('Story not found', { status: 404 })

  const chapter = await env.DB.prepare(
    'SELECT * FROM chapters WHERE story_id=? AND number=?'
  ).bind(story.id, number).first()

  if (!chapter) return new Response('Chapter not found', { status: 404 })

  const object = await env.MY_R2_BUCKET.get(chapter.r2_key)
  if (!object) return new Response('Chapter file not found', { status: 404 })

  const html = await object.text()
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
