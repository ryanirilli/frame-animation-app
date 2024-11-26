import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { useAnimation } from "@/contexts/AnimationContext";

export const PlaybackControls: React.FC = () => {
  const { frames, activeFrame, setActiveFrame, isPlaying, setIsPlaying } =
    useAnimation();

  const handlePrevFrame = () => {
    setActiveFrame(activeFrame === 0 ? frames.length - 1 : activeFrame - 1);
  };

  const handleNextFrame = () => {
    setActiveFrame(activeFrame === frames.length - 1 ? 0 : activeFrame + 1);
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="flex justify-center gap-2 rounded-lg bg-backgroundContrast overflow-hidden">
      <button
        onClick={handlePrevFrame}
        className="p-2  hover:bg-blue-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Previous frame"
        disabled={isPlaying}
      >
        <SkipBack className="w-5 h-5" />
      </button>
      <button
        onClick={togglePlayback}
        className="p-2  hover:bg-blue-500 hover:text-white transition-colors"
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <Pause className="w-5 h-5" />
        ) : (
          <Play className="w-5 h-5" />
        )}
      </button>
      <button
        onClick={handleNextFrame}
        className="p-2  hover:bg-blue-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Next frame"
        disabled={isPlaying}
      >
        <SkipForward className="w-5 h-5" />
      </button>
    </div>
  );
};
