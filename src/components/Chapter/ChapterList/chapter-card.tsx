"use client";
import { Chapter, ChapterGroup } from "@/types/types";
import { Clock, ExternalLink, MessageSquare, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatTimeToNow } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { GB, VN } from "country-flag-icons/react/3x2";
import NoPrefetchLink from "@/components/Custom/no-prefetch-link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChapterCardProps {
  chapters: ChapterGroup;
  finalChapter?: string;
}

interface SingleCardProps {
  chapter: Chapter;
  finalChapter?: string;
  className?: string;
}

export const ChapterCard = ({ chapters, finalChapter }: ChapterCardProps) => {
  if (chapters.group.length > 1)
    return (
      <Accordion
        type="multiple"
        className="w-full bg-card shadow-sm border rounded-[0.125rem]"
        defaultValue={["chapter"]}
      >
        <AccordionItem value="chapter" className="border-none">
          <AccordionTrigger className="p-1.5 [&[data-state=open]]:border-b">
            <p className="font-semibold text-sm md:text-base line-clamp-1">
              {chapters.chapter ? `Chapter ${chapters.chapter}` : "Oneshot"}
            </p>
          </AccordionTrigger>
          {chapters.group.map((chapter, index) => (
            <AccordionContent key={chapter.id} className="pb-0">
              <div className="pl-6">
                <SingleCard
                  chapter={chapter}
                  finalChapter={finalChapter}
                  className={cn(
                    "border-r-0 shadow-none border-b-0 rounded-none",
                    index === 0 && "border-t-0"
                  )}
                />
              </div>
            </AccordionContent>
          ))}
        </AccordionItem>
      </Accordion>
    );

  return <SingleCard chapter={chapters.group[0]} finalChapter={finalChapter} />;
};

const SingleCard = ({ chapter, finalChapter, className }: SingleCardProps) => {
  const router = useRouter();
  const isUnavailable = Boolean((chapter as any).isUnavailable);

  const card = (
    <Card
      aria-disabled={isUnavailable}
      className={cn(
        "flex flex-col justify-between rounded-[0.125rem] px-1.5 py-1.5 shadow-sm relative min-h-14 hover:bg-accent",
        isUnavailable && "opacity-90 cursor-not-allowed text-muted-foreground",
        className && className
      )}
    >
      <div className="flex justify-between">
        <div className="flex items-center space-x-1">
          {chapter.language === "vi" && (
            <VN className="inline-block select-none flex-shrink-0 !h-5 !w-5" />
          )}

          {chapter.language === "en" && (
            <GB className="inline-block select-none flex-shrink-0 !h-5 !w-5" />
          )}
          {chapter.externalUrl && <ExternalLink size={16} />}
          <p className="font-semibold text-sm md:text-base line-clamp-1 break-all">
            {chapter.chapter
              ? `Ch. ${chapter.chapter}
      ${chapter.title ? ` - ${chapter.title}` : ""}`
              : "Oneshot"}
          </p>
          {finalChapter && finalChapter === chapter.chapter && (
            <Badge className="flex items-center gap-1 px-1 py-0 font-bold rounded-[0.25rem] text-[0.625rem] max-h-4">
              END
            </Badge>
          )}
        </div>

        <Button
          size="sm"
          variant="ghost"
          className="rounded-sm gap-0.5 h-6 px-1"
        >
          <MessageSquare />
        </Button>
      </div>
      <div className="flex justify-between">
        <div className="flex items-center justify-self-start">
          <Users size={16} className="shrink-0" />
          {chapter.group.length === 0 ? (
            <span className="line-clamp-1 font-normal text-xs px-[0.25rem]">
              No Group
            </span>
          ) : (
            <div className="flex items-center space-x-1">
              {chapter.group.map((group) => (
                <Button
                  key={group.id}
                  variant="ghost"
                  className="whitespace-normal font-normal text-start line-clamp-1 rounded-sm h-4 py-0 px-[0.25rem] hover:underline hover:text-primary break-all"
                  size="sm"
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                    router.push(`/group/${group.id}`);
                  }}
                >
                  {group.name}
                </Button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-1 w-full max-w-max justify-end pr-1">
          <time
            className="text-xs font-light"
            dateTime={new Date(chapter.updatedAt).toDateString()}
          >
            {formatTimeToNow(new Date(chapter.updatedAt))}
          </time>
          <Clock size={16} className="shrink-0" />
        </div>
      </div>
    </Card>
  );

  if (isUnavailable)
    return (
      <Tooltip>
        <TooltipTrigger asChild>{card}</TooltipTrigger>
        <TooltipContent className="select-none">Không thể đọc chương này</TooltipContent>
      </Tooltip>
    );

  return (
    <NoPrefetchLink
      suppressHydrationWarning
      href={
        chapter.externalUrl ? chapter.externalUrl : `/chapter/${chapter.id}`
      }
      target={chapter.externalUrl ? "_blank" : "_self"}
    >
      {card}
    </NoPrefetchLink>
  );
};
