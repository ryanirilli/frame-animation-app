"use client";
import Canvas from "@/components/Canvas";
import Timeline from "@/components/Timeline";
import { FrameCountInput } from "@/components/FrameCountInput";
import { AnimationProvider } from "@/contexts/AnimationContext";
import { FrameRateControl } from "@/components/FrameRateControl";
import { PlaybackControls } from "@/components/PlaybackControls";

export default function Home() {
  return (
    <AnimationProvider>
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-6">
          <Canvas />
          <div className="flex items-center gap-4 justify-between w-full max-w-[1000px]">
            <FrameCountInput />
            <PlaybackControls />
            <FrameRateControl />
          </div>
          <Timeline />
        </div>
      </div>
    </AnimationProvider>
  );
}
