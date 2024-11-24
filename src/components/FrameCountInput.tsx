import { useAnimation } from "@/contexts/AnimationContext";

export function FrameCountInput() {
  const {
    pendingFrameCount,
    numFrames,
    setPendingFrameCount,
    handleNumFramesChange,
  } = useAnimation();

  return (
    <div className="flex items-center">
      <label htmlFor="frameCount" className="text-sm font-medium">
        Frames
      </label>
      <input
        id="frameCount"
        type="number"
        min="1"
        max="120"
        value={pendingFrameCount}
        onChange={(e) =>
          setPendingFrameCount(Math.max(1, parseInt(e.target.value) || 1))
        }
        className="ml-2 rounded-r-none w-20 px-2 py-1 border border-gray-300 rounded-md focus:outline-none 
                 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
      <button
        onClick={handleNumFramesChange}
        disabled={pendingFrameCount === numFrames}
        className="rounded-l-none px-4 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
                 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        Update
      </button>
    </div>
  );
}
