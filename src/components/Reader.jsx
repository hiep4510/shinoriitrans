export default function Reader({ slug, number, onBack }) {
  const [content, setContent] = React.useState("Đang tải chương...");

  React.useEffect(() => {
    fetch(`/api/chapter?slug=${slug}&number=${number}`)
      .then(res => res.text())
      .then(setContent)
      .catch(() => setContent("Không tải được chương."));
  }, [slug, number]);

  return (
    <div className="p-4 max-w-3xl mx-auto bg-white shadow rounded-xl">
      <button className="text-blue-600 mb-4" onClick={onBack}>← Trở lại</button>
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
}
