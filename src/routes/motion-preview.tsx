import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { MotionPlayer } from "@/lib/motion/MotionPlayer";
import type { MotionVideoSchema } from "@/lib/motion/schema";

export const Route = createFileRoute("/motion-preview")({
  component: MotionPreviewPage,
});

function MotionPreviewPage() {
  const initialized = useRef(false);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === "PLAY_MOTION_SCHEMA") {
        if (initialized.current) return;
        initialized.current = true;
        const schema = e.data.schema as MotionVideoSchema;
        const player = new MotionPlayer(schema, document.body);
        player.build().then(() => {
          player.play();
          window.parent.postMessage({ type: "FLOVO_MOTION_READY" }, "*");
        });
      }
    };
    window.addEventListener("message", handleMessage);
    window.parent.postMessage({ type: "FLOVO_MOTION_PREVIEW_MOUNTED" }, "*");
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}
