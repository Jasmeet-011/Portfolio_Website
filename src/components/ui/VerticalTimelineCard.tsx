import React from "react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

type Props = {
  date: string;
  title: string;
  company: string;
  points: string[];
  techStack?: string[];
};

export const VerticalTimelineCard: React.FC<Props> = ({
  date,
  title,
  company,
  points,
  techStack = [],
}) => {
  return (
    <motion.div
      className="relative pl-14"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      viewport={{ once: true }}
    >
      {/* Vertical line (starting below the dot) */}
      <div className="absolute left-4 top-7 bottom-0 w-0.5 bg-primary/30 z-0" />

      {/* Glowing animated dot */}
      <div className="absolute left-[7px] top-1 w-5 h-5 bg-primary rounded-full border-2 border-background shadow-[0_0_10px_3px_rgba(99,102,241,0.4)] animate-pulse z-10"></div>

      {/* Content card */}
      <div className="bg-card border border-primary/30 rounded-lg p-6 mb-10 shadow-md shadow-black/20 hover:shadow-xl transition-shadow">
        <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
          📅 {date}
        </p>
        <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
          {title} <span className="text-accent">– {company}</span>
        </h3>
        <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1 mb-3">
          {points.map((point, index) => (
            <li key={index}>{point}</li>
          ))}
        </ul>
        {techStack.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {techStack.map((tech, index) => (
              <Badge
                key={index}
                className="text-xs rounded-full bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition"
              >
                {tech}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
