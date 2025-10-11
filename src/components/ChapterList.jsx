export default function ChapterList({ story, onBack, onRead }) {
  const [chapters, setChapters] = React.useState([]);

  React.useEffect(() => {
    fetch(`/api/stories?slug=${story.slug}`).then(r => r.json()).then(data => {
      setChapters(data.chapters || []);
    });
  }, [story]);

  return (
    <div className="p-6">
      <button className="mb-4 text-blue-600" onClick={onBack}>← Trở lại</button>
      <h2 className="text-xl font-bold mb-2">{story.title}</h2>
      <ul className="space-y-2">
        {chapters.map(ch => (
          <li key={ch.id}>
            <button onClick={() => onRead(ch.number)} className="text-blue-500 underline">
              {ch.title || `Chương ${ch.number}`}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
