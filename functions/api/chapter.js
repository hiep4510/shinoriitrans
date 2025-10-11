export async function onRequestGet({ request, env }) {
  const url = new URL(request.url)
  const slug = url.searchParams.get('slug')
  const number = url.searchParams.get('number')

  if (!slug || !number)
    return new Response('Missing params', { status: 400 })

  const story = await env.DB.prepare(
    'SELECT id FROM stories WHERE slug=?'
  ).bind(slug).first()

  if (!story)
    return new Response('Story not found', { status: 404 })

  const chapter = await env.DB.prepare(
    'SELECT * FROM chapters WHERE story_id=? AND number=?'
  ).bind(story.id, number).first()

  if (!chapter)
    return new Response('Chapter not found', { status: 404 })

  if (!chapter.content_url)
    return new Response('Missing chapter content URL', { status: 404 })

  // ✅ Fetch nội dung chương từ URL
  const response = await fetch(chapter.content_url)
  if (!response.ok)
    return new Response('Failed to fetch chapter content', { status: 500 })

  const html = await response.text()
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
