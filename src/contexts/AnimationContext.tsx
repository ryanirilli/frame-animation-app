import React, {
  createContext,
  useEffect,
  useContext,
  useReducer,
  useRef,
  useCallback,
} from "react";
import { produce } from "immer";

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
}

type AnimationAction =
  | { type: "SET_FRAME_DATA"; frameIndex: number; data: string }
  | { type: "SET_ACTIVE_FRAME"; frame: number }
  | { type: "SET_PLAYING"; isPlaying: boolean }
  | { type: "SET_PENDING_FRAME_COUNT"; count: number }
  | { type: "APPLY_FRAME_COUNT" }
  | { type: "SET_FPS"; fps: number }
  | { type: "SAVE_DRAWING_STATE"; frameData: string }
  | { type: "UNDO" };

const initialState: AnimationState = {
  frames: Array(DEFAULT_NUM_FRAMES).fill(""),
  activeFrame: 0,
  isPlaying: false,
  numFrames: DEFAULT_NUM_FRAMES,
  pendingFrameCount: DEFAULT_NUM_FRAMES,
  fps: DEFAULT_FPS,
  undoStack: { frameIndex: -1, states: [] },
};

const animationReducer = produce((draft: AnimationState, action: AnimationAction) => {
  switch (action.type) {
    case 'SET_FRAME_DATA': {
      draft.frames[action.frameIndex] = action.data;
      break;
    }

    case 'SET_ACTIVE_FRAME': {
      const newFrame = action.frame;
      // Reset undo stack when changing frames
      draft.undoStack = {
        frameIndex: newFrame,
        states: draft.frames[newFrame] ? [draft.frames[newFrame]] : []
      };
      draft.activeFrame = newFrame;
      break;
    }

    case 'SAVE_DRAWING_STATE': {
      draft.frames[draft.activeFrame] = action.frameData;
      draft.undoStack.states.push(action.frameData);
      
      if (draft.undoStack.states.length > MAX_UNDO_STATES) {
        draft.undoStack.states.shift(); // Remove oldest state
      }
      break;
    }

    case 'UNDO': {
      if (draft.undoStack.states.length === 0) {
        return;
      }
      
      draft.undoStack.states.pop();
      const previousState = draft.undoStack.states[draft.undoStack.states.length - 1] ?? "";
      draft.frames[draft.activeFrame] = previousState;
      break;
    }

    case 'SET_PLAYING': {
      draft.isPlaying = action.isPlaying;
      break;
    }

    case 'SET_PENDING_FRAME_COUNT': {
      draft.pendingFrameCount = action.count;
      break;
    }

    case 'APPLY_FRAME_COUNT': {
      draft.isPlaying = false;
      draft.numFrames = draft.pendingFrameCount;
      
      if (draft.pendingFrameCount > draft.frames.length) {
        const extraFrames = Array(draft.pendingFrameCount - draft.frames.length).fill("");
        draft.frames.push(...extraFrames);
      } else {
        draft.frames.length = draft.pendingFrameCount;
      }
      
      draft.activeFrame = Math.min(draft.activeFrame, draft.pendingFrameCount - 1);
      break;
    }

    case 'SET_FPS': {
      draft.fps = action.fps;
      break;
    }
  }
});

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
