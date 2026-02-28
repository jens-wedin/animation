export function laserDomeSketch(p, params) {
  let t = 0;
  const SEGS = 48; // curve smoothness

  // ── 3-D helpers ────────────────────────────────────────────────────────────

  function rotX([x, y, z], a) {
    return [x, y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)];
  }
  function rotY([x, y, z], a) {
    return [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)];
  }
  // Perspective project; returns null when behind camera
  function proj([x, y, z], D, cx, cy) {
    const w = D + z;
    if (w < 0.01) return null;
    return [cx + (x * D) / w, cy - (y * D) / w];
  }

  // ── Glow draw ──────────────────────────────────────────────────────────────
  // Calls drawFn three times with widening/fading strokes for a laser bloom
  function glow(hue, glowMult, drawFn) {
    p.stroke(hue, 100, 100,  7); p.strokeWeight(9 * glowMult); drawFn();
    p.stroke(hue,  90, 100, 22); p.strokeWeight(3 * glowMult); drawFn();
    p.stroke(hue,  75, 100, 100); p.strokeWeight(0.8);          drawFn();
  }

  p.setup = () => {
    const px = Math.max(1, params.pixelation);
    p.createCanvas(Math.floor(p.windowWidth / px), Math.floor(p.windowHeight / px));
    p.colorMode(p.HSB, 360, 100, 100, 100);
    p.frameRate(60);
    p.noFill();
  };

  p.draw = () => {
    if (params.paused) return;
    t += params.speed * 0.008;

    p.background(0, 0, 3);

    const cx    = p.width  / 2;
    const cy    = p.height / 2;
    const R     = Math.min(p.width, p.height) * 0.41;
    const D     = R * 2.2;       // perspective depth
    const TILT  = 0.44;          // ~25° — shows dome from slightly below
    const G     = params.laserGlow;
    const spin  = t * 0.35;

    // Transform pipeline: scale → tilt → spin → project
    function xform(x, y, z) {
      return proj(rotY(rotX([x * R, y * R, z * R], TILT), spin), D, cx, cy);
    }

    // ── Latitude rings (horizontal hoops) ────────────────────────────────────
    const RINGS = Math.max(1, Math.round(params.laserRings));
    for (let ri = 0; ri <= RINGS; ri++) {
      const theta = (ri / RINGS) * (Math.PI / 2); // 0 = apex, π/2 = equator
      const sinT  = Math.sin(theta);
      const cosT  = Math.cos(theta);
      const hue   = (params.hue + ri * 24) % 360;

      glow(hue, G, () => {
        p.beginShape();
        for (let si = 0; si <= SEGS; si++) {
          const phi = (si / SEGS) * Math.PI * 2;
          const pt  = xform(sinT * Math.cos(phi), cosT, sinT * Math.sin(phi));
          if (pt) p.vertex(pt[0], pt[1]);
        }
        p.endShape(p.CLOSE);
      });
    }

    // ── Meridian arcs (vertical ribs) ────────────────────────────────────────
    const MERIDIANS = Math.max(2, Math.round(params.laserBeams));
    for (let mi = 0; mi < MERIDIANS; mi++) {
      const phi = (mi / MERIDIANS) * Math.PI * 2;
      const hue = (params.hue + 180 + mi * (160 / MERIDIANS)) % 360;

      glow(hue, G, () => {
        p.beginShape();
        for (let si = 0; si <= SEGS / 2; si++) {
          const theta = (si / (SEGS / 2)) * (Math.PI / 2);
          const sinT  = Math.sin(theta);
          const cosT  = Math.cos(theta);
          const pt    = xform(sinT * Math.cos(phi), cosT, sinT * Math.sin(phi));
          if (pt) p.vertex(pt[0], pt[1]);
        }
        p.endShape();
      });
    }

    // ── Scanning beam — bright arc orbiting faster than the dome ─────────────
    const scanPhi = t * 2.6; // faster independent rotation
    const scanHue = (params.hue + 72) % 360;

    glow(scanHue, G * 2.2, () => {
      p.beginShape();
      for (let si = 0; si <= SEGS / 2; si++) {
        const theta = (si / (SEGS / 2)) * (Math.PI / 2);
        const sinT  = Math.sin(theta);
        const cosT  = Math.cos(theta);
        const pt    = xform(sinT * Math.cos(scanPhi), cosT, sinT * Math.sin(scanPhi));
        if (pt) p.vertex(pt[0], pt[1]);
      }
      p.endShape();
    });

    // ── Floor ring at equator — grounds the dome visually ────────────────────
    const floorHue = (params.hue + 200) % 360;
    glow(floorHue, G * 0.5, () => {
      p.beginShape();
      for (let si = 0; si <= SEGS; si++) {
        const phi = (si / SEGS) * Math.PI * 2;
        const pt  = xform(Math.cos(phi), 0, Math.sin(phi));
        if (pt) p.vertex(pt[0], pt[1]);
      }
      p.endShape(p.CLOSE);
    });
  };

  p.windowResized = () => {
    const px = Math.max(1, params.pixelation);
    p.resizeCanvas(Math.floor(p.windowWidth / px), Math.floor(p.windowHeight / px));
  };
}
