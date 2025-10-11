"use client";

import CommentList from "./comment-list";
import CommentForm from "./comment-form";
import { useRef } from "react";
import { useCommentCount } from "@/hooks/use-comment-count";

interface CommentSectionProps {
  id: string;
  type: "manga" | "chapter";
  title: string;
  chapterNumber?: string;
}

export default function CommentSection({
  id,
  type,
  title,
  chapterNumber,
}: CommentSectionProps) {
  // Create a reference to the CommentList component's mutate function
  const commentListRef = useRef<{ mutate: () => void } | null>(null);

  // Always call the hook unconditionally
  const commentCount = useCommentCount(type === "manga" ? id : "");

  const handleCommentPosted = () => {
    // Call the mutate function from the CommentList component to refresh data
    if (commentListRef.current) {
      commentListRef.current.mutate();
    }
    if (type === "manga") {
      commentCount.refresh();
    }
  };

  return (
    <div className="mt-4 grid grid-cols-1 gap-4 w-full">
      <CommentForm
        id={id}
        title={title}
        type={type}
        onCommentPosted={handleCommentPosted}
        chapterNumber={chapterNumber}
      />
      <CommentList id={id} type={type} ref={commentListRef} />
    </div>
  );
}
