// components/ExportButton.tsx
import React from "react";
import { useAnimation } from "@/contexts/AnimationContext";
import { Download } from "lucide-react";

export const ExportButton: React.FC = () => {
  const { exportAnimation, isExporting, frames } = useAnimation();
  console.log(frames);
  const isEmpty = frames.every((frame) => frame.length === 0);
  console.log(isEmpty);

  return (
    <button
      onClick={exportAnimation}
      disabled={isExporting || isEmpty}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-md
        ${
          isExporting || isEmpty
            ? "bg-blue-500 text-white cursor-not-allowed"
            : "bg-blue-500 text-white hover:bg-blue-600"
        }
        transition-colors duration-200
      `}
    >
      <Download size={18} />
      {isExporting ? "Exporting..." : "Export Animation"}
    </button>
  );
};
