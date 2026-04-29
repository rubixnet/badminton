"use client";

import React, { useEffect, useMemo, useRef, useState, useId } from "react";

// --- Core Math & Generators ---
const surfaceFn = (x: number) => Math.pow(1 - Math.pow(1 - x, 4), 0.25);

const calcRefractionProfile = (glassThickness: number, bezelWidth: number, ior: number, samples = 128) => {
  const eta = 1 / ior;
  const refract = (nx: number, ny: number) => {
    const dot = ny;
    const k = 1 - eta * eta * (1 - dot * dot);
    if (k < 0) return null;
    const sq = Math.sqrt(k);
    return [-(eta * dot + sq) * nx, eta - (eta * dot + sq) * ny];
  };

  const p = new Float64Array(samples);
  for (let i = 0; i < samples; i++) {
    const x = i / samples;
    const y = surfaceFn(x);
    const dx = x < 1 ? 0.0001 : -0.0001;
    const y2 = surfaceFn(x + dx);
    const deriv = (y2 - y) / dx;
    const mag = Math.sqrt(deriv * deriv + 1);
    const ref = refract(-deriv / mag, -1 / mag);
    p[i] = ref ? ref[0] * ((y * bezelWidth + glassThickness) / ref[1]) : 0;
  }
  return p;
};

const generateDisplacementMap = (w: number, h: number, radius: number, bezelWidth: number, profile: Float64Array, maxDisp: number) => {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) return "";
  const img = ctx.createImageData(w, h);
  const d = img.data;

  for (let i = 0; i < d.length; i += 4) { d[i] = 128; d[i + 1] = 128; d[i + 2] = 0; d[i + 3] = 255; }

  const rSq = radius * radius;
  const r1Sq = (radius + 1) ** 2;
  const rBSq = Math.max(radius - bezelWidth, 0) ** 2;
  const wB = w - radius * 2, hB = h - radius * 2;
  const S = profile.length;

  for (let y1 = 0; y1 < h; y1++) {
    for (let x1 = 0; x1 < w; x1++) {
      const x = x1 < radius ? x1 - radius : x1 >= w - radius ? x1 - radius - wB : 0;
      const y = y1 < radius ? y1 - radius : y1 >= h - radius ? y1 - radius - hB : 0;
      const dSq = x * x + y * y;
      if (dSq > r1Sq || dSq < rBSq) continue;

      const dist = Math.sqrt(dSq);
      const fromSide = radius - dist;
      const op = dSq < rSq ? 1 : 1 - (dist - Math.sqrt(rSq)) / (Math.sqrt(r1Sq) - Math.sqrt(rSq));
      if (op <= 0 || dist === 0) continue;

      const cos = x / dist, sin = y / dist;
      const bi = Math.min(((fromSide / bezelWidth) * S) | 0, S - 1);
      const disp = profile[bi] || 0;
      const dX = (-cos * disp) / maxDisp, dY = (-sin * disp) / maxDisp;

      const idx = (y1 * w + x1) * 4;
      d[idx] = (128 + dX * 127 * op + 0.5) | 0;
      d[idx + 1] = (128 + dY * 127 * op + 0.5) | 0;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL();
};

const generateSpecularMap = (w: number, h: number, radius: number, bezelWidth: number, balanced: boolean) => {
  const angle = Math.PI / 3;
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) return "";

  const img = ctx.createImageData(w, h);
  const d = img.data;
  d.fill(0);

  const rSq = radius * radius;
  const r1Sq = (radius + 1) ** 2;
  const rBSq = Math.max(radius - bezelWidth, 0) ** 2;
  const wB = w - radius * 2, hB = h - radius * 2;
  const sv = [Math.cos(angle), Math.sin(angle)];

  for (let y1 = 0; y1 < h; y1++) {
    for (let x1 = 0; x1 < w; x1++) {
      const x = x1 < radius ? x1 - radius : x1 >= w - radius ? x1 - radius - wB : 0;
      const y = y1 < radius ? y1 - radius : y1 >= h - radius ? y1 - radius - hB : 0;
      const dSq = x * x + y * y;
      if (dSq > r1Sq || dSq < rBSq) continue;

      const dist = Math.sqrt(dSq);
      const fromSide = radius - dist;
      const op = dSq < rSq ? 1 : 1 - (dist - Math.sqrt(rSq)) / (Math.sqrt(r1Sq) - Math.sqrt(rSq));
      if (op <= 0 || dist === 0) continue;

      const cos = x / dist, sin = -y / dist;
      const dot = balanced ? 1 : Math.abs(cos * sv[0] + sin * sv[1]);
      const edge = Math.sqrt(Math.max(0, 1 - (1 - fromSide) ** 2));
      const coeff = dot * edge;
      const col = (255 * coeff) | 0;
      const alpha = (col * coeff * op) | 0;

      const idx = (y1 * w + x1) * 4;
      d[idx] = col; d[idx + 1] = col; d[idx + 2] = col; d[idx + 3] = alpha;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL();
};

interface LiquidGlassLayerProps {
  borderRadius?: number;
  glassThickness?: number;
  bezelWidth?: number;
  ior?: number;
  scaleRatio?: number;
  blur?: number;
  specularOpacity?: number;
  specularSat?: number;
  tintColor?: string;
  tintOpacity?: number;
  innerShadow?: string;
  innerShadowBlur?: number;
  innerShadowSpread?: number;
  balancedSpecular?: boolean;
}

export function LiquidGlassLayer({
  borderRadius = 36,
  glassThickness = 30,
  bezelWidth = 40,
  ior = 1.4,
  scaleRatio = 1.0,
  blur = 4,
  specularOpacity = 0.5,
  specularSat = 1, // Increased saturation for better "sheen"
  tintColor = "255,255,255",
  tintOpacity = 0.05,
  innerShadow = "rgba(255,255,255,0.15)",
  innerShadowBlur = 12,
  innerShadowSpread = 0,
  balancedSpecular = true,
}: LiquidGlassLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dim, setDim] = useState({ w: 0, h: 0 });
  const uniqueId = useId().replace(/:/g, "");
  const filterId = `lg-filter-${uniqueId}`;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      // Optimization: Only update if change is significant
      setDim(prev => (
        Math.abs(prev.w - rect.width) > 1 || Math.abs(prev.h - rect.height) > 1
          ? { w: Math.round(rect.width), h: Math.round(rect.height) }
          : prev
      ));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const maps = useMemo(() => {
    const { w, h } = dim;
    if (w < 10 || h < 10) {
      return { dispUrl: "", specUrl: "", maxDisp: 1 };
    }

    const actualRadius = Math.max(2, Math.min(borderRadius, w / 2, h / 2));
    const bezel = Math.min(bezelWidth, actualRadius - 1, Math.min(w, h) / 2 - 1);
    const profile = calcRefractionProfile(glassThickness, bezel, ior, 128);
    const maxDisp = Math.max(...Array.from(profile).map(Math.abs)) || 1;

    const dispUrl = generateDisplacementMap(w, h, actualRadius, bezel, profile, maxDisp);
    const specUrl = generateSpecularMap(w, h, actualRadius, bezel * 2.5, balancedSpecular);

    return { dispUrl, specUrl, maxDisp };
  }, [dim, borderRadius, glassThickness, bezelWidth, ior, balancedSpecular]);

  const scale = maps.maxDisp * scaleRatio;

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-none -z-10">
      {maps.dispUrl && (
        <svg className="absolute w-0 h-0 invisible">
          <defs>
            <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
              {/* Step 1: Blur the background */}
              <feGaussianBlur in="SourceGraphic" stdDeviation={blur} result="blurred" />

              {/* Step 2: Apply Refraction Map */}
              <feImage href={maps.dispUrl} x="0" y="0" width={dim.w} height={dim.h} result="disp_map" />
              <feDisplacementMap in="blurred" in2="disp_map" scale={scale} xChannelSelector="R" yChannelSelector="G" result="displaced" />

              {/* Step 3: Add Specular Highlights (The "Glass" look) */}
              <feImage href={maps.specUrl} x="0" y="0" width={dim.w} height={dim.h} result="spec_layer" />
              <feComponentTransfer in="spec_layer" result="spec_faded">
                <feFuncA type="linear" slope={specularOpacity} />
              </feComponentTransfer>

              {/* Composite everything */}
              <feMerge>
                <feMergeNode in="displaced" />
                <feMergeNode in="spec_faded" />
              </feMerge>
            </filter>
          </defs>
        </svg>
      )}

      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          borderRadius,
          backdropFilter: maps.dispUrl ? `url(#${filterId})` : "blur(10px)",
          WebkitBackdropFilter: maps.dispUrl ? `url(#${filterId})` : "blur(10px)",
          backgroundColor: `rgba(${tintColor},${tintOpacity})`,
          boxShadow: `${innerShadow} 0px 0px ${innerShadowBlur}px ${innerShadowSpread}px inset, 0 8px 32px -8px rgba(0,0,0,0.3)`,
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      />
    </div>
  );
}
