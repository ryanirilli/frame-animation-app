// Timeline.tsx
import React from "react";
import { useAnimation } from "@/contexts/AnimationContext";
import { DiamondPlus } from "lucide-react";

const Timeline: React.FC = () => {
  const { 
    frames, 
    activeFrame, 
    setActiveFrame, 
    isPlaying,
    keyframes,
    toggleKeyframe 
  } = useAnimation();

  return (
    <div className="w-full max-w-[1000px] space-y-4">
      <div className="relative">
        <div className="h-20 bg-gray-100 rounded-lg p-2 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {frames.map((_, index) => (
              <div key={index} className="relative">
                <button
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
                
                {/* Keyframe toggle button */}
                <button
                  onClick={() => toggleKeyframe(index)}
                  disabled={isPlaying}
                  className={`
                    absolute -top-2 -right-2 p-1 rounded-full
                    ${keyframes.has(index) 
                      ? "bg-yellow-400 text-white" 
                      : "bg-gray-200 text-gray-400 hover:bg-gray-300"
                    }
                  `}
                >
                  <DiamondPlus size={12} fill={keyframes.has(index) ? "currentColor" : "none"} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timeline;