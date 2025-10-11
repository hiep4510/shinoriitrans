import { useEffect, useState } from "react";
import "./Reader.css";

export default function Reader({ slug, number, onBack }) {
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchChapter() {
      try {
        setLoading(true);
        const res = await fetch(`/api/chapter?slug=${slug}&number=${number}`);
        if (!res.ok) throw new Error("Không tìm thấy chương");
        const text = await res.text();
        setHtml(text);
      } catch (err) {
        setHtml(`<p style="text-align:center;color:red;">${err.message}</p>`);
      } finally {
        setLoading(false);
      }
    }
    fetchChapter();
  }, [slug, number]);

  return (
    <div className="reader-container">
      <header className="reader-header">
        <button className="back-btn" onClick={onBack}>← Trở lại</button>
        <h1 className="title">Chương {number}</h1>
      </header>

      {loading ? (
        <div className="loading">Đang tải chương...</div>
      ) : (
        <div
          className="chapter-content"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}

      <footer className="reader-footer">
        <p>© 2025 ShinoriiTrans — Powered by Cloudflare Pages</p>
      </footer>
    </div>
  );
}
