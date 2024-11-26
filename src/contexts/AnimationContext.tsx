import React, {
  createContext,
  useEffect,
  useContext,
  useReducer,
  useRef,
  useCallback,
} from "react";
import GIF from "gif.js";
import { produce, enableMapSet } from "immer";

enableMapSet();

const DEFAULT_NUM_FRAMES = 12;
const DEFAULT_FPS = 12;
const MAX_UNDO_STATES = 3;

type TUndoState = {
  frameIndex: number;
  states: string[];
};

interface AnimationState {
  frames: string[];
  activeFrame: number;
  isPlaying: boolean;
  numFrames: number;
  pendingFrameCount: number;
  fps: number;
  undoStack: TUndoState;
  keyframes: Set<number>;
  isExporting: boolean;
}

type AnimationAction =
  | { type: "SET_FRAME_DATA"; frameIndex: number; data: string }
  | { type: "SET_ACTIVE_FRAME"; frame: number }
  | { type: "SET_PLAYING"; isPlaying: boolean }
  | { type: "SET_PENDING_FRAME_COUNT"; count: number }
  | { type: "APPLY_FRAME_COUNT" }
  | { type: "SET_FPS"; fps: number }
  | { type: "SAVE_DRAWING_STATE"; frameData: string }
  | { type: "UNDO" }
  | { type: "TOGGLE_KEYFRAME"; frame: number }
  | { type: "SET_EXPORTING"; isExporting: boolean };

const initialState: AnimationState = {
  frames: Array(DEFAULT_NUM_FRAMES).fill(""),
  activeFrame: 0,
  isPlaying: false,
  numFrames: DEFAULT_NUM_FRAMES,
  pendingFrameCount: DEFAULT_NUM_FRAMES,
  fps: DEFAULT_FPS,
  undoStack: { frameIndex: -1, states: [] },
  keyframes: new Set<number>(),
  isExporting: false,
};

const animationReducer = produce(
  (draft: AnimationState, action: AnimationAction) => {
    switch (action.type) {
      case "SET_FRAME_DATA": {
        draft.frames[action.frameIndex] = action.data;
        break;
      }

      case "SET_ACTIVE_FRAME": {
        const newFrame = action.frame;
        // Reset undo stack when changing frames
        draft.undoStack = {
          frameIndex: newFrame,
          states: draft.frames[newFrame] ? [draft.frames[newFrame]] : [],
        };
        draft.activeFrame = newFrame;
        break;
      }

      case "SAVE_DRAWING_STATE": {
        draft.frames[draft.activeFrame] = action.frameData;
        draft.undoStack.states.push(action.frameData);

        if (draft.undoStack.states.length > MAX_UNDO_STATES) {
          draft.undoStack.states.shift(); // Remove oldest state
        }
        break;
      }

      case "UNDO": {
        if (draft.undoStack.states.length === 0) {
          return;
        }

        draft.undoStack.states.pop();
        const previousState =
          draft.undoStack.states[draft.undoStack.states.length - 1] ?? "";
        draft.frames[draft.activeFrame] = previousState;
        break;
      }

      case "SET_PLAYING": {
        draft.isPlaying = action.isPlaying;
        break;
      }

      case "SET_PENDING_FRAME_COUNT": {
        draft.pendingFrameCount = action.count;
        break;
      }

      case "APPLY_FRAME_COUNT": {
        draft.isPlaying = false;
        draft.numFrames = draft.pendingFrameCount;

        if (draft.pendingFrameCount > draft.frames.length) {
          const extraFrames = Array(
            draft.pendingFrameCount - draft.frames.length
          ).fill("");
          draft.frames.push(...extraFrames);
        } else {
          draft.frames.length = draft.pendingFrameCount;
        }

        draft.activeFrame = Math.min(
          draft.activeFrame,
          draft.pendingFrameCount - 1
        );
        break;
      }

      case "SET_FPS": {
        draft.fps = action.fps;
        break;
      }

      case "TOGGLE_KEYFRAME": {
        const keyframesArray = Array.from(draft.keyframes);
        if (keyframesArray.includes(action.frame)) {
          draft.keyframes = new Set(
            keyframesArray.filter((frame) => frame !== action.frame)
          );
        } else {
          draft.keyframes = new Set([...keyframesArray, action.frame]);
        }
        break;
      }

      case "SET_EXPORTING": {
        draft.isExporting = action.isExporting;
        break;
      }
    }
  }
);

interface AnimationContextType extends Omit<AnimationState, "undoStack"> {
  canUndo: boolean;
  setFrames: (frames: string[]) => void;
  setActiveFrame: (frame: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setPendingFrameCount: (count: number) => void;
  handleNumFramesChange: () => void;
  setFps: (fps: number) => void;
  saveDrawingState: (frameData: string) => void;
  handleUndo: () => void;
  toggleKeyframe: (frame: number) => void;
  isExporting: boolean;
  exportAnimation: () => Promise<void>;
}

const AnimationContext = createContext<AnimationContextType | null>(null);

export function AnimationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(animationReducer, initialState);
  const animationFrameRef = useRef<number>();
  const lastFrameTime = useRef(0);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when not playing
      if (state.isPlaying) return;

      // Handle undo (Command/Ctrl + Z)
      if (
        (e.metaKey || e.ctrlKey) &&
        e.key.toLowerCase() === "z" &&
        !e.shiftKey
      ) {
        e.preventDefault();
        if (state.undoStack.states.length > 0) {
          dispatch({ type: "UNDO" });
        }
      }

      // Could add more shortcuts here:
      // - Space for play/pause
      // - Left/Right arrows for frame navigation
      // etc.
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.isPlaying, state.undoStack.states.length]);

  // Animation loop
  useEffect(() => {
    if (!state.isPlaying) {
      lastFrameTime.current = 0;
      return;
    }

    const frameDuration = 1000 / state.fps;

    const animate = (timestamp: number) => {
      if (
        !lastFrameTime.current ||
        timestamp - lastFrameTime.current >= frameDuration
      ) {
        dispatch({
          type: "SET_ACTIVE_FRAME",
          frame:
            state.activeFrame === state.frames.length - 1
              ? 0
              : state.activeFrame + 1,
        });
        lastFrameTime.current = timestamp;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [state.isPlaying, state.frames.length, state.fps, state.activeFrame]);

  const createCanvasFromSaveData = (
    saveData: string,
    width: number,
    height: number
  ): HTMLCanvasElement => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;

    try {
      const data = JSON.parse(saveData);
      ctx.fillStyle = data.backgroundColor || "#ffffff";
      ctx.fillRect(0, 0, width, height);

      data.lines.forEach((line: any) => {
        ctx.beginPath();
        ctx.strokeStyle = line.brushColor;
        ctx.lineWidth = line.brushRadius * 2;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";

        line.points.forEach((point: any, i: number) => {
          if (i === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });

        ctx.stroke();
      });
    } catch (e) {
      console.error("Error parsing save data:", e);
    }

    return canvas;
  };

  const exportAnimation = useCallback(async () => {
    if (state.isExporting) return;

    try {
      dispatch({ type: "SET_EXPORTING", isExporting: true });

      // Filter out empty frames
      const nonEmptyFrames = state.frames.filter((frame) => frame);
      if (nonEmptyFrames.length === 0) {
        throw new Error("No frames to export");
      }

      // Create canvases for each frame
      const width = 1000;
      const height = Math.round(width / (16 / 9));
      const frameCanvases = nonEmptyFrames.map((frame) =>
        createCanvasFromSaveData(frame, width, height)
      );

      // Initialize GIF encoder
      const gif = new GIF({
        workers: 2,
        quality: 10,
        width,
        height,
        workerScript: "/scripts/gif.worker.js",
      });

      // Add frames to GIF
      frameCanvases.forEach((canvas) => {
        gif.addFrame(canvas, { delay: 1000 / state.fps });
      });

      // Render and download GIF
      gif.on("finished", (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "animation.gif";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        dispatch({ type: "SET_EXPORTING", isExporting: false });
      });

      gif.render();
    } catch (error) {
      console.error("Error exporting animation:", error);
      dispatch({ type: "SET_EXPORTING", isExporting: false });
    }
  }, [state.frames, state.fps, state.isExporting]);

  const value: AnimationContextType = {
    ...state,
    canUndo: state.undoStack.states.length > 0,

    setFrames: useCallback((frames: string[]) => {
      frames.forEach((data, index) => {
        dispatch({ type: "SET_FRAME_DATA", frameIndex: index, data });
      });
    }, []),

    setActiveFrame: useCallback((frame: number) => {
      dispatch({ type: "SET_ACTIVE_FRAME", frame });
    }, []),

    setIsPlaying: useCallback((playing: boolean) => {
      dispatch({ type: "SET_PLAYING", isPlaying: playing });
    }, []),

    setPendingFrameCount: useCallback((count: number) => {
      dispatch({ type: "SET_PENDING_FRAME_COUNT", count });
    }, []),

    handleNumFramesChange: useCallback(() => {
      dispatch({ type: "APPLY_FRAME_COUNT" });
    }, []),

    setFps: useCallback((fps: number) => {
      dispatch({ type: "SET_FPS", fps });
    }, []),

    saveDrawingState: useCallback((frameData: string) => {
      dispatch({ type: "SAVE_DRAWING_STATE", frameData });
    }, []),

    handleUndo: useCallback(() => {
      dispatch({ type: "UNDO" });
    }, []),

    toggleKeyframe: useCallback((frame: number) => {
      dispatch({ type: "TOGGLE_KEYFRAME", frame });
    }, []),

    exportAnimation,
  };

  return (
    <AnimationContext.Provider value={value}>
      {children}
    </AnimationContext.Provider>
  );
}

export function useAnimation() {
  const context = useContext(AnimationContext);
  if (!context) {
    throw new Error("useAnimation must be used within an AnimationProvider");
  }
  return context;
}
