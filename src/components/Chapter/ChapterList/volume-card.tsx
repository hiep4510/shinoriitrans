import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Volume } from "@/types/types";
import { ChapterCard } from "./chapter-card";
import { ListTree, ListX } from "lucide-react";

interface VolumeCardProps {
  volume: Volume;
  finalChapter?: string;
}

export const VolumeCard = ({ volume, finalChapter }: VolumeCardProps) => {
  const volumeLabel = volume.vol ? `Volume ${volume.vol}` : "No Volume";

  return (
    <Accordion type="multiple" defaultValue={["vol"]}>
      <AccordionItem value="vol" className="border-none">
        <AccordionTrigger className="[&>svg]:w-5 [&>svg]:h-5">
          <div className="flex gap-0.5 items-center text-base">
            {volumeLabel === "No Volume" ? <ListX /> : <ListTree />}
            {volumeLabel}
          </div>
        </AccordionTrigger>

        {volume.chapters.map((chapter) => (
          <AccordionContent key={chapter.chapter} className="pb-2">
            <ChapterCard chapters={chapter} finalChapter={finalChapter} />
          </AccordionContent>
        ))}
      </AccordionItem>
    </Accordion>
  );
};
