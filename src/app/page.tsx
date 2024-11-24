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
      <div className="flex flex-col items-center p-4">
        <Canvas />
        <div className="flex items-center gap-4 justify-between w-full max-w-[1000px] py-4">
          <FrameCountInput />
          <PlaybackControls />
          <FrameRateControl />
        </div>
        <Timeline />
      </div>
    </AnimationProvider>
  );
}
