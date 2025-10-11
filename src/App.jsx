import React, { useEffect, useState } from "react";
import StoryCard from "./components/StoryCard";
import ChapterList from "./components/ChapterList";
import Reader from "./components/Reader";

export default function App() {
  const [stories, setStories] = useState([]);
  const [selected, setSelected] = useState(null);
  const [chapter, setChapter] = useState(null);

  useEffect(() => {
    fetch("/api/stories").then(res => res.json()).then(setStories);
  }, []);

  if (chapter) return <Reader slug={selected.slug} number={chapter} onBack={() => setChapter(null)} />;
  if (selected) return <ChapterList story={selected} onBack={() => setSelected(null)} onRead={setChapter} />;

  return (
    <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
      {stories.map(story => (
        <StoryCard key={story.id} story={story} onSelect={() => setSelected(story)} />
      ))}
    </div>
  );
}
