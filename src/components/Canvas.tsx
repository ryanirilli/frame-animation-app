/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
"use client";

import React, { useRef, useEffect, useState } from "react";
import CanvasDraw from "react-canvas-draw";
import { useAnimation } from "@/contexts/AnimationContext";

type TOverlayFrame = {
  index: number;
  data: string;
  opacity: string;
}

const defaultCanvasProps = {
  brushRadius: 2,
  lazyRadius: 0,
};

const Canvas: React.FC = () => {
  const canvasRef = useRef<CanvasDraw | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { activeFrame, frames, isPlaying, saveDrawingState, keyframes } = useAnimation();

  // Canvas dimensions maintaining 16:9 ratio
  const maxWidth = 1000;
  const aspectRatio = 16 / 9;
  const height = maxWidth / aspectRatio;

  // Load the active frame data when switching frames
  useEffect(() => {
    const loadFrame = async () => {
      if (!canvasRef.current) return;

      setIsLoading(true);
      if (frames[activeFrame]) {
        canvasRef.current.loadSaveData(frames[activeFrame], true);
      } else {
        canvasRef.current.clear();
      }
      // Wait for next tick to ensure the loading is complete
      await new Promise((resolve) => setTimeout(resolve, 0));
      setIsLoading(false);
    };

    loadFrame();
  }, [activeFrame, frames]);

  useEffect(() => {
    // @ts-ignore
    const container = canvasRef.current?.canvas?.drawing?.parentElement;
    if (!container) {
      return;
    }

    const handleMouseUp = () => {
      if (canvasRef.current && !isLoading) {
        console.log("handleMouseUp called");
        requestAnimationFrame(() => {
          console.log("requestAnimationFrame callback");
          const frameData = canvasRef.current?.getSaveData();
          if (frameData) {
            console.log("About to call saveDrawingState");
            saveDrawingState(frameData);
          }
        });
      }
    };

    container.addEventListener("mouseup", handleMouseUp);

    return () => {
      container.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isLoading, saveDrawingState]);

  const getOverlayFrames = () => {
    const overlays: Array<TOverlayFrame> = [];

    if (isPlaying) {
      return overlays;
    }

    // Add previous frame overlays
    for (let i = 2; i >= 1; i--) {
      const prevIndex = activeFrame - i;
      if (frames[prevIndex] && !keyframes.has(prevIndex)) {
        overlays.push({
          index: prevIndex,
          data: frames[prevIndex],
          opacity: (1 / (i + 2)).toFixed(2),
        });
      }
    }

    // Add keyframe overlays
    Array.from(keyframes).forEach(frameIndex => {
      if (frameIndex !== activeFrame && frames[frameIndex]) {
        overlays.push({
          index: frameIndex,
          data: modifySaveDataColor(frames[frameIndex], "#FF0000"), // Convert to red
          opacity: "0.5",
        });
      }
    });

    return overlays;
  };

  const modifySaveDataColor = (saveData: string, color: string) => {
    try {
      const data = JSON.parse(saveData);
      const modifiedData = {
        ...data,
        lines: data.lines.map((line: any) => ({
          ...line,
          brushColor: color
        }))
      };
      return JSON.stringify(modifiedData);
    } catch (e) {
      console.error('Error modifying save data color:', e);
      return saveData;
    }
  };

  return (
    <div className="relative" style={{ width: maxWidth, height }}>
      {/* Overlays */}
      {getOverlayFrames().map(({ index, data, opacity, color }) => (
        <div
          key={index}
          className="absolute inset-0 pointer-events-none z-50"
          style={{ opacity }}
        >
          <CanvasDraw
            {...defaultCanvasProps}
            disabled
            saveData={data}
            immediateLoading={true}
            canvasWidth={maxWidth}
            canvasHeight={height}
            hideGrid
            hideInterface
            backgroundColor="transparent"
          />
        </div>
      ))}

      {/* Active canvas */}
      <CanvasDraw
        {...defaultCanvasProps}
        ref={canvasRef}
        canvasWidth={maxWidth}
        canvasHeight={height}
        className="border border-gray-300 rounded relative z-10"
      />
    </div>
  );
};

export default Canvas;
