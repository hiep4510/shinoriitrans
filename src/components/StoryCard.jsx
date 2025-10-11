export default function StoryCard({ story, onSelect }) {
  return (
    <div className="bg-white rounded-xl shadow hover:shadow-lg cursor-pointer" onClick={onSelect}>
      <img src={`https://pub-<r2_public_url>/${story.cover_r2_key}`} alt={story.title} className="rounded-t-xl w-full h-48 object-cover" />
      <div className="p-3">
        <h3 className="font-semibold">{story.title}</h3>
        <p className="text-sm text-gray-500">{story.authors}</p>
      </div>
    </div>
  );
}
