import { useAnimation } from "@/contexts/AnimationContext";

const FPS_OPTIONS = [3, 12, 24] as const;

export function FrameRateControl() {
  const { fps, setFps } = useAnimation();

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">Frame Rate</span>
      <div className="inline-flex rounded-lg shadow-sm" role="group">
        {FPS_OPTIONS.map((option) => (
          <button
            key={option}
            onClick={() => setFps(option)}
            className={`
              px-4 py-2 text-sm font-medium
              ${
                fps === option
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }
              border border-gray-200
              first:rounded-l-lg first:border-r-0
              last:rounded-r-lg last:border-l-0
              focus:z-10 focus:ring-1 focus:ring-blue-500 focus:ring-offset-0
              transition-colors
            `}
          >
            {option} FPS
          </button>
        ))}
      </div>
    </div>
  );
}