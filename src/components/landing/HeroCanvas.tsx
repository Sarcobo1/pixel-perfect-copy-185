import { useEffect, useRef } from "react";

export function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Try WebGL first, fall back to Canvas 2D if unavailable (e.g. no GPU)
    let cleanup: (() => void) | undefined;

    try {
      const THREE = await_webgl_safe_import();
      if (THREE) {
        cleanup = startWebGL(canvas, THREE);
      } else {
        cleanup = startCanvas2D(canvas);
      }
    } catch {
      cleanup = startCanvas2D(canvas);
    }

    return () => cleanup?.();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full"
      aria-hidden
    />
  );
}

function await_webgl_safe_import() {
  try {
    const testCanvas = document.createElement("canvas");
    const gl = testCanvas.getContext("webgl") || testCanvas.getContext("experimental-webgl");
    if (!gl) return null;
    return true;
  } catch {
    return null;
  }
}

function startWebGL(canvas: HTMLCanvasElement, _: unknown) {
  let renderer: import("three").WebGLRenderer | null = null;
  let raf = 0;

  import("three").then((THREE) => {
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 10;

      const mouse = { x: 0, y: 0 };
      const cubes: import("three").LineSegments[] = [];
      const COUNT = 22;

      for (let i = 0; i < COUNT; i++) {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const edges = new THREE.EdgesGeometry(geometry);
        const material = new THREE.LineBasicMaterial({ color: 0xa3e635, transparent: true, opacity: 0.35 });
        const cube = new THREE.LineSegments(edges, material);
        cube.position.set((Math.random() - 0.5) * 30, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 10);
        cube.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        (cube as any).userData = {
          drift: { x: (Math.random() - 0.5) * 0.005, y: (Math.random() - 0.5) * 0.005, z: (Math.random() - 0.5) * 0.005 },
          rot: { x: (Math.random() - 0.5) * 0.01, y: (Math.random() - 0.5) * 0.01, z: (Math.random() - 0.5) * 0.01 },
        };
        scene.add(cube);
        cubes.push(cube);
      }

      const onMove = (e: MouseEvent) => {
        mouse.x = e.clientX / window.innerWidth - 0.5;
        mouse.y = e.clientY / window.innerHeight - 0.5;
      };
      const onResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer?.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("resize", onResize);

      const animate = () => {
        raf = requestAnimationFrame(animate);
        for (const cube of cubes) {
          const ud = (cube as any).userData;
          cube.position.x += ud.drift.x + (mouse.x * 2 - cube.position.x * 0.01) * 0.01;
          cube.position.y += ud.drift.y + (-mouse.y * 2 - cube.position.y * 0.01) * 0.01;
          cube.position.z += ud.drift.z;
          cube.rotation.x += ud.rot.x;
          cube.rotation.y += ud.rot.y;
          cube.rotation.z += ud.rot.z;
          if (Math.abs(cube.position.x) > 20) cube.position.x *= -0.9;
          if (Math.abs(cube.position.y) > 15) cube.position.y *= -0.9;
        }
        renderer?.render(scene, camera);
      };
      animate();
    } catch {
      startCanvas2D(canvas);
    }
  }).catch(() => startCanvas2D(canvas));

  return () => {
    cancelAnimationFrame(raf);
    renderer?.dispose();
  };
}

function startCanvas2D(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  let W = 0, H = 0;
  let raf = 0;

  const resize = () => {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  };
  window.addEventListener("resize", resize);
  resize();

  const ACCENT = "#a3e635";
  const COUNT = 22;

  type Cube2D = {
    x: number; y: number; size: number;
    rx: number; ry: number; rz: number;
    drx: number; dry: number; drz: number;
    dx: number; dy: number;
    alpha: number;
  };

  const cubes: Cube2D[] = Array.from({ length: COUNT }, () => ({
    x: Math.random() * 1,
    y: Math.random() * 1,
    size: 20 + Math.random() * 60,
    rx: Math.random() * Math.PI * 2,
    ry: Math.random() * Math.PI * 2,
    rz: Math.random() * Math.PI * 2,
    drx: (Math.random() - 0.5) * 0.012,
    dry: (Math.random() - 0.5) * 0.012,
    drz: (Math.random() - 0.5) * 0.008,
    dx: (Math.random() - 0.5) * 0.0004,
    dy: (Math.random() - 0.5) * 0.0004,
    alpha: 0.1 + Math.random() * 0.3,
  }));

  function project(x: number, y: number, z: number, fov: number): [number, number, number] {
    const scale = fov / (fov + z);
    return [x * scale, y * scale, scale];
  }

  function drawWireCube(cx: number, cy: number, size: number, rx: number, ry: number, rz: number, alpha: number) {
    const s = size / 2;
    const verts: [number, number, number][] = [
      [-s, -s, -s], [s, -s, -s], [s, s, -s], [-s, s, -s],
      [-s, -s, s], [s, -s, s], [s, s, s], [-s, s, s],
    ];

    const cosX = Math.cos(rx), sinX = Math.sin(rx);
    const cosY = Math.cos(ry), sinY = Math.sin(ry);
    const cosZ = Math.cos(rz), sinZ = Math.sin(rz);

    const rotated = verts.map(([x, y, z]) => {
      let nx = x, ny = y, nz = z;
      [ny, nz] = [ny * cosX - nz * sinX, ny * sinX + nz * cosX];
      [nx, nz] = [nx * cosY + nz * sinY, -nx * sinY + nz * cosY];
      [nx, ny] = [nx * cosZ - ny * sinZ, nx * sinZ + ny * cosZ];
      return [nx, ny, nz] as [number, number, number];
    });

    const FOV = 400;
    const proj = rotated.map(([x, y, z]) => {
      const [px, py] = project(x, y, z + FOV, FOV);
      return [cx + px, cy + py] as [number, number];
    });

    const edges = [
      [0,1],[1,2],[2,3],[3,0],
      [4,5],[5,6],[6,7],[7,4],
      [0,4],[1,5],[2,6],[3,7],
    ];

    ctx!.save();
    ctx!.strokeStyle = ACCENT;
    ctx!.globalAlpha = alpha;
    ctx!.lineWidth = 0.8;
    ctx!.beginPath();
    for (const [a, b] of edges) {
      ctx!.moveTo(proj[a][0], proj[a][1]);
      ctx!.lineTo(proj[b][0], proj[b][1]);
    }
    ctx!.stroke();
    ctx!.restore();
  }

  const animate = () => {
    raf = requestAnimationFrame(animate);
    ctx.clearRect(0, 0, W, H);

    for (const c of cubes) {
      c.x += c.dx; c.y += c.dy;
      c.rx += c.drx; c.ry += c.dry; c.rz += c.drz;
      if (c.x < 0) c.x = 1; if (c.x > 1) c.x = 0;
      if (c.y < 0) c.y = 1; if (c.y > 1) c.y = 0;
      drawWireCube(c.x * W, c.y * H, c.size, c.rx, c.ry, c.rz, c.alpha);
    }
  };

  animate();

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
  };
}
