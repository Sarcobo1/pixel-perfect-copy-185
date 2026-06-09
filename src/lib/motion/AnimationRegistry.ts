export type AnimationType = "headline" | "transition";

export interface AnimationEntry {
  type: AnimationType;
  description: string;
  jsCode?: string;
}

class AnimationRegistryClass {
  private entries = new Map<string, AnimationEntry>();

  constructor() {
    const headlines: [string, string][] = [
      ["slam_drop", "Words drop from top with bounce and blur"],
      ["waterfall", "Words slide in from right with skew"],
      ["kinetic_scale", "Words scale down from 5x with blur"],
      ["glitch_reveal", "Words reveal with clip-path and glitch jitter"],
      ["clip_wipe", "Words wipe up from bottom with clip-path"],
      ["tracking_stretch", "Letter-spacing collapses in from wide"],
      ["scale_bounce", "Words pop in with scale bounce"],
      ["char_shatter", "Characters fly from random 3D positions"],
      ["blur_slide", "Words slide from left with blur"],
      ["matte_reveal", "Words rise from bottom with rotation"],
      ["flicker_glitch", "Words flicker in with glitch distortion"],
      ["typewriter", "Classic typewriter character reveal"],
      ["elastic_pop", "Words pop in with elastic overshoot"],
      ["perspective_fly", "Words fly in from deep z-space"],
      ["wave_text", "Words wave in from center-out"],
      ["3d_flip", "Words flip in on X axis"],
      ["scramble_text", "Characters scramble then resolve to final text"],
      ["kinetic_smash", "Words smash in from extreme scale"],
      ["fluid_vector", "Smooth vectorial slide with blur"],
      ["isometric_float", "Words float in from isometric angle"],
    ];
    for (const [name, description] of headlines) {
      this.entries.set(name, { type: "headline", description });
    }

    const transitions: [string, string][] = [
      ["fade", "Simple opacity crossfade"],
      ["slide_up", "New scene slides up from bottom"],
      ["scale_punch", "Scene punches in with scale and blur"],
      ["blur_dissolve", "Cross-blur dissolve between scenes"],
      ["clip_wipe", "Diagonal clip-path wipe transition"],
      ["wipe_right", "Horizontal wipe to the right"],
      ["wipe_left", "Horizontal wipe to the left"],
      ["depth_push", "Camera push through depth"],
      ["zoom_blur", "Zoom with radial blur"],
      ["chromatic_split", "RGB channel split effect"],
      ["slide_down", "Scene slides down off screen"],
      ["scale_out", "Scene scales out to nothing"],
      ["rotate_out", "Scene rotates out"],
      ["glitch_slice", "Glitch horizontal slices transition"],
      ["echo_trail", "Echo/smear frame effect"],
      ["temporal_flow", "Cinematic depth camera flow"],
      ["hand_drawn_wipe", "Organic brush-stroke wipe"],
    ];
    for (const [name, description] of transitions) {
      this.entries.set(name, { type: "transition", description });
    }
  }

  register(name: string, entry: AnimationEntry): void {
    this.entries.set(name, entry);
  }

  has(name: string): boolean {
    return this.entries.has(name);
  }

  getEntry(name: string): AnimationEntry | undefined {
    return this.entries.get(name);
  }

  getCode(name: string): string | undefined {
    return this.entries.get(name)?.jsCode;
  }

  getList(type?: AnimationType): Array<{ name: string; type: AnimationType; description: string }> {
    const result: Array<{ name: string; type: AnimationType; description: string }> = [];
    for (const [name, entry] of this.entries) {
      if (!type || entry.type === type) {
        result.push({ name, type: entry.type, description: entry.description });
      }
    }
    return result;
  }

  registerFromCode(name: string, type: AnimationType, jsCode: string, description = ""): void {
    this.entries.set(name, {
      type,
      description: description || `Dynamic: ${name}`,
      jsCode,
    });
    console.log(`[AnimationRegistry] registered dynamic animation: ${name} (${type})`);
  }

  findUnknown(names: string[]): string[] {
    return names.filter((n) => n && n !== "none" && !this.has(n));
  }
}

export const AnimationRegistry = new AnimationRegistryClass();
