import React from "react";
import { useAnimation } from "@/contexts/AnimationContext";

const Timeline: React.FC = () => {
  const { frames, activeFrame, setActiveFrame, isPlaying } = useAnimation();

  return (
    <div className="w-full max-w-[1000px] space-y-4">
      {/* Frame Timeline */}
      <div className="relative">
        {/* Timeline track */}
        <div className="h-20 bg-gray-100 rounded-lg p-2 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {frames.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveFrame(index)}
                disabled={isPlaying}
                className={`
                  w-16 h-16 rounded-md border-2 transition-all
                  flex items-center justify-center
                  ${
                    index === activeFrame
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }
                  ${isPlaying ? "cursor-not-allowed opacity-50" : ""}
                `}
              >
                <span className="text-sm font-medium text-gray-600">
                  {index + 1}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timeline;
