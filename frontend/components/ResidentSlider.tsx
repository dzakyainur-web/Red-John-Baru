"use client";

/* UI by @Lattice_Node — ludion.ai/p/slider-resident (MIT) */
// Adapted as a fully typed React Component for Red John Cyber Quiz

import React, { useEffect, useRef } from "react";
import "./ResidentSlider.css";

const CORE_W = 240;
const CORE_H = 72;
const MARGIN = 12;
const WORLD_HZ = 30;
const WORLD_SLACK = 0.004;
const BPM = 108;
const PILL_RATIO = 3.2;

// Room coordinates
const WALL_X = 206;
const LAMP_X = 146;
const LAMP_Y = 21;
const SOFA_X = 122;
const DANCE_X = 174;
const TIDY_X = 176;
const FLOOR_Y = 58;
const SPK_X = 45;
const SPK_Y = 42;
const FRAME_X = 163;
const FRAME_Y = 10;
const FRAME_W = 20;
const FRAME_H = 16;
const BALL_X = 186;

// Palette: Hues x 8 brightness tones
const TONES = [0.17, 0.25, 0.34, 0.44, 0.55, 0.67, 0.79, 0.91];
const NT = TONES.length;
const RAMPS: [string, number, number][] = [
  ["fg", 0, 1],
  ["muted", 0, 1],
  ["accent", 0, 0.3],
  ["surface", 0, 1],
  ["accent", 0, 1.05],
  ["surface", 82, 0.95],
  ["bg", 0, 1],
  ["accent", -72, 1.05],
  ["accent", 148, 1],
  ["accent", -72, 0.6],
  ["accent", 148, 0.56],
  ["accent", 0, 0.62],
  ["surface", 0, 0.46],
];
const RK = 0,
  RU = 1,
  RW = 2,
  RS = 3,
  RA = 4,
  RG = 5,
  RC = 6,
  RP = 7,
  RT = 8,
  LP = 9,
  LT = 10,
  LA = 11,
  RN = 12;

type MatDefinition = [string, number, number, number?, number?];
const MATS: MatDefinition[] = [
  ["NONE", RK, 0, 1, 0],
  ["SLAB", RK, 0, 1, 0],
  ["SLAB_LT", RK, 1, 1, 0],
  ["CUT", RK, 2, 1, 0],
  ["BRICK", RS, 1, 1, 0],
  ["BRICK_LT", RS, 2, 1, 0],
  ["WALL", RW, 6],
  ["WALL_D", RW, 5],
  ["WALL_HI", RW, 7],
  ["FRAME_SH", RW, 3],
  ["TRIM", RC, 6],
  ["TRIM_D", RC, 4],
  ["FLOOR", RS, 4],
  ["FLOOR_D", RS, 3],
  ["FLOOR_LT", RS, 5],
  ["RUG", RP, 4],
  ["RUG_D", RP, 3],
  ["RUG_LT", RC, 5],
  ["WOOD", RS, 3],
  ["WOOD_D", RS, 2],
  ["WOOD_DD", RS, 1],
  ["WOOD_LT", RS, 4],
  ["WOOD_HI", RS, 5],
  ["BAFFLE", RK, 1],
  ["CONE", RK, 2],
  ["CONE_D", RK, 0],
  ["CONE_HI", RK, 4],
  ["CAP", RU, 5],
  ["RING", RU, 3],
  ["METAL", RU, 4],
  ["METAL_HI", RC, 5],
  ["LED_OFF", RK, 2, 1, 0],
  ["LED_G", RG, 7, 1, 0.5],
  ["LED_A", RA, 6, 1, 0.6],
  ["LED_R", RP, 6, 1, 0.7],
  ["BK_S", RS, 5],
  ["BK_U", RU, 5],
  ["BK_A", RA, 5],
  ["BK_G", RG, 4],
  ["BK_P", RP, 4],
  ["BK_T", RT, 4],
  ["BK_C", RC, 6],
  ["BK_K", RK, 4],
  ["BK_D", RK, 2],
  ["BK_HI", RC, 7],
  ["SKY0", RK, 0, 1, 0],
  ["SKY1", RK, 0, 1, 0],
  ["SKY2", RK, 1, 1, 0.03],
  ["MOON", RC, 7, 1, 0.6],
  ["MOON_D", RC, 5, 1, 0.35],
  ["STAR", RC, 6, 1, 0.3],
  ["STAR_D", RU, 5, 1, 0.1],
  ["BLD", RK, 1, 1, 0],
  ["BLD_F", RK, 2, 1, 0],
  ["BLD_W", RA, 6, 1, 0.3],
  ["CURTAIN", RU, 5],
  ["CURTAIN_D", RU, 3],
  ["CURTAIN_HI", RU, 6],
  ["SOFA", RU, 4],
  ["SOFA_D", RU, 3],
  ["SOFA_HI", RU, 5],
  ["PILLOW", RP, 5],
  ["PILLOW_D", RP, 4],
  ["BLANKET", RA, 5],
  ["BLANKET_D", RA, 4],
  ["BLANKET_HI", RC, 6],
  ["POLE", RK, 3],
  ["POLE_HI", RU, 5],
  ["SHADE", RW, 5],
  ["SHADE_D", RW, 4],
  ["SHADE_ON", RA, 6, 1, 0.85],
  ["SHADE_HOT", RA, 7, 1, 1.15],
  ["SHADE_RIM", RA, 5, 1, 0.55],
  ["BULB", RC, 7, 1, 1.3],
  ["BALL", RC, 4],
  ["BALL_D", RU, 3],
  ["BALL_HI", RC, 7, 1, 1.1],
  ["WIRE", RK, 2],
  ["DOT_P", RP, 7, 1, 0.34],
  ["DOT_T", RT, 7, 1, 0.34],
  ["DOT_A", RA, 7, 1, 0.34],
  ["DOT_C", RC, 7, 1, 0.34],
  ["WAVE_HI", RA, 7, 1, 0.95],
  ["WAVE", RA, 6, 1, 0.7],
  ["WAVE_D", RA, 4, 1, 0.34],
  ["LEAF", RG, 5],
  ["LEAF_D", RG, 3],
  ["LEAF_HI", RG, 6],
  ["STEM", RG, 4],
  ["POT", RC, 5],
  ["POT_HI", RC, 6],
  ["POT_D", RC, 3],
  ["SOIL", RK, 1],
  ["ART_FR", RS, 2],
  ["ART_FR_HI", RS, 5],
  ["ART_MAT", RC, 6],
  ["ART_SKY", RP, 6],
  ["ART_SKY2", RA, 6],
  ["ART_SUN", RC, 7],
  ["ART_M1", RU, 4],
  ["ART_M2", RU, 2],
  ["ART_SEA", RT, 4],
  ["HAIR", RK, 2],
  ["HAIR_HI", RK, 4],
  ["SKIN", RN, 6],
  ["SKIN_D", RN, 5],
  ["EYE", RK, 0],
  ["CHEEK", RA, 6],
  ["MOUTH", RA, 3],
  ["SHIRT", RC, 6],
  ["SHIRT_D", RC, 4],
  ["STRIPE", RA, 5],
  ["PANTS", RU, 3],
  ["PANTS_D", RU, 2],
  ["SHOE", RC, 7],
  ["MOON_SKIN", RU, 5, 1, 0],
  ["MOON_SKIN_D", RU, 3, 1, 0],
  ["MOON_HAIR", RK, 1, 1, 0],
  ["MOON_EYE", RK, 0, 1, 0],
  ["OUTLINE", RK, 0, 1, 0],
  ["PHONE", RA, 5],
  ["PHONE_D", RK, 3],
  ["NB_HAIR", RK, 3],
  ["NB_SKIN", RN, 5],
  ["NB_SKIN_D", RN, 4],
  ["NB_SHIRT", RT, 4],
  ["NB_SHIRT_D", RT, 3],
  ["NB_STRIPE", RT, 5],
  ["NB_PANTS", RK, 3],
  ["NB_PANTS_D", RK, 2],
  ["NB_SHOE", RU, 5],
  ["NB_WALL", RU, 4],
  ["NB_WALL_D", RU, 3],
  ["NB_TRIM", RC, 4],
  ["NB_FLOOR", RS, 3],
  ["NB_BED", RT, 3],
  ["NB_BED_HI", RT, 4],
  ["NB_SHEET", RC, 5],
  ["NB_LAMP", RC, 6, 1, 0.3],
  ["DON", RC, 7, 1, 0.5],
  ["BURST", RC, 7, 1, 0.6],
  ["DUST", RC, 5],
  ["SWEAT", RT, 6, 1, 0],
  ["ZEE", RU, 6, 1, 0.08],
  ["BUBBLE", RU, 6, 1, 0.06],
  ["MOTE", RA, 6, 1, 0],
];
const M: Record<string, number> = Object.fromEntries(
  MATS.map((row, i) => [row[0], i])
);
const CHAR_FROM = M.HAIR;
const CHAR_TO = M.NB_SHOE;

// Pixel Glyphs
const GLYPH_DO = [
  "..XX....X.X",
  "..XX...X.X.",
  "..XX.......",
  "..XXXX.....",
  "..XX.XXXX..",
  "..XX...XXX.",
  "..XX.....X.",
  "..XX.......",
  "..XX.......",
  "..XX.......",
  "..XX.......",
];
const GLYPH_N = [
  "...........",
  "XX.........",
  "XXXX.......",
  "..XX.....XX",
  "........XX.",
  ".......XX..",
  "......XX...",
  "....XXX....",
  "XXXXX......",
  "XXX........",
  "...........",
];
const GLYPH_MARK = ["XX", "XX", "XX", "XX", "..", "XX"];
const SPARKS = [
  [-2, -3],
  [-3, -1],
  [-3, 1],
  [-2, 3],
  [0, -4],
  [0, 4],
  [-5, 0],
];
const GLYPH_Z = ["XXXXX", "...X.", "..X..", ".X...", "XXXXX"];
const GLYPH_Z_SMALL = ["XXXX", "..X.", ".X..", "XXXX"];

const HEAD_ROWS = [
  "....HHHHH...",
  "..HHHhhHHH..",
  ".HHHhHHHHHH.",
  ".HHHHHHHSHHS",
  ".HHHHSSSSSSS",
  ".HHHSSSS1S1S",
  ".HHHSSSS2S2S",
  ".HHSSSSCSSSC",
  "..HSSSSSS3SS",
  "...SSSSSS4S.",
];

const cellsOf = (
  rows: string[],
  skip: string
): [number, number, string][] => {
  const list: [number, number, string][] = [];
  rows.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) {
      if (row[i] !== skip) list.push([i, j, row[i]]);
    }
  });
  return list;
};

const HEAD_CELLS = cellsOf(HEAD_ROWS, ".");
const SLEEP_FACE = cellsOf(
  [
    "...HHHHHH...",
    "..HHHHHHHH..",
    ".HHHHHHHHHH.",
    ".HHHSHHSHHH.",
    ".HSSSSSSSSH.",
    ".HEEESSEEEH.",
    ".HSSSSSSSSH.",
    ".HCSSSSSSCH.",
    "..SSSSMSSS..",
    "...SSSSSS...",
  ],
  "."
);
const G_DO = cellsOf(GLYPH_DO, ".");
const G_N = cellsOf(GLYPH_N, ".");
const G_MARK = cellsOf(GLYPH_MARK, ".");
const G_Z = cellsOf(GLYPH_Z, ".");
const G_Z_SMALL = cellsOf(GLYPH_Z_SMALL, ".");

const clamp = (v: number, lo = 0, hi = 1) =>
  Math.min(hi, Math.max(lo, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const bayerAt = (px: number, py: number) =>
  BAYER[((py & 3) << 2) | (px & 3)];

function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// OKLab calculations
const toLinear = (c: number) =>
  c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
const toGamma = (c: number) =>
  c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;

function rgbToOklab([r8, g8, b8]: [number, number, number]): [
  number,
  number,
  number
] {
  const r = toLinear(r8 / 255);
  const g = toLinear(g8 / 255);
  const b = toLinear(b8 / 255);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function oklabToLinear(L: number, a: number, b: number): [number, number, number] {
  const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
  const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
  const s = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3);
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

function labTone(lab: [number, number, number], L: number): [number, number, number] {
  let chroma = 1;
  for (let i = 0; i < 24; i++) {
    const rgb = oklabToLinear(L, lab[1] * chroma, lab[2] * chroma);
    if (rgb.every((v) => v >= -0.001 && v <= 1.001)) {
      return rgb.map((v) =>
        Math.round(toGamma(clamp(v)) * 255)
      ) as [number, number, number];
    }
    chroma *= 0.9;
  }
  return oklabToLinear(L, 0, 0).map((v) =>
    Math.round(toGamma(clamp(v)) * 255)
  ) as [number, number, number];
}

// GLSL Shaders
const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const SHAPE_GLSL = `
float rb(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
vec2 rbGrad(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  vec2 s = vec2(p.x < 0.0 ? -1.0 : 1.0, p.y < 0.0 ? -1.0 : 1.0);
  if (q.x > 0.0 && q.y > 0.0) return s * normalize(q);
  return q.x > q.y ? vec2(s.x, 0.0) : vec2(0.0, s.y);
}
float softBox(vec2 p, vec2 c, vec2 h, float s) {
  vec2 q = abs(p - c) - h;
  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
  return 1.0 - smoothstep(-s, s, d);
}
vec3 studio(vec3 R) {
  vec3 c = mix(uEnvLo, uEnvHi * 0.8, smoothstep(-0.75, 0.8, R.y));
  vec2 s = R.xy / (1.0 + max(R.z, 0.0));
  float key = softBox(s, vec2(-0.06, 0.6), vec2(0.72, 0.1), 0.045);
  float low = softBox(s, vec2(0.08, -0.7), vec2(0.82, 0.035), 0.05);
  float left = softBox(s, vec2(-0.82, 0.05), vec2(0.03, 0.42), 0.05);
  float right = softBox(s, vec2(0.84, 0.12), vec2(0.02, 0.3), 0.05);
  c += uEnvHi * (key * 0.95 + low * 0.14 + left * 0.2 + right * 0.1);
  return c;
}`;

const BAKE_FRAG = `#version 300 es
precision highp float;
uniform vec2 uRes, uPill;
uniform float uBezel, uCorner;
uniform vec3 uAlbedo, uEnvHi, uEnvLo, uInk;
layout(location = 0) out vec4 outBase;
layout(location = 1) out vec4 outWeight;
${SHAPE_GLSL}

float castShadow(vec2 p) {
  float h = uPill.y;
  float wide = rb(p + vec2(0.0, h * 0.2), uPill - vec2(h * 0.03), uCorner);
  float near = rb(p + vec2(0.0, h * 0.045), uPill, uCorner);
  float a = 0.2 * (1.0 - smoothstep(-h * 0.24, h * 0.36, wide)) + 0.2 * (1.0 - smoothstep(-h * 0.03, h * 0.09, near));
  vec2 toEdge = 0.5 * uRes - abs(p);
  float room = min(toEdge.x, toEdge.y) / (h * 0.22);
  return a * smoothstep(0.0, 1.0, clamp(room, 0.0, 1.0));
}

void main() {
  vec2 p = gl_FragCoord.xy - 0.5 * uRes;
  float d = rb(p, uPill, uCorner);
  float fallen = castShadow(p);
  vec3 base = uInk * fallen;
  float alpha = fallen;
  float glowWeight = 0.0;
  float worldWeight = 0.0;

  if (d < 1.0) {
    vec2 g = rbGrad(p, uPill, uCorner);
    float t = clamp(-d / uBezel, 0.0, 1.0);
    float a = 0.0;
    if (t < 0.52) a = pow(1.0 - t / 0.52, 1.7) * 0.97;
    else if (t > 0.8) a = -pow((t - 0.8) / 0.2, 1.25) * 0.78;
    vec3 N = normalize(vec3(g * a, sqrt(max(1.0 - a * a, 0.03))));
    vec3 R = vec3(2.0 * N.z * N.xy, 2.0 * N.z * N.z - 1.0);
    float diffuse = 0.72 + 0.28 * clamp(dot(N, normalize(vec3(-0.2, 0.72, 0.66))), 0.0, 1.0);
    float fresnel = 0.045 + 0.955 * pow(1.0 - N.z, 4.0);
    vec3 c = uAlbedo * diffuse;
    c = mix(c, studio(R), clamp(fresnel * 0.95 + 0.07, 0.0, 1.0));
    float plate = smoothstep(0.42, 0.56, t) * (1.0 - smoothstep(0.74, 0.84, t));
    vec2 band = vec2(p.x / max(uPill.x, 1.0), t);
    float glintTop = softBox(band, vec2(-0.34, 0.63), vec2(0.34, 0.05), 0.035) + 0.55 * softBox(band, vec2(0.42, 0.63), vec2(0.09, 0.045), 0.035);
    float glintLow = softBox(band, vec2(0.12, 0.65), vec2(0.5, 0.025), 0.02);
    float upper = smoothstep(-0.25, 0.25, p.y / uPill.y);
    c += uEnvHi * plate * (glintTop * upper * 0.2 + glintLow * (1.0 - upper) * 0.06);
    c *= 1.0 + plate * 0.022 * sin(p.x / max(uPill.x, 1.0) * 3.4 + 0.7);
    float inner = smoothstep(0.5, 1.0, t);
    float edgeDark = 1.0 - 0.3 * smoothstep(0.93, 1.0, t);
    vec3 faceColor = c * edgeDark;
    float faceGlow = (inner * inner * 1.25 + 0.2) * edgeDark;

    float dw = d + uBezel;
    float inWindow = 0.0;
    float keep = 0.0;
    vec3 over = vec3(0.0);
    if (dw < 1.0) {
      float win = uPill.y - uBezel;
      float ring = exp(max(dw, -win) / (win * 0.055));
      float dropped = rb(p - vec2(0.0, win * 0.05), uPill - vec2(uBezel), max(uCorner - uBezel, 1.0));
      float overhang = exp(min(dropped, 0.0) / (win * 0.1)) * smoothstep(-win * 0.2, win * 0.6, p.y);
      float ink = clamp(ring * 0.5 + overhang * 0.42, 0.0, 0.86);
      float sheen = smoothstep(win * 0.22, win * 1.02, p.y + p.x * 0.07);
      float sheenA = sheen * sheen * 0.13;
      float lowA = smoothstep(-win * 0.55, -win * 1.05, p.y - p.x * 0.05) * 0.03;
      keep = (1.0 - ink) * (1.0 - sheenA) * (1.0 - lowA);
      over = ((uInk * ink) * (1.0 - sheenA) + uEnvHi * sheenA) * (1.0 - lowA) + uEnvHi * lowA;
      inWindow = 1.0 - smoothstep(-0.8, 0.8, dw);
    }
    float cover = 1.0 - smoothstep(-0.8, 0.8, d);
    base = base * (1.0 - cover) + cover * (faceColor * (1.0 - inWindow) + over * inWindow);
    glowWeight = cover * (1.0 - inWindow) * faceGlow;
    worldWeight = cover * inWindow * keep;
    alpha = mix(alpha, 1.0, cover);
  }
  outBase = vec4(clamp(base, 0.0, 1.0), alpha);
  outWeight = vec4(glowWeight * 0.5, worldWeight, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
precision highp sampler2D;
uniform sampler2D uWorld, uGlow, uBase, uWeight;
uniform vec2 uRes, uPill, uOrigin, uWorldSize, uGlowSize, uShift;
uniform vec4 uLens;
uniform float uLensR, uK, uLift, uWobble, uTime;
uniform vec3 uAlbedo, uEnvHi, uEnvLo, uInk, uGround;
out vec4 outColor;
${SHAPE_GLSL}

vec3 glowAt(vec2 frag) {
  vec2 st = vec2(frag.x / uRes.x, 1.0 - frag.y / uRes.y) * uGlowSize - 0.5;
  vec2 i = floor(st);
  vec2 f = st - i;
  vec2 f2 = f * f;
  vec2 f3 = f2 * f;
  vec2 w0 = (1.0 - 3.0 * f + 3.0 * f2 - f3) / 6.0;
  vec2 w1 = (4.0 - 6.0 * f2 + 3.0 * f3) / 6.0;
  vec2 w2 = (1.0 + 3.0 * f + 3.0 * f2 - 3.0 * f3) / 6.0;
  vec2 w3 = f3 / 6.0;
  vec2 g0 = w0 + w1;
  vec2 g1 = w2 + w3;
  vec2 h0 = (i - 0.5 + w1 / g0 + 0.5) / uGlowSize;
  vec2 h1 = (i + 1.5 + w3 / g1 + 0.5) / uGlowSize;
  return g0.y * (g0.x * texture(uGlow, vec2(h0.x, h0.y)).rgb + g1.x * texture(uGlow, vec2(h1.x, h0.y)).rgb)
       + g1.y * (g0.x * texture(uGlow, vec2(h0.x, h1.y)).rgb + g1.x * texture(uGlow, vec2(h1.x, h1.y)).rgb);
}

vec3 tile(vec3 c, vec2 w, float scale) {
  if (scale < 5.0) return c;
  vec2 f = fract(w);
  vec2 g = min(f, 1.0 - f);
  float edge = min(g.x, g.y) * scale;
  float seam = 1.0 - 0.1 * (1.0 - smoothstep(0.0, max(1.2, scale * 0.07), edge));
  float grade = smoothstep(5.0, 10.0, scale);
  float bevel = 1.0 + grade * (0.05 * (0.5 - f.y) + 0.028 * (0.5 - f.x));
  return c * seam * bevel;
}

vec3 worldExact(vec2 frag) {
  vec2 w = vec2(frag.x - uOrigin.x, uOrigin.y - frag.y) / uK - uShift;
  ivec2 t = clamp(ivec2(floor(w)), ivec2(0), ivec2(uWorldSize) - 1);
  return tile(texelFetch(uWorld, t, 0).rgb, w, uK);
}

vec3 worldBent(vec2 frag, float scale, float foot) {
  vec2 w = vec2(frag.x - uOrigin.x, uOrigin.y - frag.y) / uK - uShift;
  if (foot > 1.0) return textureLod(uWorld, w / uWorldSize, log2(foot)).rgb;
  vec2 r = floor(w + 0.5);
  vec2 sharp = r - 0.5 + clamp((w - r) / max(foot, 1.0e-3) + 0.5, 0.0, 1.0);
  return tile(textureLod(uWorld, sharp / uWorldSize, 0.0).rgb, w, scale);
}

vec3 throughGlass(vec3 world, vec3 near) {
  return 1.0 - (1.0 - world) * (1.0 - clamp(near * 0.78, 0.0, 1.0));
}

vec3 sceneAt(vec2 frag, float scale, float foot, vec3 near, vec3 faceTint) {
  vec2 uv = frag / uRes;
  vec4 base = texture(uBase, uv);
  vec2 weight = texture(uWeight, uv).rg;
  vec3 c = base.rgb + uGround * (1.0 - base.a) + near * faceTint * weight.r * 2.0;
  if (weight.g > 0.0) c += throughGlass(worldBent(frag, scale, foot), near) * weight.g;
  return c;
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 p = frag - 0.5 * uRes;
  float h = uPill.y;
  vec3 faceTint = uAlbedo * 0.65 + 0.35;
  ivec2 at = ivec2(frag);
  vec4 base = texelFetch(uBase, at, 0);
  vec3 color = base.rgb;
  float alpha = base.a;

  vec2 lq = p - uLens.xy;
  if (uWobble > 0.001) {
    lq += uWobble * h * 0.012 * vec2(sin(lq.y / h * 7.0 + uTime * 11.0), sin(lq.x / h * 6.0 - uTime * 9.0));
  }
  vec2 he = uLens.zw;
  float lr = uLensR;
  float ld = rb(lq, he, lr);

  if (ld > -0.8) {
    vec2 weight = texelFetch(uWeight, at, 0).rg;
    if (weight.r + weight.g > 0.0) {
      vec3 near = glowAt(frag);
      color += near * faceTint * weight.r * 2.0;
      if (weight.g > 0.0) color += throughGlass(worldExact(frag), near) * weight.g;
    }

    float sd = rb(lq + vec2(0.0, h * (0.05 + 0.035 * uLift)), he, lr);
    float shA = (1.0 - smoothstep(-h * 0.14, h * (0.2 + 0.1 * uLift), sd)) * 0.36;
    color = uInk * shA + color * (1.0 - shA);
    alpha = shA + alpha * (1.0 - shA);
  }

  if (ld < 1.0) {
    vec2 gr = rbGrad(lq, he, lr);
    float span = min(he.x, he.y);
    float rim = 1.0 - clamp(-ld / span, 0.0, 1.0);
    vec2 center = 0.5 * uRes;

    float mag = 1.24 + 0.03 * uLift;
    float bt = clamp((rim - 0.64) / 0.36, 0.0, 1.0);
    float band = bt * bt * (3.0 - 2.0 * bt);
    float strength = 0.46;
    vec2 seenAt = uLens.xy + lq / mag;
    vec2 shift = gr * pow(band, 2.2) * span * strength;
    float slopeBand = 6.0 * bt * (1.0 - bt) / 0.36;
    float foot = (1.0 / mag + 2.2 * pow(max(band, 1.0e-3), 1.2) * slopeBand * strength) / uK;
    float scale = uK * mag;
    vec3 near = glowAt(center + seenAt + shift);
    vec3 seen;
    if (band > 0.02) {
      float ca = 0.075 * band;
      seen.r = sceneAt(center + seenAt + shift * (1.0 - ca), scale, foot, near, faceTint).r;
      seen.g = sceneAt(center + seenAt + shift, scale, foot, near, faceTint).g;
      seen.b = sceneAt(center + seenAt + shift * (1.0 + ca), scale, foot, near, faceTint).b;
    } else {
      seen = sceneAt(center + seenAt, scale, foot, near, faceTint);
    }

    float slope = 0.24 * rim + 0.76 * pow(rim, 6.0);
    vec2 tilt = gr * slope;
    vec3 N = normalize(vec3(tilt, sqrt(max(1.0 - dot(tilt, tilt), 0.02))));
    vec3 R = vec3(2.0 * N.z * N.xy, 2.0 * N.z * N.z - 1.0);
    vec2 lp = lq / he;

    vec3 lens = seen * 1.04;
    lens = mix(lens, uInk, pow(rim, 13.0) * 0.4);
    float pool = smoothstep(0.1, 0.96, -lp.y) * smoothstep(1.0, 0.84, rim) * smoothstep(0.38, 0.8, rim);
    lens += uEnvHi * pool * 0.22;
    float broad = softBox(lp + vec2(0.0, lp.x * lp.x * 0.16), vec2(-0.04, 0.68), vec2(0.6, 0.14), 0.2) * smoothstep(0.98, 0.76, rim);
    lens = mix(lens, uEnvHi, broad * 0.4);
    float fresnel = pow(1.0 - N.z, 3.0);
    float dirLight = 0.25 + 0.75 * smoothstep(-0.7, 0.85, dot(gr, normalize(vec2(-0.35, 0.94))));
    lens = mix(lens, studio(R), clamp(fresnel * dirLight * dirLight * 0.8, 0.0, 0.58));
    float lineW = max(1.1, h * 0.0052);
    float hair = 1.0 - smoothstep(0.0, lineW, abs(ld + lineW * 1.15));
    float arcA = pow(max(dot(gr, normalize(vec2(-0.5, 0.86))), 0.0), 2.4);
    float arcB = pow(max(dot(gr, normalize(vec2(0.58, -0.82))), 0.0), 3.4) * 0.42;
    lens = mix(lens, uEnvHi, hair * clamp(arcA + arcB, 0.0, 1.0) * 0.92);
    float rimGlow = smoothstep(0.5, 0.97, rim);
    if (rimGlow > 0.0) lens += glowAt(frag) * rimGlow * 0.55;

    float cover = 1.0 - smoothstep(-0.8, 0.8, ld);
    color = mix(color, lens, cover);
    alpha = mix(alpha, 1.0, cover);
  }

  float n = fract(sin(dot(frag, vec2(12.9898, 78.233))) * 43758.5453);
  n += fract(sin(dot(frag, vec2(93.989, 67.345))) * 24634.6345) - 1.0;
  color += (n * 0.75) / 255.0 * min(alpha * 4.0, 1.0);
  outColor = vec4(clamp(color, 0.0, 1.0), alpha);
}`;

export interface MountOptions {
  min?: number;
  max?: number;
  initialValue?: number;
  onValueChange?: (value: number) => void;
}

export interface ResidentSliderController {
  setValue: (val: number) => void;
  destroy: () => void;
}

export function mountResidentSlider(
  root: HTMLElement,
  options: MountOptions = {}
): ResidentSliderController {
  const minVal = options.min ?? 1;
  const maxVal = options.max ?? 100;
  const onValueChange = options.onValueChange;

  const cleanups: (() => void)[] = [];
  const on = (
    target: EventTarget,
    type: string,
    fn: EventListenerOrEventListenerObject,
    opts?: boolean | AddEventListenerOptions
  ) => {
    target.addEventListener(type, fn, opts);
    cleanups.push(() => target.removeEventListener(type, fn, opts));
  };

  const slot = root.querySelector(".scene-slot") as HTMLElement | null;
  const input = root.querySelector(".range") as HTMLInputElement | null;
  const shade = root.querySelector(".shade") as HTMLElement | null;
  const probe = root.querySelector(".probe") as HTMLElement | null;

  if (!input || !shade || !probe || !slot) {
    return {
      setValue: () => {},
      destroy: () => {},
    };
  }

  // Create canvas element inside slot
  let canvas = document.createElement("canvas");
  canvas.className = "scene";
  canvas.setAttribute("aria-hidden", "true");
  slot.appendChild(canvas);

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const schemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
  let calm = motionQuery.matches;

  const offscreen = (w: number, h: number) => {
    if (typeof OffscreenCanvas === "function") {
      return new OffscreenCanvas(w, h);
    }
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  };

  const paint = (
    offscreen(1, 1).getContext("2d", { willReadFrequently: true }) as
      | CanvasRenderingContext2D
      | OffscreenCanvasRenderingContext2D
  );
  const palette: [number, number, number][] = new Array(RAMPS.length * NT);
  const palette32 = new Uint32Array(RAMPS.length * NT);
  const body = {
    albedo: [1, 1, 1],
    hi: [1, 1, 1],
    lo: [0, 0, 0],
    ground: [1, 1, 1],
  };
  let cornerPx = 9999;
  let motionScale = 1;
  let needBake = true;

  const readColor = (
    style: CSSStyleDeclaration,
    name: string
  ): [number, number, number] => {
    probe.style.color = style.getPropertyValue(`--_${name}`).trim();
    paint.clearRect(0, 0, 1, 1);
    paint.fillStyle = getComputedStyle(probe).color;
    paint.fillRect(0, 0, 1, 1);
    const d = paint.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2]];
  };

  const readTokens = () => {
    const style = getComputedStyle(root);
    const labs: Record<string, [number, number, number]> = {};
    for (const name of ["bg", "surface", "fg", "muted", "accent"]) {
      labs[name] = rgbToOklab(readColor(style, name));
    }
    RAMPS.forEach(([name, turn, amount], ramp) => {
      const [, a, b] = labs[name];
      const angle = (turn * Math.PI) / 180;
      const ca = Math.cos(angle);
      const sa = Math.sin(angle);
      TONES.forEach((L, step) => {
        const edge = 1 - 0.42 * Math.pow((L - 0.56) / 0.38, 2);
        const lab: [number, number, number] = [
          L,
          (a * ca - b * sa) * amount * edge,
          (a * sa + b * ca) * amount * edge,
        ];
        const rgb = labTone(lab, L);
        const id = ramp * NT + step;
        palette[id] = rgb;
        palette32[id] =
          (255 << 24) | (rgb[2] << 16) | (rgb[1] << 8) | rgb[0];
      });
    });

    const bgLab = labs.bg;
    const bodyL =
      bgLab[0] > 0.5 ? Math.min(0.975, bgLab[0] + 0.02) : bgLab[0] + 0.16;
    const unitOf = (rgb: [number, number, number]) => rgb.map((v) => v / 255);
    body.albedo = unitOf(labTone(bgLab, bodyL));
    body.hi = unitOf(
      labTone(bgLab, Math.min(0.998, bodyL + (bgLab[0] > 0.5 ? 0.12 : 0.34)))
    );
    body.lo = unitOf(labTone(bgLab, bodyL * 0.6));
    body.ground = unitOf(readColor(style, "bg"));

    probe.style.borderTopLeftRadius = style
      .getPropertyValue("--_radius")
      .trim();
    const radius = getComputedStyle(probe).borderTopLeftRadius;
    cornerPx = radius.endsWith("%") ? 9999 : parseFloat(radius) || 0;
    const motion = style.getPropertyValue("--_motion").trim();
    const ms = motion.endsWith("ms")
      ? parseFloat(motion)
      : parseFloat(motion) * 1000;
    motionScale = ms > 0 ? clamp(200 / ms, 0.4, 2.5) : 2.5;
    needBake = true;
  };

  const unit = (id: number) => palette[id].map((v) => v / 255);

  const NM = MATS.length;
  const litTable = new Uint8Array(NM * 8);
  const tintTable = new Uint8Array(NM * 3 * 8);
  const glowOf = new Float32Array(NM);
  const pal = (ramp: number, tone: number) =>
    ramp * NT + clamp(Math.round(tone), 0, NT - 1);

  MATS.forEach(([, r, t, self = 0, glow = 0], m) => {
    glowOf[m] = glow;
    for (let lv = 0; lv < 8; lv++) {
      let id: number;
      if (self) id = pal(r, t);
      else if (lv === 0) id = pal(RK, t * 0.2);
      else if (lv === 1) id = pal(RK, 0.4 + t * 0.36);
      else if (lv === 2) id = pal(RU, t * 0.42 - 0.2);
      else id = pal(r, t - 6 + lv);
      litTable[m * 8 + lv] = id;
      const person = m >= CHAR_FROM && m <= CHAR_TO;
      [LP, LT, LA].forEach((c, ci) => {
        tintTable[(m * 3 + ci) * 8 + lv] = self
          ? id
          : person
          ? pal(r, t - 5 + lv)
          : pal(c, t * 0.8 + (lv - 4) * 0.62 + 0.3);
      });
    }
  });

  let bw = 1;
  let bh = 1;
  let ox = 0;
  let oy = 0;
  let k = 1;
  let matBuf = new Uint8Array(1);
  let baseBuf = new Uint8Array(1);
  let tintBuf = new Uint8Array(1);
  let thrBuf = new Float32Array(1);
  let pixels = new Uint32Array(1);
  let pixelBytes = new Uint8Array(pixels.buffer);
  let ceilMap = new Float32Array(1);
  let lampMap = new Float32Array(1);
  let moonMap = new Float32Array(1);
  let nextMap = new Float32Array(1);
  let gridOf = new Int32Array(1);
  let emitScale = 0;

  const put = (x: number, y: number, m: number) => {
    const px = x + ox;
    const py = y + oy;
    if (px < 0 || py < 0 || px >= bw || py >= bh) return;
    matBuf[py * bw + px] = m;
  };
  const rect = (
    x: number,
    y: number,
    w: number,
    h: number,
    m: number
  ) => {
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) put(x + i, y + j, m);
    }
  };
  const disc = (
    cx: number,
    cy: number,
    r: number,
    fn: (x: number, y: number, d: number, dx: number, dy: number) => void
  ) => {
    const R = Math.ceil(r);
    for (let dy = -R; dy <= R; dy++) {
      for (let dx = -R; dx <= R; dx++) {
        const d = Math.hypot(dx, dy);
        if (d <= r) fn(cx + dx, cy + dy, d, dx, dy);
      }
    }
  };
  const glyph = (
    cells: [number, number, string][],
    x: number,
    y: number,
    m: number,
    rim = -1
  ) => {
    if (rim >= 0) {
      for (const [i, j] of cells) {
        put(x + i - 1, y + j, rim);
        put(x + i + 1, y + j, rim);
        put(x + i, y + j - 1, rim);
        put(x + i, y + j + 1, rim);
      }
    }
    for (const [i, j] of cells) put(x + i, y + j, m);
  };

  const roomAt = (x: number, y: number) => {
    if (y < 3 || y >= 67) {
      if (y === 2 || y === 67) return M.CUT;
      return (x - y) % 7 === 0 ? M.SLAB_LT : M.SLAB;
    }
    if (x >= WALL_X && x < WALL_X + 8) {
      if (x === WALL_X || x === WALL_X + 7) return M.CUT;
      const row = y >> 1;
      if ((y & 1) === 1) return M.BRICK;
      return ((x + (row & 1) * 2) & 3) === 0 ? M.BRICK : M.BRICK_LT;
    }
    if (x >= WALL_X + 8) {
      if (y < 49) return (x + 400) % 5 === 0 ? M.NB_WALL_D : M.NB_WALL;
      if (y < 52) return M.NB_TRIM;
      return M.NB_FLOOR;
    }
    if (y < 5) return y === 3 ? M.TRIM : M.TRIM_D;
    if (y < 49) {
      const rowBand = (y >> 3) & 1;
      const dot =
        ((x + 400 + rowBand * 5) % 10 === 0 && y % 8 === 3) ||
        ((x + 400 + rowBand * 5) % 10 === 5 && y % 8 === 7);
      return dot ? M.WALL_D : M.WALL;
    }
    if (y === 49) return M.TRIM;
    if (y === 50) return M.TRIM;
    if (y === 51) return M.TRIM_D;
    const bands = [52, 54, 56, 59, 62, 67];
    let band = 0;
    while (band < 4 && y >= bands[band + 1]) band++;
    if (y === bands[band] && band > 0) return M.FLOOR_D;
    const span = [11, 13, 16, 19, 24][band];
    const shifted = x + 400 + band * 7;
    if (shifted % span === 0) return M.FLOOR_D;
    const plank = Math.floor(shifted / span) * 13 + band * 5;
    return plank % 5 === 0 ? M.FLOOR_LT : M.FLOOR;
  };

  const paintRug = () => {
    for (let y = 55; y < 65; y++) {
      const inset = (64 - y) * 0.8;
      const l = Math.round(150 + inset);
      const r = Math.round(204 - inset);
      for (let x = l; x <= r; x++) {
        const edge = x - l < 2 || r - x < 2 || y === 55 || y === 64;
        const stripe = ((x + y * 2) >> 2) % 3 === 0;
        put(x, y, edge ? M.RUG_LT : stripe ? M.RUG_D : M.RUG);
      }
      if (y % 2 === 0) {
        put(l - 1, y, M.RUG_LT);
        put(r + 1, y, M.RUG_LT);
      }
    }
  };

  const paintWindow = () => {
    const X0 = 100;
    const X1 = 138;
    const Y0 = 10;
    const Y1 = 36;
    for (let y = Y0; y < Y1; y++) {
      for (let x = X0; x < X1; x++) {
        const v = (y - Y0) / (Y1 - Y0);
        const d = bayerAt(x + ox, y + oy) / 16;
        const m =
          v + (d - 0.5) * 0.16 < 0.34
            ? M.SKY0
            : v + (d - 0.5) * 0.16 < 0.68
            ? M.SKY1
            : M.SKY2;
        put(x, y, m);
      }
    }
    disc(128, 17, 4.4, (x, y, _d, dx, dy) => {
      const crater =
        (dx === -1 && dy === -1) ||
        (dx === 2 && dy === 0) ||
        (dx === -2 && dy === 2) ||
        (dx === 1 && dy === 2);
      put(x, y, crater || dx + dy > 4 ? M.MOON_D : M.MOON);
    });
    const r = seeded(4242);
    for (let layer = 0; layer < 2; layer++) {
      let x = X0 + 1;
      while (x < X1 - 1) {
        const w = 3 + Math.floor(r() * 6);
        const h = (layer === 0 ? 5 : 2) + Math.floor(r() * 6);
        rect(x, Y1 - h, w, h, layer === 0 ? M.BLD_F : M.BLD);
        x += w + (layer === 0 ? 0 : Math.floor(r() * 2));
      }
    }
    rect(X0 - 1, Y0 - 1, X1 - X0 + 2, 1, M.TRIM);
    rect(X0 - 1, Y0, 1, Y1 - Y0, M.TRIM);
    rect(X1, Y0, 1, Y1 - Y0, M.TRIM_D);
    rect(119, Y0, 1, Y1 - Y0, M.TRIM_D);
    rect(X0, 23, X1 - X0, 1, M.TRIM_D);
    rect(X0 - 2, Y1, X1 - X0 + 4, 2, M.TRIM);
    rect(X0 - 2, Y1 + 1, X1 - X0 + 4, 1, M.TRIM_D);
    rect(94, 7, 50, 1, M.WOOD_DD);
    rect(93, 6, 2, 3, M.WOOD);
    rect(143, 6, 2, 3, M.WOOD);
  };

  const paintSofa = () => {
    rect(99, 56, 44, 1, M.FLOOR_D);
    rect(102, 57, 38, 1, M.FLOOR_D);
    rect(102, 38, 36, 10, M.SOFA);
    rect(103, 37, 34, 1, M.SOFA_HI);
    rect(102, 38, 36, 1, M.SOFA_HI);
    for (let y = 39; y < 48; y++) {
      put(114, y, M.SOFA_D);
      put(126, y, M.SOFA_D);
    }
    rect(102, 47, 36, 2, M.SOFA_HI);
    rect(102, 49, 36, 5, M.SOFA);
    rect(102, 52, 36, 2, M.SOFA_D);
    put(114, 47, M.SOFA_D);
    put(114, 48, M.SOFA_D);
    put(126, 47, M.SOFA_D);
    put(126, 48, M.SOFA_D);
    for (const ax of [97, 137]) {
      rect(ax, 43, 6, 11, M.SOFA);
      rect(ax + 1, 42, 4, 1, M.SOFA_HI);
      rect(ax, 43, 6, 2, M.SOFA_HI);
      rect(ax, 51, 6, 3, M.SOFA_D);
    }
    rect(99, 54, 2, 3, M.WOOD_DD);
    rect(139, 54, 2, 3, M.WOOD_DD);
    rect(104, 41, 9, 6, M.PILLOW);
    rect(105, 40, 7, 1, M.PILLOW);
    rect(105, 47, 7, 1, M.PILLOW_D);
    put(104, 41, M.SOFA);
    put(112, 41, M.SOFA);
    rect(105, 42, 2, 1, M.BK_HI);
  };

  const paintShelf = () => {
    rect(60, 8, 34, 46, M.WOOD_D);
    rect(60, 8, 34, 2, M.WOOD_LT);
    rect(59, 7, 36, 1, M.WOOD_HI);
    rect(60, 8, 2, 46, M.WOOD);
    rect(92, 8, 2, 46, M.WOOD);
    rect(62, 10, 30, 42, M.WOOD_DD);
    for (const y of [18, 29, 40, 51]) {
      rect(62, y, 30, 2, M.WOOD_LT);
      rect(62, y + 2, 30, 1, M.BAFFLE);
    }
    rect(60, 54, 34, 2, M.WOOD_DD);
    rect(60, 56, 36, 1, M.FLOOR_D);
  };

  const paintPot = () => {
    rect(12, 57, 16, 2, M.FLOOR_D);
    for (let y = 50; y < 58; y++) {
      const inset = Math.floor((y - 50) / 3);
      rect(14 + inset, y, 12 - inset * 2, 1, M.POT);
      put(14 + inset, y, M.POT_HI);
      put(15 + inset, y, M.POT_HI);
      put(25 - inset, y, M.POT_D);
    }
    rect(13, 48, 14, 2, M.POT_HI);
    rect(13, 49, 14, 1, M.POT);
    rect(14, 48, 12, 1, M.SOIL);
  };

  const paintCabinet = () => {
    rect(186, 38, 19, 14, M.WOOD);
    rect(186, 38, 19, 1, M.WOOD_HI);
    rect(187, 40, 8, 10, M.WOOD_D);
    rect(196, 40, 8, 10, M.WOOD_D);
    rect(187, 40, 8, 1, M.WOOD_LT);
    rect(196, 40, 8, 1, M.WOOD_LT);
    put(194, 45, M.METAL_HI);
    put(196, 45, M.METAL_HI);
    rect(187, 52, 2, 3, M.WOOD_DD);
    rect(202, 52, 2, 3, M.WOOD_DD);
    rect(186, 55, 19, 1, M.FLOOR_D);
    rect(188, 35, 15, 3, M.BAFFLE);
    rect(188, 35, 15, 1, M.CONE_HI);
    put(200, 36, M.LED_OFF);
  };

  const paintDoor = () => {
    rect(-32, 13, 24, 39, M.WOOD_D);
    rect(-30, 15, 20, 37, M.WOOD);
    rect(-28, 17, 16, 14, M.WOOD_LT);
    rect(-28, 34, 16, 15, M.WOOD_LT);
    rect(-27, 18, 14, 12, M.WOOD);
    rect(-27, 35, 14, 13, M.WOOD);
    rect(-12, 32, 2, 2, M.METAL_HI);
    rect(-4, 18, 1, 38, M.WOOD_DD);
    rect(-7, 55, 7, 1, M.WOOD_DD);
    rect(-7, 20, 7, 1, M.WOOD_DD);
    rect(-7, 21, 3, 14, M.CURTAIN_D);
    rect(-7, 21, 1, 14, M.CURTAIN);
  };

  const paintNextRoom = () => {
    rect(222, 45, 40, 9, M.NB_BED);
    rect(222, 45, 40, 2, M.NB_BED_HI);
    rect(222, 54, 40, 2, M.WOOD_DD);
    rect(220, 38, 3, 18, M.WOOD_D);
    rect(223, 43, 9, 3, M.NB_SHEET);
    rect(250, 18, 16, 2, M.WOOD_D);
    rect(252, 13, 3, 5, M.NB_LAMP);
    rect(257, 12, 2, 6, M.BK_U);
    rect(259, 13, 2, 5, M.BK_G);
    rect(232, 16, 11, 9, M.NB_WALL_D);
    rect(233, 17, 9, 7, M.NB_TRIM);
  };

  const buildLight = () => {
    for (let py = 0; py < bh; py++) {
      for (let px = 0; px < bw; px++) {
        const x = px - ox;
        const y = py - oy;
        const i = py * bw + px;
        const inRoom = x < WALL_X && y >= 3 && y < 67;
        const inNext = x >= WALL_X + 8 && y >= 3 && y < 67;
        let c = 0;
        let l = 0;
        let mn = 0;
        let nb = 0;
        if (inRoom) {
          c = 0.84 + 0.16 * Math.exp(-Math.pow((x - 120) / 130, 2));
          if (y < 12) c -= (12 - y) * 0.012;
          const dx = x - LAMP_X;
          const dy = (y - LAMP_Y) * 1.05;
          const d2 = dx * dx + dy * dy;
          const fall = 1 / (1 + d2 / (34 * 34));
          const cone = Math.abs(dy) / Math.sqrt(d2 + 1);
          l = fall * (0.34 + 0.66 * smoothstep(0.08, 0.66, cone)) * 1.3;
          mn = 0.1;
          if (y >= 53) {
            const shear = (y - 53) * 0.7;
            const inPatch =
              x >= 103 + shear &&
              x <= 135 + shear &&
              Math.abs(x - (119 + shear)) > 1;
            if (inPatch) mn += 0.16;
          }
          if (
            (y >= 37 && y < 42 && x >= 102 && x < 138) ||
            (y >= 42 && y < 54 && x >= 97 && x < 143)
          )
            mn += 0.1;
          mn +=
            0.05 *
            Math.exp(-Math.pow((x - 119) / 34, 2)) *
            (y < 53 ? 1 : 0.4);
        }
        if (inNext) {
          const d = Math.hypot(x - 238, y - 24) / 34;
          nb = 1 / (1 + d * d);
        }
        ceilMap[i] = c;
        lampMap[i] = l;
        moonMap[i] = mn;
        nextMap[i] = nb;
      }
    }
  };

  const art = new Uint8Array(FRAME_W * FRAME_H);
  (() => {
    for (let v = 0; v < FRAME_H; v++) {
      for (let u = 0; u < FRAME_W; u++) {
        let m: number;
        const edge = Math.min(u, v, FRAME_W - 1 - u, FRAME_H - 1 - v);
        if (edge === 0) m = u === 0 || v === 0 ? M.ART_FR_HI : M.ART_FR;
        else if (edge === 1) m = M.ART_FR;
        else if (edge === 2) m = M.ART_MAT;
        else {
          const hill = 9.5 + Math.sin(u * 0.75) * 1.2 - Math.abs(u - 8) * 0.28;
          const hillFar = 10.5 - Math.sin(u * 0.5 + 2) * 1.5;
          if (Math.hypot(u - 12.5, v - 6.5) < 2) m = M.ART_SUN;
          else if (v > 11) m = (u + v) % 3 === 0 ? M.ART_SKY2 : M.ART_SEA;
          else if (v > hill + 1) m = M.ART_M2;
          else if (v > hillFar) m = M.ART_M1;
          else
            m =
              v < 6
                ? M.ART_SKY
                : (u + v) % 2 === 0
                ? M.ART_SKY2
                : M.ART_SKY;
        }
        art[v * FRAME_W + u] = m;
      }
    }
  })();

  interface Book {
    x: number;
    w: number;
    h: number;
    y: number;
    m: number;
    band: boolean;
    id: number;
  }
  const books: Book[] = [];
  (() => {
    const r = seeded(9091);
    const kinds = [
      M.BK_S,
      M.BK_U,
      M.BK_A,
      M.BK_G,
      M.BK_P,
      M.BK_T,
      M.BK_C,
      M.BK_K,
      M.BK_U,
      M.BK_S,
    ];
    for (const floorY of [18, 29, 40, 51]) {
      let x = 63;
      while (x < 90) {
        const w = 2 + Math.floor(r() * 3);
        if (x + w > 91) break;
        const h = 5 + Math.floor(r() * 3.5);
        if (r() < 0.14) {
          x += 2 + Math.floor(r() * 2);
          continue;
        }
        books.push({
          x,
          w,
          h,
          y: floorY,
          m: kinds[Math.floor(r() * kinds.length)],
          band: r() < 0.5,
          id: books.length,
        });
        x += w;
      }
    }
  })();
  const fallBook =
    books.filter((b) => b.y === 40).at(-1) ?? books[books.length - 1];

  const LEAVES: [number, number, number, number, number][] = [
    [1, 3.0, 13, 5, 6],
    [2, 0.12, 14, 5.2, 7],
    [6, 2.6, 13, 5.4, 7],
    [8, 0.42, 14, 5.4, 7],
    [12, 2.92, 12, 5, 6],
    [14, 0.16, 12, 4.8, 6],
    [17, 2.32, 13, 5.2, 6],
    [20, 0.72, 13, 5, 6],
    [23, 2.8, 10, 4.4, 5],
    [25, 0.3, 10, 4.2, 5],
    [27, 2.0, 10, 4.4, 4],
    [29, 1.1, 10, 4.4, 3],
    [30, 1.58, 9, 3.8, 2],
  ];

  interface Star {
    x: number;
    y: number;
    s: number;
  }
  interface Light {
    x: number;
    y: number;
    thr: number;
  }
  const stars: Star[] = [];
  const lights: Light[] = [];
  (() => {
    const r = seeded(7711);
    for (let i = 0; i < 18; i++) {
      stars.push({
        x: 101 + Math.floor(r() * 36),
        y: 11 + Math.floor(r() * 14),
        s: r(),
      });
    }
    for (let i = 0; i < 26; i++) {
      lights.push({
        x: 102 + Math.floor(r() * 17) * 2,
        y: 25 + Math.floor(r() * 5) * 2,
        thr: i < 4 ? 0 : 0.04 + r() * 0.9,
      });
    }
  })();

  interface Wave {
    r: number;
    p: number;
  }
  interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    m: number;
    g?: number;
  }
  interface Don {
    x: number;
    y: number;
    life: number;
  }
  interface Zee {
    x: number;
    y: number;
    life: number;
  }
  interface Dot {
    lon: number;
    lat: number;
    m: number;
    big: boolean;
  }

  const waves: Wave[] = [];
  const particles: Particle[] = [];
  const dons: Don[] = [];
  const zees: Zee[] = [];
  const dots: Dot[] = [];
  (() => {
    const r = seeded(555);
    const list = [M.DOT_P, M.DOT_T, M.DOT_A, M.DOT_C];
    for (let i = 0; i < 34; i++) {
      dots.push({
        lon: r() * Math.PI * 2,
        lat: (r() - 0.5) * 1.3,
        m: list[i % 4],
        big: r() < 0.3,
      });
    }
  })();

  const frame = { a: 0, av: 0, rest: 0 };
  const actor = {
    x: SOFA_X,
    mode: "read",
    next: "read",
    goal: SOFA_X,
    tween: 1,
    from: null as Float32Array | null,
    step: 0,
    startle: 0,
    tidy: 0,
    facing: 1,
    page: 0,
    pageT: 0,
    blink: 0,
    nextBlink: 2,
  };
  const nb = { mode: "bed", hit: 0, light: 0, lift: 0 };
  const knock = { wait: 1.2, left: 0, gap: 0, side: 0 };
  const fallen = { on: false, x: 0, y: 0, vy: 0 };

  // Slider state
  let value = clamp(
    Math.round(Number(input.value) || options.initialValue || 72),
    minVal,
    maxVal
  );
  let x = (value - minVal) / Math.max(1, maxVal - minVal);
  let velocity = 0;
  let stretch = 0;
  let stretchV = 0;
  let lift = 0;
  let liftTarget = 0;
  let wobble = 0;
  let beat = 0;
  let halfCount = 0;
  let kick = 0;
  let anim = 0;
  let lampNow = 0;
  let party = 0;
  let ballDrop = 0;
  let shakeT = 0;
  let shakeBig = 0;
  let shiftX = 0;
  let shiftY = 0;
  let spin = 0;
  let zeeAcc = 0;

  const seatedMode = (m: string) =>
    m === "sleep" || m === "read" || m === "tap";

  const wantMode = () => {
    if (x <= 0.12) return "sleep";
    if (x <= 0.38) return "read";
    if (x <= 0.65) return "tap";
    if (x < 0.88) return "dance";
    return "wild";
  };
  const isMax = () => x >= 0.88;

  const describe = (v: number) => {
    if (v <= 12) return `Level ${v}: Tidur Nyenyak (Kasus Sangat Santai)`;
    if (v <= 38)
      return `Level ${v}: Membaca Tenang (Kasus Dasar & Petunjuk Aktif)`;
    if (v <= 65)
      return `Level ${v}: Irama Waspada (Kasus Standar Manipulasi)`;
    if (v < 88)
      return `Level ${v}: Berdansa Cepat (Kasus Menantang & Waktu Ketat)`;
    return `Level ${v}: Ekstrem Liar! (Red John Mengamuk, Kamar Berguncang)`;
  };

  const lensWorldX = () => {
    const center = (shape.W / 2 - shape.ox) / k - ox;
    return center + ((x - 0.5) * shape.travel) / k;
  };
  const waveReach = () =>
    clamp(lensWorldX() - SPK_X + 22, 16, WALL_X - SPK_X - 1);

  const waveFront = (wx: number) => {
    let best = 0;
    const dist = Math.abs(wx - SPK_X);
    for (const w of waves) {
      const near = 1 - Math.abs(w.r - dist) / 5;
      if (near > 0 && w.p * near > best) best = w.p * near;
    }
    return best;
  };

  const poseOf = (
    hx: number,
    hy: number,
    cx: number,
    cy: number,
    nx: number,
    ny: number,
    af: [number, number, number, number],
    ab: [number, number, number, number],
    lf: [number, number, number, number],
    lb: [number, number, number, number]
  ) =>
    Float32Array.of(
      hx,
      hy,
      cx,
      cy,
      nx,
      ny,
      af[0],
      af[1],
      af[2],
      af[3],
      ab[0],
      ab[1],
      ab[2],
      ab[3],
      lf[0],
      lf[1],
      lf[2],
      lf[3],
      lb[0],
      lb[1],
      lb[2],
      lb[3]
    );

  const attr = {
    eyes: 0,
    mouth: 0,
    phones: 0,
    book: 0,
    toeUp: 0,
    flip: -1,
  };

  const seatLegs = (
    tapLift = 0
  ): [
    [number, number, number, number],
    [number, number, number, number]
  ] => [
    [5, 1, 6, 10 - tapLift],
    [4, 1, 3, 10],
  ];

  const poseFor = (mode: string) => {
    const n = Math.floor(beat);
    const ph = beat - n;
    const c = Math.sin(beat * Math.PI);
    attr.eyes = 0;
    attr.mouth = 0;
    attr.phones = 0;
    attr.book = 0;
    attr.toeUp = 0;
    attr.flip = -1;
    switch (mode) {
      case "sleep": {
        attr.eyes = 1;
        return poseOf(
          -3,
          -11,
          -8,
          -5,
          -4,
          1,
          [-3, 4, -1, 6],
          [-3, 4, -2, 6],
          [6, -1, 11, 1],
          [5, 0, 10, 2]
        );
      }
      case "read": {
        const bob = !calm && n % 4 === 0 && ph < 0.3 ? 1 : 0;
        attr.eyes = actor.blink > 0 ? 2 : 1;
        attr.phones = 1;
        attr.book = 1;
        attr.flip = actor.pageT > 0 ? actor.pageT : -1;
        const [lf, lb] = seatLegs();
        return poseOf(
          0,
          -10,
          0,
          -9,
          1,
          -1 + bob,
          [3, 6, 7, 7],
          [2, 6, 6, 8],
          lf,
          lb
        );
      }
      case "tap": {
        const down = !calm && ph < 0.36;
        attr.eyes = actor.blink > 0 ? 1 : 0;
        attr.phones = 2;
        attr.toeUp = calm ? 1 : ph > 0.5 ? 1 : 0;
        const sway = calm ? 0 : c * 0.8;
        const fingers = !calm && ph > 0.8 ? -1 : 0;
        const [lf, lb] = seatLegs();
        return poseOf(
          0,
          -10,
          sway,
          -9,
          sway * 0.5,
          down ? 0 : -1,
          [2, 5, 5, 8 + fingers],
          [1, 5, 4, 8],
          lf,
          lb
        );
      }
      case "dance": {
        const amp = clamp((x - 0.65) / (0.88 - 0.65));
        const bounce = Math.abs(c);
        const dip = (1 - bounce) * (1 + amp);
        const hx = c * (1 + 2 * amp);
        const liftF = c < 0 ? -c * (2 + 2 * amp) : 0;
        const liftB = c > 0 ? c * (2 + 2 * amp) : 0;
        const fF = 3 - hx;
        const fB = -3 - hx;
        const legH = 12 - dip;
        attr.eyes = ph < 0.5 ? 2 : 0;
        attr.mouth = ph < 0.42 ? 1 : 0;
        attr.phones = 2;
        return poseOf(
          hx,
          -12 + dip,
          -c * 0.8,
          -9,
          c * 0.6,
          -1 + (ph < 0.3 ? 1 : 0),
          [
            3,
            4 - c * (2 + 3 * amp) - amp * 3,
            5 + amp,
            1 - c * (3 + 5 * amp) - amp * 6,
          ],
          [
            -3,
            4 + c * (2 + 3 * amp) - amp * 3,
            -5 - amp,
            1 + c * (3 + 5 * amp) - amp * 6,
          ],
          [fF * 0.5 + 1, legH * 0.5 - liftF * 0.5, fF, legH - liftF],
          [fB * 0.5 - 1, legH * 0.5 - liftB * 0.5, fB, legH - liftB]
        );
      }
      case "wild": {
        const j = Math.abs(c);
        const jump = j * j * 5;
        const tuck = j * 3;
        const wag = Math.sin(beat * Math.PI * 2);
        attr.eyes = 2;
        attr.mouth = 1;
        attr.phones = 2;
        return poseOf(
          c * 2,
          -12 - jump,
          -c,
          -9,
          c * 0.8,
          ph < 0.4 ? 0 : -1,
          [4, -5 + wag, 6 + wag, -12 + wag],
          [-4, -5 - wag, -6 + wag, -12 - wag],
          [3, 6 - tuck * 0.5, 4, 12 - tuck],
          [-3, 6 - tuck * 0.5, -4, 12 - tuck]
        );
      }
      case "startle": {
        attr.eyes = 0;
        attr.mouth = 1;
        attr.phones = 2;
        return poseOf(
          0,
          -13,
          -1,
          -9,
          -1,
          -1,
          [4, 3, 6, -2],
          [-4, 3, -6, -2],
          [2, 7, 2, 13],
          [-2, 7, -2, 13]
        );
      }
      case "walk": {
        const s = Math.sin(actor.step * Math.PI);
        attr.phones = 2;
        attr.eyes = actor.blink > 0 ? 1 : 0;
        return poseOf(
          0,
          -12 - Math.abs(s) * 0.8,
          0,
          -9,
          0,
          -1,
          [s * -2, 5, s * -3, 9],
          [s * 2, 5, s * 3, 9],
          [1 + s * 2, 6, s * 4, 12 - Math.max(0, -s) * 2],
          [-1 - s * 2, 6, -s * 4, 12 - Math.max(0, s) * 2]
        );
      }
      case "tidy": {
        attr.phones = 2;
        return poseOf(
          0,
          -12,
          0,
          -9,
          0,
          -1,
          [4, -3, 7, -10],
          [-1, 5, -1, 9],
          [1, 6, 1, 12],
          [-1, 6, -1, 12]
        );
      }
      default:
        return poseOf(
          0,
          -12,
          0,
          -9,
          0,
          -1,
          [1, 5, 1, 10],
          [-1, 5, -1, 10],
          [1, 6, 1, 12],
          [-1, 6, -1, 12]
        );
    }
  };

  const setMode = (mode: string) => {
    if (mode === actor.mode) return;
    actor.from = lastPose ? lastPose.slice() : null;
    actor.tween = actor.from ? 0 : 1;
    actor.mode = mode;
  };
  let lastPose: Float32Array | null = null;

  const stepActor = (dt: number) => {
    const want = wantMode();
    if (calm) {
      actor.mode = want;
      actor.x = seatedMode(want) ? SOFA_X : DANCE_X;
      actor.tween = 1;
      actor.startle = 0;
      actor.facing = 1;
      if (want !== "wild") frame.rest = 0;
      return;
    }
    actor.tween = Math.min(1, actor.tween + dt / 0.26);
    actor.startle = Math.max(0, actor.startle - dt);
    actor.blink = Math.max(0, actor.blink - dt);
    actor.nextBlink -= dt;
    if (actor.nextBlink <= 0) {
      actor.blink = 0.13;
      actor.nextBlink = 1.8 + Math.random() * 3.2;
    }
    actor.page -= dt;
    if (actor.page <= 0) {
      actor.pageT = 0.42;
      actor.page = 4.4 + Math.random() * 3;
    }
    actor.pageT = Math.max(0, actor.pageT - dt);

    if (actor.mode === "walk") {
      actor.next = want;
      actor.goal = seatedMode(want) ? SOFA_X : DANCE_X;
      if (seatedMode(want) && frame.rest !== 0 && actor.x > SOFA_X + 30) {
        actor.goal = TIDY_X;
        actor.next = "tidy";
      }
      const delta = actor.goal - actor.x;
      const speed = 54 + Math.abs(velocity) * 120;
      if (Math.abs(delta) > 0.6) {
        const move = Math.min(Math.abs(delta), speed * dt);
        actor.x += Math.sign(delta) * move;
        actor.facing = Math.sign(delta);
        actor.step += move * 0.2;
      } else {
        actor.x = actor.goal;
        setMode(actor.next);
        if (actor.next === "tidy") actor.tidy = 0.85;
      }
      return;
    }
    if (actor.mode === "tidy") {
      actor.facing = -1;
      actor.tidy -= dt;
      if (actor.tidy < 0.45) frame.rest = 0;
      if (!seatedMode(want)) {
        actor.next = want;
        setMode(want);
      } else if (actor.tidy <= 0) {
        actor.goal = SOFA_X;
        actor.next = want;
        setMode("walk");
      }
      return;
    }
    if (actor.mode !== want) {
      if (seatedMode(actor.mode) === seatedMode(want)) {
        setMode(want);
      } else {
        actor.goal = seatedMode(want) ? SOFA_X : DANCE_X;
        actor.next = want;
        setMode("walk");
      }
    }
    if (seatedMode(actor.mode)) actor.facing = 1;
    else if (actor.startle > 0) actor.facing = 1;
    else if (actor.mode === "wild")
      actor.facing = Math.floor(beat / 4) % 2 === 0 ? 1 : -1;
    else if (actor.mode === "dance")
      actor.facing = Math.floor(beat / 8) % 2 === 0 ? 1 : -1;
  };

  const knockHit = () => {
    nb.hit = 0.14;
    shakeBig = 0.14;
    wobble = Math.max(wobble, 0.6);
    knock.side = (knock.side + 1) % 3;
    dons.push({ x: WALL_X - 7, y: [5, 13, 21][knock.side], life: 0.48 });
    frame.rest = Math.min(frame.rest + 2.6, 12);
    frame.av += (Math.random() < 0.5 ? -1 : 1) * 42;
    for (let i = 0; i < 7; i++) {
      particles.push({
        x: 150 + Math.random() * 56,
        y: 5,
        vx: (Math.random() - 0.5) * 8,
        vy: 10 + Math.random() * 20,
        life: 1.1 + Math.random() * 0.7,
        m: M.DUST,
        g: 40,
      });
    }
    for (let i = 0; i < 4; i++) {
      particles.push({
        x: WALL_X - 1,
        y: 18 + Math.random() * 24,
        vx: -14 - Math.random() * 20,
        vy: Math.random() * 10,
        life: 0.5,
        m: M.DUST,
        g: 50,
      });
    }
    if (actor.mode === "wild" && actor.startle <= 0 && knock.left === 2)
      actor.startle = 0.62;
    if (!fallen.on && Math.random() < 0.8) {
      fallen.on = true;
      fallen.x = fallBook.x;
      fallen.y = fallBook.y - fallBook.h;
      fallen.vy = 0;
    }
  };

  const stepWorld = (dt: number) => {
    const t = calm ? 0 : dt;
    anim += t;

    const prevN = Math.floor(beat);
    if (!calm) beat += (t * BPM) / 60;
    else beat = 0.25;
    const n = Math.floor(beat);
    const ph = beat - n;
    kick = calm ? 0.5 : Math.exp(-ph * 4.2);
    const crossedHalf = Math.floor(beat * 2) !== halfCount;
    halfCount = Math.floor(beat * 2);

    const power = x;
    if (!calm) {
      if (crossedHalf && value > minVal) {
        const isDown = halfCount % 2 === 0;
        if (isDown || power > 0.45)
          waves.push({ r: 8, p: power * (isDown ? 1 : 0.62) });
      }
      const speed = 34 + 46 * power;
      for (const w of waves) {
        w.r += speed * t;
        if (value > minVal) w.p = Math.min(w.p, Math.max(power, 0.05));
      }
      const reach = waveReach();
      for (let i = waves.length - 1; i >= 0; i--) {
        if (waves[i].r > reach || waves.length > 24) waves.splice(i, 1);
      }
    }

    if (calm) {
      lampNow = value > minVal ? 1 : 0;
      party = smoothstep(0.62, 0.72, x);
      ballDrop = party;
    } else {
      lampNow +=
        ((value > minVal ? 1 : 0) - lampNow) * (1 - Math.exp(-t * 10));
      party +=
        (smoothstep(0.62, 0.72, x) - party) * (1 - Math.exp(-t * 4));
      ballDrop +=
        (party > 0.02 ? 1 - ballDrop : -ballDrop) * (1 - Math.exp(-t * 2.4));
    }
    spin += t * 1.1;

    stepActor(t);

    if (x >= 0.86) nb.mode = isMax() ? "knock" : "up";
    else nb.mode = "bed";
    const wantLight = nb.mode === "bed" ? 0 : 1;
    nb.light = calm
      ? wantLight
      : nb.light + (wantLight - nb.light) * (1 - Math.exp(-t * 6));
    nb.hit = Math.max(0, nb.hit - t);

    if (!calm && isMax()) {
      if (knock.left > 0) {
        knock.gap -= t;
        if (knock.gap <= 0) {
          knock.left -= 1;
          knock.gap = 0.24;
          knockHit();
          if (knock.left === 0) knock.wait = 2.3 + Math.random() * 0.7;
        }
      } else {
        knock.wait -= t;
        if (knock.wait <= 0) {
          knock.left = 3;
          knock.gap = 0;
        }
      }
    } else if (!calm) {
      knock.left = 0;
      knock.wait = 1.1;
    }
    if (calm) {
      dons.length = 0;
      if (isMax()) dons.push({ x: WALL_X - 7, y: 13, life: 1 });
      frame.rest = isMax() ? 9 : 0;
      frame.a = frame.rest;
      frame.av = 0;
      fallen.on = false;
    }

    if (!calm) {
      shakeT = Math.max(0, shakeT - t);
      shakeBig = Math.max(0, shakeBig - t);
      if (n !== prevN && isMax()) shakeT = 0.11;
      if (shakeBig > 0) {
        shiftX = Math.random() < 0.5 ? -2 : 2;
        shiftY = Math.random() < 0.5 ? -1 : 1;
      } else if (shakeT > 0) {
        shiftX = n % 2 === 0 ? 1 : -1;
        shiftY = shakeT > 0.06 ? 1 : 0;
      } else {
        shiftX = 0;
        shiftY = 0;
      }
    } else {
      shiftX = 0;
      shiftY = 0;
    }

    if (!calm) {
      if (isMax() && n !== prevN) frame.av += (n % 2 === 0 ? -1 : 1) * 16;
      else if (x > 0.8 && n !== prevN) frame.av += (n % 2 === 0 ? -1 : 1) * 3;
      const accel = -90 * (frame.a - frame.rest) - 6.5 * frame.av;
      frame.av += accel * t;
      frame.a += frame.av * t;
    }

    if (fallen.on) {
      fallen.vy += 180 * t;
      fallen.y += fallen.vy * t;
      if (fallen.y > 54) {
        fallen.y = 54;
        fallen.vy = 0;
      }
      if (seatedMode(actor.mode)) fallen.on = false;
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= t;
      p.vy += (p.g ?? 0) * t;
      p.x += p.vx * t;
      p.y += p.vy * t;
      if (p.life <= 0 || p.y > 64) particles.splice(i, 1);
    }
    if (particles.length > 90) particles.length = 90;
    if (!calm && actor.mode === "wild" && n !== prevN) {
      particles.push({
        x: actor.x + (Math.random() - 0.5) * 8,
        y: 28,
        vx: (Math.random() - 0.5) * 30,
        vy: -16,
        life: 0.5,
        m: M.SWEAT,
        g: 110,
      });
    }
    for (let i = dons.length - 1; i >= 0; i--) {
      dons[i].life -= t;
      if (dons[i].life <= 0 && !calm) dons.splice(i, 1);
    }

    if (!calm && actor.mode === "sleep") {
      zeeAcc += t;
      if (zeeAcc > 1.7) {
        zeeAcc = 0;
        zees.push({ x: 120, y: 34, life: 2.6 });
      }
    }
    for (let i = zees.length - 1; i >= 0; i--) {
      const z = zees[i];
      z.life -= t;
      z.y -= t * 5.2;
      z.x += Math.sin(z.life * 2.4) * t * 3.6;
      if (z.life <= 0 || actor.mode !== "sleep") zees.splice(i, 1);
    }
  };

  const drawWindowLife = () => {
    for (const s of stars) {
      const tw = calm ? 1 : Math.sin(anim * (1.1 + s.s * 3.4) + s.s * 40);
      if (tw < -0.55) continue;
      const here = matBuf[(s.y + oy) * bw + s.x + ox];
      if (here === M.SKY0 || here === M.SKY1 || here === M.SKY2) {
        put(s.x, s.y, tw > 0.2 ? M.STAR : M.STAR_D);
      }
    }
    for (const l of lights) {
      const here = matBuf[(l.y + oy) * bw + l.x + ox];
      if ((here === M.BLD || here === M.BLD_F) && x >= l.thr) {
        put(l.x, l.y, M.BLD_W);
      }
    }
  };

  const drawCurtain = (x0: number, w: number, side: number) => {
    const push = waveFront(x0 + w / 2) * 2.2;
    for (let i = 0; i < w; i++) {
      const u = i / w;
      const fold = Math.sin(
        u * 12 + (calm ? 0 : Math.sin(anim * 1.3 + i * 0.5) * 0.5 + push)
      );
      const hem = 41 + Math.round(Math.sin(i * 1.7) * 0.8);
      const swing = (u * (side > 0 ? 1 : 0.4) + 0.1) * push * side;
      for (let y = 8; y < hem; y++) {
        const off = Math.round(swing * ((y - 8) / 33));
        const m =
          fold > 0.45
            ? M.CURTAIN_HI
            : fold < -0.35
            ? M.CURTAIN_D
            : M.CURTAIN;
        put(x0 + i + off, y, y >= hem - 2 ? M.CURTAIN_D : m);
      }
    }
  };

  const drawPlant = () => {
    const push = waveFront(20);
    const baseX = 20;
    const baseY = 48;
    for (let y = baseY; y > baseY - 31; y--) {
      const lean = Math.round(Math.sin((baseY - y) * 0.09) * 1.2);
      put(baseX + lean, y, M.STEM);
      put(baseX + lean + 1, y, M.LEAF_D);
    }
    LEAVES.forEach(([rise, dir, len, wid, stem], index) => {
      const sway = calm
        ? 0
        : Math.sin(anim * 1.15 + index * 1.7) * 0.035 +
          push * 0.2 * (index % 2 === 0 ? 1 : -1);
      const a = dir + sway;
      const jx = baseX + Math.round(Math.sin(rise * 0.09) * 1.2);
      const jy = baseY - rise;
      const lx = jx + Math.cos(a) * stem;
      const ly = jy - Math.sin(a) * stem;
      for (let s = 0; s <= stem; s++) {
        const u = s / stem;
        put(Math.round(mix(jx, lx, u)), Math.round(mix(jy, ly, u)), M.STEM);
      }
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const R = Math.ceil(len + wid);
      for (let dy = -R; dy <= R; dy++) {
        for (let dx = -R; dx <= R; dx++) {
          const u = dx * ca - dy * sa;
          if (u < 0 || u > len) continue;
          const sag = u * u * 0.028 * (ca >= 0 ? 1 : -1);
          const v = dx * sa + dy * ca - sag * ca;
          const t = u / len;
          const half = wid * Math.sin(Math.pow(t, 0.72) * Math.PI);
          if (Math.abs(v) > half) continue;
          const notch =
            Math.abs(v) > half * 0.55 &&
            Math.floor(u) % 4 === 3 &&
            t > 0.15;
          if (notch) continue;
          let m =
            v * (ca >= 0 ? -1 : 1) > 0.4
              ? M.LEAF_HI
              : M.LEAF;
          if (v * (ca >= 0 ? -1 : 1) < -half * 0.34) m = M.LEAF_D;
          if (Math.abs(v) < 0.5) m = M.LEAF_D;
          put(Math.round(lx + dx), Math.round(ly + dy), m);
        }
      }
    });
  };

  const drawSpeaker = () => {
    const hop = !calm && x > 0.9 && kick > 0.62 ? -1 : 0;
    const X = 32;
    const Y = 18 + hop;
    rect(X, Y, 26, 38, M.WOOD_D);
    rect(X, Y, 26, 1, M.WOOD_HI);
    rect(X, Y, 2, 38, M.WOOD);
    rect(X + 24, Y, 2, 38, M.WOOD_DD);
    rect(X + 2, Y + 2, 22, 34, M.BAFFLE);
    rect(X + 1, 56, 4, 1, M.WOOD_DD);
    rect(X + 21, 56, 4, 1, M.WOOD_DD);
    rect(X + 1, 11 + hop, 24, 7, M.METAL);
    rect(X + 1, 11 + hop, 24, 1, M.METAL_HI);
    rect(X + 3, 13 + hop, 15, 2, M.LED_OFF);
    const level = clamp(x * (calm ? 1 : 0.72 + 0.34 * kick));
    const lit = Math.round(level * 15);
    for (let i = 0; i < lit; i += 1) {
      const m = i < 8 ? M.LED_G : i < 12 ? M.LED_A : M.LED_R;
      if (i % 2 === 0) rect(X + 3 + i, 13 + hop, 1, 2, m);
      else rect(X + 3 + i, 13 + hop, 1, 2, M.LED_OFF);
    }
    disc(X + 21, 14 + hop, 2.2, (px, py) => put(px, py, M.BAFFLE));
    const dial = -2.2 + x * 4.4;
    put(
      X + 21 + Math.round(Math.sin(dial) * 2),
      14 + hop - Math.round(Math.cos(dial) * 2),
      M.METAL_HI
    );
    put(X + 3, 16 + hop, value > minVal ? M.LED_A : M.LED_OFF);

    disc(SPK_X, 26 + hop, 4.4, (px, py, d, dx, dy) => {
      if (d > 3.3) put(px, py, M.RING);
      else if (d > 1.6) put(px, py, dx + dy < 0 ? M.CONE_HI : M.CONE);
      else put(px, py, M.CAP);
    });
    const pump = value > minVal ? kick * x : 0;
    const capR = 3 + pump * 2;
    const ripple = pump * 3;
    disc(SPK_X, SPK_Y + hop, 10.4, (px, py, d, dx, dy) => {
      let m: number;
      if (d > 9.3) m = M.RING;
      else if (d > 8.2) m = dx + dy < 0 ? M.CONE_HI : M.CONE_D;
      else if (d > capR) {
        const band = (d + ripple) % 3;
        m = band < 1 ? M.CONE_D : dx + dy < -4 ? M.CONE_HI : M.CONE;
      } else {
        m = dx + dy < 0 ? M.METAL_HI : M.CAP;
      }
      put(px, py, m);
    });
    for (const [sx, sy] of [
      [-10, -10],
      [10, -10],
      [-10, 11],
      [10, 11],
    ])
      put(SPK_X + sx, SPK_Y + sy + hop, M.METAL);
  };

  const drawBooks = () => {
    for (const b of books) {
      if (fallen.on && b === fallBook) continue;
      const push = waveFront(b.x) * (x > 0.75 ? 2.2 : 1);
      const hopNow = calm
        ? 0
        : Math.round(push * (0.6 + ((b.id * 7) % 5) * 0.2));
      const ty = b.y - b.h - hopNow;
      rect(b.x, ty, b.w, b.h, b.m);
      rect(b.x, ty, 1, b.h, b.m);
      if (b.w > 2) rect(b.x + b.w - 1, ty, 1, b.h, M.BK_D);
      if (b.band) rect(b.x, ty + 1, b.w, 1, M.BK_HI);
      else if (b.w > 2) put(b.x + 1, ty + 2, M.BK_HI);
    }
    if (fallen.on) {
      const y = Math.round(fallen.y);
      rect(fallBook.x, y, fallBook.h, 2, fallBook.m);
      rect(fallBook.x, y, fallBook.h, 1, M.BK_HI);
    }
  };

  const drawLamp = () => {
    const on = lampNow > 0.5;
    const push = waveFront(LAMP_X);
    const lean = calm
      ? 0
      : Math.round(push * (x > 0.75 ? 1.4 : 0.4) * (halfCount % 2 ? 1 : -1));
    rect(LAMP_X - 4, 55, 9, 2, M.POLE);
    rect(LAMP_X - 3, 55, 7, 1, M.POLE_HI);
    rect(LAMP_X, 22, 1, 33, M.POLE);
    for (let i = 0; i < 11; i++) {
      const y = 11 + i;
      const half = Math.round(4 + i * 0.32);
      for (let dx = -half; dx <= half; dx++) {
        const e = Math.abs(dx) / half;
        let m: number;
        if (on) {
          const hot = i / 11 - e * 0.55 + bayerAt(dx + 8, y) / 40;
          m =
            i === 10
              ? M.BULB
              : hot > 0.44
              ? M.SHADE_HOT
              : hot > 0.04
              ? M.SHADE_ON
              : M.SHADE_RIM;
        } else {
          m = e > 0.66 ? M.SHADE_D : M.SHADE;
        }
        put(LAMP_X + dx + lean, y, m);
      }
    }
  };

  const drawFrame = () => {
    const angle = (frame.a * Math.PI) / 180;
    const ca = Math.cos(angle);
    const sa = Math.sin(angle);
    const reach = FRAME_W + 4;
    const artAt = (px: number, py: number) => {
      const dx = px + 0.5 - FRAME_X;
      const dy = py + 0.5 - FRAME_Y;
      const iu = Math.floor(ca * dx + sa * dy + FRAME_W / 2);
      const iv = Math.floor(-sa * dx + ca * dy - 2);
      return iu >= 0 && iu < FRAME_W && iv >= 0 && iv < FRAME_H
        ? iv * FRAME_W + iu
        : -1;
    };
    for (let y = FRAME_Y - 1; y < FRAME_Y + FRAME_H + 8; y++) {
      for (let px = FRAME_X - reach; px <= FRAME_X + reach; px++) {
        if (artAt(px, y) >= 0) continue;
        if (artAt(px - 1, y - 1) >= 0) {
          put(px, y, M.FRAME_SH);
          continue;
        }
        const dx = px + 0.5 - FRAME_X;
        const dy = y + 0.5 - FRAME_Y;
        const u = ca * dx + sa * dy;
        const v = -sa * dx + ca * dy;
        if (v >= 0 && v < 2 && Math.abs(Math.abs(u) - v * 3.2) < 0.7)
          put(px, y, M.WIRE);
      }
    }
    for (let y = FRAME_Y; y < FRAME_Y + FRAME_H + 8; y++) {
      for (let px = FRAME_X - reach; px <= FRAME_X + reach; px++) {
        const at = artAt(px, y);
        if (at >= 0) put(px, y, art[at]);
      }
    }
    put(FRAME_X, FRAME_Y, M.WOOD_DD);
  };

  const drawRecord = () => {
    const turning = value > minVal && !calm;
    rect(190, 33, 11, 2, M.CONE_D);
    rect(191, 32, 9, 1, M.CONE_D);
    const at = turning ? Math.floor(anim * 16) % 9 : 3;
    put(191 + at, 32, M.CONE_HI);
    put(190 + ((at + 5) % 11), 33, M.CONE_HI);
    rect(195, 33, 2, 1, M.BK_A);
    const jump = nb.hit > 0 ? 1 : 0;
    rect(199, 31 - jump, 4, 1, M.METAL_HI);
    put(202, 32, M.METAL);
    put(202, 33, M.METAL);
    put(199, 32 - jump, M.METAL);
    put(200, 36, value > minVal ? M.LED_A : M.LED_OFF);
  };

  const drawBall = () => {
    if (ballDrop < 0.02) return;
    const cy = Math.round(mix(0, 15, ballDrop));
    const swing = calm
      ? 0
      : Math.round(Math.sin(anim * 1.6) * (isMax() ? 1.6 : 0.6));
    const bx = BALL_X + swing;
    for (let y = 3; y < cy - 3; y++) put(y < cy - 8 ? BALL_X : bx, y, M.WIRE);
    if (cy < 4) return;
    disc(bx, cy, 4.3, (px, py, d, dx, dy) => {
      const lon = Math.floor(dx * 0.9 + spin * 6);
      const lat = dy;
      const check = (lon + lat) & 1;
      const glint =
        !calm &&
        Math.sin(lon * 12.9 + lat * 78.2 + Math.floor(spin * 10)) > 0.8;
      let m = check ? M.BALL : M.BALL_D;
      if (glint || (dx < -1 && dy < -1 && d < 3.2)) m = M.BALL_HI;
      put(px, py, m);
    });
  };

  const addCone = (
    sx: number,
    lean: number,
    spread: number,
    ci: number
  ) => {
    for (let y = 6; y <= 66; y++) {
      const dy = y - 5;
      const cx = sx + lean * dy;
      let half = 1.5 + spread * dy;
      if (y > 57)
        half *= Math.sqrt(Math.max(0, 1 - Math.pow((y - 57) / 9.5, 2)));
      const x0 = Math.ceil(cx - half);
      const x1 = Math.floor(cx + half);
      for (let wx = x0; wx <= x1; wx++) {
        if (wx >= WALL_X) continue;
        const px = wx + ox;
        const py = y + oy;
        if (px < 0 || py < 0 || px >= bw || py >= bh) continue;
        const th = bayerAt(px, py) / 16;
        if (th > party) continue;
        const edge = half - Math.abs(wx - cx);
        if (edge < 2 && th > edge / 2) continue;
        tintBuf[py * bw + px] = ci + 1;
      }
    }
  };

  const drawParty = () => {
    if (party < 0.02) return;
    const t = calm ? 1.2 : anim;
    const pump = 1 + kick * 0.14;
    const fast = isMax() ? 1.7 : 1;
    addCone(90, Math.sin(t * 0.71 * fast) * 0.8, 0.24 * pump, 0);
    addCone(172, Math.sin(t * 0.63 * fast + 4) * 0.62, 0.25 * pump, 1);
    if (isMax())
      addCone(130, Math.sin(t * 0.53 * fast + 2) * 0.72, 0.22 * pump, 2);
    for (const fx of [90, 130, 172]) {
      rect(fx - 1, 5, 3, 1, M.BAFFLE);
      put(fx, 6, M.LED_A);
    }
    if (ballDrop > 0.5) {
      for (const d of dots) {
        const a = d.lon + (calm ? 0 : spin);
        const facing = Math.cos(a);
        if (facing < 0.05) continue;
        const px = Math.round(BALL_X + Math.sin(a) * 128 * Math.cos(d.lat));
        const py = Math.round(28 + Math.sin(d.lat) * 34 + facing * 8);
        if (px >= WALL_X - 1 || py < 5 || py > 65) continue;
        const here = matBuf[(py + oy) * bw + px + ox];
        if (here === M.SKY0 || here === M.SKY1 || here === M.SKY2) continue;
        put(px, py, d.m);
        if (d.big) {
          put(px + 1, py, d.m);
          put(px, py + 1, d.m);
          put(px + 1, py + 1, d.m);
        }
      }
    }
  };

  const plotWave = (wx: number, wy: number, m: number) => {
    const py = Math.round(wy);
    if (py < 4 || py > 66) return;
    const px = Math.round(wx);
    if (px >= WALL_X) return;
    put(px, py, m);
  };

  const drawWaves = () => {
    if (value <= minVal) return;
    const reach = waveReach();
    const arc = (
      r: number,
      p: number,
      m: number,
      drop0: number
    ) => {
      const fade = clamp(r / reach);
      const span = 0.44 + p * 0.74;
      const step = 0.72 / Math.max(r, 6);
      for (let a = -span; a <= span; a += step) {
        const wx = SPK_X + Math.cos(a) * r;
        const wy = SPK_Y + Math.sin(a) * r * 0.94;
        const edge = Math.abs(a) / span;
        const drop =
          drop0 +
          fade * fade * fade * 0.8 +
          edge * edge * edge * edge * 0.7;
        if (bayerAt(Math.round(wx) + ox, Math.round(wy) + oy) / 16 < drop)
          continue;
        plotWave(wx, wy, m);
      }
    };
    const ring = (r: number, p: number) => {
      if (r < 4) return;
      const fade = clamp(r / reach);
      const m =
        fade < 0.3 ? M.WAVE_HI : fade < 0.72 ? M.WAVE : M.WAVE_D;
      const thick = 1 + Math.round(p * 2.2);
      for (let i = thick - 1; i >= 0; i--) {
        arc(
          r - i,
          p,
          i === 0 ? m : fade < 0.5 ? M.WAVE : M.WAVE_D,
          i === 0 ? 0 : 0.05 * i
        );
      }
      if (p > 0.34) arc(r - thick - 1, p, M.WAVE_D, 0.32);
      if (p > 0.66) arc(r - thick - 3, p, M.WAVE_D, 0.6);
    };

    if (calm) {
      const count = Math.max(1, Math.ceil(x * 9));
      for (let i = 0; i < count; i++) {
        ring(10 + ((i + 0.4) / count) * reach * 0.94, x);
      }
      return;
    }
    for (const w of waves) ring(w.r, w.p);
    if (x > 0.3) {
      for (const w of waves) {
        if (w.r > 26) continue;
        for (let a = -0.5; a <= 0.5; a += 0.75 / Math.max(w.r, 6)) {
          const wx = SPK_X - Math.cos(a) * w.r;
          const wy = SPK_Y + Math.sin(a) * w.r * 0.9;
          if (
            bayerAt(Math.round(wx) + ox, Math.round(wy) + oy) / 16 <
            w.r / 26
          )
            continue;
          plotWave(wx, wy, M.WAVE_D);
        }
      }
    }
  };

  const TMP = 80;
  const tmp = new Uint8Array(TMP * TMP);
  const tput = (tx: number, ty: number, m: number) => {
    const ix = Math.round(tx) + 40;
    const iy = Math.round(ty) + 66;
    if (ix < 0 || iy < 0 || ix >= TMP || iy >= TMP) return;
    tmp[iy * TMP + ix] = m;
  };
  const tblock = (
    tx: number,
    ty: number,
    w: number,
    h: number,
    m: number
  ) => {
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) tput(tx + i, ty + j, m);
    }
  };
  const tline = (
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    w: number,
    m: number
  ) => {
    const steps = Math.max(
      1,
      Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)))
    );
    const off = (w - 1) >> 1;
    for (let s = 0; s <= steps; s++) {
      const u = s / steps;
      tblock(
        Math.round(mix(x0, x1, u)) - off,
        Math.round(mix(y0, y1, u)) - off,
        w,
        w,
        m
      );
    }
  };

  const RES = {
    H: M.HAIR,
    h: M.HAIR_HI,
    S: M.SKIN,
    D: M.SKIN_D,
    E: M.EYE,
    C: M.CHEEK,
    O: M.MOUTH,
    T: M.SHIRT,
    TD: M.SHIRT_D,
    TS: M.STRIPE,
    P: M.PANTS,
    PD: M.PANTS_D,
    B: M.SHOE,
  };
  const NEXT = {
    H: M.NB_HAIR,
    h: M.NB_HAIR,
    S: M.NB_SKIN,
    D: M.NB_SKIN_D,
    E: M.EYE,
    C: M.NB_SKIN_D,
    O: M.EYE,
    T: M.NB_SHIRT,
    TD: M.NB_SHIRT_D,
    TS: M.NB_STRIPE,
    P: M.NB_PANTS,
    PD: M.NB_PANTS_D,
    B: M.NB_SHOE,
  };

  const headTo = (
    nx: number,
    ny: number,
    set: typeof RES,
    a: typeof attr
  ) => {
    const left = nx - 6;
    const headTop = ny - 10;
    for (const [i, j, ch] of HEAD_CELLS) {
      let m = -1;
      if (ch === "H") m = set.H;
      else if (ch === "h") m = set.h;
      else if (ch === "S") m = set.S;
      else if (ch === "C") m = set.C;
      else if (ch === "1") m = a.eyes === 0 || a.eyes === 2 ? set.E : set.S;
      else if (ch === "2") m = a.eyes === 0 || a.eyes === 1 ? set.E : set.S;
      else if (ch === "3") m = a.mouth === 1 ? set.O : set.D;
      else if (ch === "4") m = a.mouth === 1 ? set.O : set.S;
      if (m >= 0) tput(left + i, headTop + j, m);
    }
    if (a.phones === 1) {
      tblock(left + 3, headTop - 1, 6, 1, M.PHONE_D);
      tput(left + 2, headTop, M.PHONE_D);
      tput(left + 9, headTop, M.PHONE_D);
      tput(left + 1, headTop + 1, M.PHONE_D);
      tblock(left + 1, headTop + 2, 1, 2, M.PHONE_D);
      tblock(left + 2, headTop + 4, 3, 4, M.PHONE);
      tblock(left + 1, headTop + 5, 1, 2, M.PHONE_D);
    } else if (a.phones === 2) {
      tblock(left + 3, headTop + 10, 7, 1, M.PHONE_D);
      tblock(left + 2, headTop + 9, 2, 2, M.PHONE);
      tblock(left + 8, headTop + 9, 2, 2, M.PHONE);
    }
  };

  const stampPuppet = (
    wx: number,
    wy: number,
    p: Float32Array,
    f: number,
    set: typeof RES,
    a: typeof attr
  ) => {
    tmp.fill(0);
    const hipX = p[0];
    const hipY = p[1];
    const chX = hipX + p[2];
    const chY = hipY + p[3];
    const shX = chX;
    const shY = chY + 1;
    const nX = chX + p[4];
    const nY = chY + p[5];

    const arm = (i: number, dark: boolean) => {
      const ex = shX + p[i];
      const ey = shY + p[i + 1];
      const hx = shX + p[i + 2];
      const hy = shY + p[i + 3];
      tline(shX, shY, ex, ey, 2, dark ? set.TD : set.T);
      tline(ex, ey, hx, hy, 2, dark ? set.D : set.S);
      tblock(
        Math.round(hx) - 1,
        Math.round(hy) - 1,
        2,
        2,
        dark ? set.D : set.S
      );
    };
    const leg = (i: number, dark: boolean, toe: boolean) => {
      const kx = hipX + p[i];
      const ky = hipY + p[i + 1];
      const fx = hipX + p[i + 2];
      const fy = hipY + p[i + 3];
      tline(hipX, hipY, kx, ky, 3, dark ? set.PD : set.P);
      tline(kx, ky, fx, fy, 3, dark ? set.PD : set.P);
      const sx = Math.round(fx) - 1;
      const sy = Math.round(fy);
      if (toe) {
        tblock(sx, sy - 1, 3, 2, set.B);
        tblock(sx + 3, sy - 2, 2, 1, set.B);
        tput(sx + 2, sy - 2, set.B);
      } else {
        tblock(sx, sy - 1, 5, 2, set.B);
        tput(sx + 1, sy - 2, set.B);
      }
    };

    arm(10, true);
    leg(18, true, false);
    tblock(Math.round(hipX) - 4, Math.round(hipY) - 1, 8, 3, set.P);
    const steps = Math.max(
      1,
      Math.ceil(Math.max(Math.abs(chX - hipX), Math.abs(chY - hipY)))
    );
    for (let s = 0; s <= steps; s++) {
      const u = s / steps;
      const cx = Math.round(mix(hipX, chX, u));
      const cy = Math.round(mix(hipY - 1, chY + 1, u));
      const m = s % 3 === 1 ? set.TS : set.T;
      tblock(cx - 4, cy - 1, 8, 2, m);
      tblock(cx - 4, cy - 1, 1, 2, set.TD);
    }
    tput(chX, chY, set.S);
    leg(14, false, a.toeUp === 1);
    tblock(Math.round(nX) - 1, Math.round(nY) - 1, 3, 2, set.D);
    headTo(Math.round(nX), Math.round(nY), set, a);
    if (a.book === 1) {
      const hx = Math.round(shX + p[8]);
      const hy = Math.round(shY + p[9]);
      tblock(hx - 3, hy - 5, 8, 6, M.BK_T);
      tblock(hx - 2, hy - 6, 6, 1, M.BK_HI);
      tblock(hx - 3, hy - 5, 1, 6, M.BK_D);
      tblock(hx + 1, hy - 5, 1, 6, M.BK_D);
      if (a.flip > 0) {
        const fx = Math.round(mix(hx + 4, hx - 3, 1 - a.flip / 0.42));
        tblock(fx, hy - 6, 1, 5, M.BK_HI);
      }
    }
    arm(6, false);

    const X0 = Math.round(wx);
    const Y0 = Math.round(wy);
    for (let iy = 0; iy < TMP; iy++) {
      for (let ix = 0; ix < TMP; ix++) {
        if (!tmp[iy * TMP + ix]) continue;
        const sx = ix - 40;
        const sy = iy - 66;
        if (ix === 0 || !tmp[iy * TMP + ix - 1])
          put(X0 + (f > 0 ? sx - 1 : -sx + 1), Y0 + sy, M.OUTLINE);
        if (ix === TMP - 1 || !tmp[iy * TMP + ix + 1])
          put(X0 + (f > 0 ? sx + 1 : -sx - 1), Y0 + sy, M.OUTLINE);
        if (iy === 0 || !tmp[(iy - 1) * TMP + ix])
          put(X0 + (f > 0 ? sx : -sx), Y0 + sy - 1, M.OUTLINE);
        if (iy === TMP - 1 || !tmp[(iy + 1) * TMP + ix])
          put(X0 + (f > 0 ? sx : -sx), Y0 + sy + 1, M.OUTLINE);
      }
    }
    for (let iy = 0; iy < TMP; iy++) {
      for (let ix = 0; ix < TMP; ix++) {
        const m = tmp[iy * TMP + ix];
        if (!m) continue;
        put(X0 + (f > 0 ? ix - 40 : -(ix - 40)), Y0 + iy - 66, m);
      }
    }
  };

  const drawSleeper = () => {
    const breath = calm ? 0.5 : 0.5 + 0.5 * Math.sin(anim * 1.55);
    const rise = Math.round(breath * 1.4);
    const fx = 103;
    const fy = 36;
    for (const [i, j, ch] of SLEEP_FACE) {
      let m = M.MOON_SKIN;
      if (ch === "H") m = M.MOON_HAIR;
      else if (ch === "E") m = M.MOON_EYE;
      else if (ch === "C") m = M.MOON_SKIN_D;
      else if (ch === "M") m = M.MOON_SKIN_D;
      put(fx + i, fy + j, m);
    }
    const X0 = 114;
    const X1 = 136;
    for (let wx = X0; wx <= X1; wx++) {
      const u = (wx - X0) / (X1 - X0);
      const hump =
        Math.sin(Math.min(u * 1.22, 1) * Math.PI) * 5.5 +
        2 +
        (u < 0.45 ? rise : 0) +
        (u > 0.8 ? 1 : 0);
      const ty = Math.round(48 - hump);
      put(wx, ty - 1, M.OUTLINE);
      for (let y = ty; y <= 49; y++) {
        const stripe = (wx + y * 2) % 9 < 3;
        put(wx, y, y === ty ? M.BLANKET_HI : stripe ? M.BLANKET_D : M.BLANKET);
      }
    }
    for (let wx = X0 + 2; wx < X1; wx++)
      put(wx, 50 + ((wx * 3) % 5 === 0 ? 1 : 0), M.BLANKET_D);
    const size = calm ? 1.8 : breath > 0.12 ? 0.8 + breath * 1.8 : 0;
    if (size > 0) {
      const bx = fx + 11 + Math.round(size);
      const by = fy + 3 - Math.round(size);
      disc(bx, by, size + 0.4, (px, py, d, dx, dy) => {
        if (d > size - 0.6) put(px, py, M.BUBBLE);
        else if (dx === -1 && dy === -1) put(px, py, M.BUBBLE);
      });
    }
    if (calm) {
      glyph(G_Z, 118, 26, M.ZEE);
      glyph(G_Z_SMALL, 113, 20, M.ZEE);
    } else {
      for (const z of zees) {
        const rows = z.life > 1.5 ? G_Z_SMALL : G_Z;
        if (z.life < 0.5 && Math.floor(z.life * 12) % 2 === 0) continue;
        glyph(rows, Math.round(z.x), Math.round(z.y), M.ZEE);
      }
    }
  };

  const drawActor = () => {
    const mode = actor.startle > 0 ? "startle" : actor.mode;
    if (mode === "sleep" && actor.tween >= 1) {
      drawSleeper();
      lastPose = poseFor("sleep");
      return;
    }
    const target = poseFor(mode);
    let pose = target;
    if (actor.from && actor.tween < 1) {
      const e = actor.tween * actor.tween * (3 - 2 * actor.tween);
      pose = new Float32Array(22);
      for (let i = 0; i < 22; i++) {
        pose[i] = mix(actor.from[i], target[i], e);
      }
    }
    lastPose = pose;
    rect(130, 44, 7, 3, M.BLANKET);
    rect(130, 44, 7, 1, M.BLANKET_HI);
    stampPuppet(actor.x, FLOOR_Y, pose, actor.facing, RES, attr);
    if (mode === "startle") {
      glyph(G_MARK, Math.round(actor.x) + 6, FLOOR_Y - 38, M.DON, M.OUTLINE);
    }
  };

  const drawNeighbor = () => {
    const a = {
      eyes: 0,
      mouth: 0,
      phones: 0,
      book: 0,
      toeUp: 0,
      flip: -1,
    };
    if (nb.mode === "bed") {
      for (let wx = 230; wx < 250; wx++) {
        const u = (wx - 230) / 20;
        const hump = Math.round(Math.sin(u * Math.PI) * 4 + 2);
        for (let y = 46 - hump; y < 50; y++) {
          put(wx, y, y === 46 - hump ? M.NB_BED_HI : M.NB_BED);
        }
      }
      rect(225, 40, 6, 4, M.NB_HAIR);
      rect(227, 42, 4, 2, M.NB_SKIN);
      return;
    }
    if (nb.mode === "up") {
      a.eyes = 0;
      const p = poseOf(
        0,
        -12,
        0,
        -9,
        0,
        -1,
        [3, 4, 5, 2],
        [2, 5, 5, 3],
        [1, 6, 1, 12],
        [-1, 6, -1, 12]
      );
      stampPuppet(226, FLOOR_Y, p, -1, NEXT, a);
      return;
    }
    a.eyes = 1;
    const hit = nb.hit > 0.03 ? 1 : 0;
    const back = calm ? 0.5 : hit;
    const p = poseOf(
      0,
      -12,
      1 * back,
      -9,
      1 * back,
      -1,
      [4, -2, 4 + 3 * back, -5],
      [-1, 5, -1, 9],
      [2, 6, 2, 12],
      [-2, 6, -2, 12]
    );
    stampPuppet(224, FLOOR_Y, p, -1, NEXT, a);
    if (hit || calm) {
      const hitX = WALL_X + 9;
      for (const [dx, dy] of SPARKS) put(hitX + dx, 36 + dy, M.BURST);
    }
  };

  const drawDons = () => {
    for (const d of dons) {
      const jolt = !calm && d.life > 0.4 ? -1 : 0;
      glyph(G_DO, d.x, d.y + jolt, M.DON, M.OUTLINE);
      glyph(G_N, d.x + 11, d.y + jolt, M.DON, M.OUTLINE);
    }
  };

  const drawMotes = () => {
    if (lampNow < 0.5 || calm) return;
    for (let i = 0; i < 9; i++) {
      const s = i * 37.3;
      const wx = LAMP_X - 22 + ((s * 7 + anim * (1.5 + (i % 3))) % 44);
      const wy = 26 + ((s * 3 + anim * (0.9 + (i % 2) * 0.7)) % 28);
      if (bayerAt(Math.round(wx), Math.round(wy)) > 8) continue;
      put(Math.round(wx), Math.round(wy), M.MOTE);
    }
  };

  const buildBase = () => {
    for (let py = 0; py < bh; py++) {
      for (let px = 0; px < bw; px++) {
        matBuf[py * bw + px] = roomAt(px - ox, py - oy);
      }
    }
    paintRug();
    paintDoor();
    paintWindow();
    paintShelf();
    paintPot();
    paintSofa();
    paintCabinet();
    paintNextRoom();
    rect(FRAME_X - FRAME_W / 2, FRAME_Y + 2, FRAME_W, FRAME_H, M.WALL_HI);
    baseBuf.set(matBuf);
    buildLight();
  };

  let glowRaw = new Float32Array(1);
  let glowNearBuf = new Float32Array(1);
  let glowFarBuf = new Float32Array(1);
  let glowTemp = new Float32Array(1);
  const GRID_W = 96;
  let GRID_H = 36;

  const renderWorld = () => {
    matBuf.set(baseBuf);
    tintBuf.fill(0);
    drawWindowLife();
    drawCurtain(95, 9, 1);
    drawCurtain(134, 9, -1);
    drawPlant();
    drawSpeaker();
    drawBooks();
    drawFrame();
    drawRecord();
    drawLamp();
    drawBall();
    drawParty();
    drawWaves();
    drawNeighbor();
    drawMotes();
    drawActor();
    drawDons();
    for (const p of particles) put(Math.round(p.x), Math.round(p.y), p.m);

    const warm = smoothstep(0.22, 0.42, x);
    const maxNow = isMax() ? 1 : 0;
    let amb = mix(0.03, 0.88, warm);
    amb = mix(amb, 0.56, party);
    amb += maxNow * kick * 0.16;
    const lamp = lampNow * mix(0.82, 0.34, warm);
    const nextLight = 0.17 + nb.light * 0.46;

    const size = bw * bh;
    glowRaw.fill(0);
    for (let i = 0; i < size; i++) {
      const m = matBuf[i];
      const L =
        amb * ceilMap[i] +
        lamp * lampMap[i] +
        moonMap[i] +
        nextLight * nextMap[i];
      const lf = L * 7;
      let lv = lf | 0;
      const frac = lf - lv;
      if (frac > 0.42 && (frac >= 0.58 || (frac - 0.42) / 0.16 > thrBuf[i]))
        lv += 1;
      if (lv > 7) lv = 7;
      const tint = tintBuf[i];
      const id = tint
        ? tintTable[(m * 3 + tint - 1) * 8 + lv]
        : litTable[m * 8 + lv];
      const c = palette32[id];
      pixels[i] = c;
      const w = glowOf[m];
      if (w > 0) {
        const at = gridOf[i];
        glowRaw[at] += (c & 255) * w * emitScale;
        glowRaw[at + 1] += ((c >>> 8) & 255) * w * emitScale;
        glowRaw[at + 2] += ((c >>> 16) & 255) * w * emitScale;
      }
    }
  };

  const boxBlur = (
    src: Float32Array,
    dst: Float32Array,
    w: number,
    h: number,
    r: number
  ) => {
    const size = r * 2 + 1;
    for (let y = 0; y < h; y++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let i = -r; i <= r; i++) {
          sum += src[y * w * 4 + clamp(i, 0, w - 1) * 4 + c];
        }
        for (let i = 0; i < w; i++) {
          dst[y * w * 4 + i * 4 + c] = sum / size;
          sum +=
            src[y * w * 4 + clamp(i + r + 1, 0, w - 1) * 4 + c] -
            src[y * w * 4 + clamp(i - r, 0, w - 1) * 4 + c];
        }
      }
    }
    for (let i = 0; i < w; i++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let j = -r; j <= r; j++) {
          sum += dst[clamp(j, 0, h - 1) * w * 4 + i * 4 + c];
        }
        for (let j = 0; j < h; j++) {
          src[j * w * 4 + i * 4 + c] = sum / size;
          sum +=
            dst[clamp(j + r + 1, 0, h - 1) * w * 4 + i * 4 + c] -
            dst[clamp(j - r, 0, h - 1) * w * 4 + i * 4 + c];
        }
      }
    }
  };

  // WebGL context setup
  let gl: WebGL2RenderingContext | null = null;
  try {
    gl = canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "high-performance",
    });
  } catch {
    gl = null;
  }

  let program: WebGLProgram | null = null;
  const loc: Record<string, WebGLUniformLocation | null> = {};
  let vao: WebGLVertexArrayObject | null = null;
  let quad: WebGLBuffer | null = null;
  let texWorld: WebGLTexture | null = null;
  let texGlow: WebGLTexture | null = null;
  let bakeProgram: WebGLProgram | null = null;
  const bakeLoc: Record<string, WebGLUniformLocation | null> = {};
  let bakeTarget: WebGLFramebuffer | null = null;
  let texBase: WebGLTexture | null = null;
  let texWeight: WebGLTexture | null = null;

  const compile = (type: number, source: string) => {
    if (!gl) throw new Error("no gl");
    const s = gl.createShader(type)!;
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(s) || "shader compile error");
    }
    return s;
  };

  const link = (fragSource: string) => {
    if (!gl) throw new Error("no gl");
    const made = gl.createProgram()!;
    const v = compile(gl.VERTEX_SHADER, VERT);
    const f = compile(gl.FRAGMENT_SHADER, fragSource);
    gl.attachShader(made, v);
    gl.attachShader(made, f);
    gl.bindAttribLocation(made, 0, "aPos");
    gl.linkProgram(made);
    gl.deleteShader(v);
    gl.deleteShader(f);
    if (!gl.getProgramParameter(made, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(made) || "link error");
    }
    return made;
  };

  const setupGl = () => {
    if (!gl) return false;
    try {
      program = link(FRAG);
      bakeProgram = link(BAKE_FRAG);
    } catch (error) {
      console.warn("slider-resident: WebGL shader build failed, fallback to 2D", error);
      return false;
    }
    gl.useProgram(program);
    for (const name of [
      "uWorld",
      "uGlow",
      "uBase",
      "uWeight",
      "uRes",
      "uPill",
      "uOrigin",
      "uWorldSize",
      "uGlowSize",
      "uShift",
      "uLens",
      "uLensR",
      "uK",
      "uLift",
      "uWobble",
      "uTime",
      "uAlbedo",
      "uEnvHi",
      "uEnvLo",
      "uInk",
      "uGround",
    ]) {
      loc[name] = gl.getUniformLocation(program, name);
    }
    for (const name of [
      "uRes",
      "uPill",
      "uBezel",
      "uCorner",
      "uAlbedo",
      "uEnvHi",
      "uEnvLo",
      "uInk",
    ]) {
      bakeLoc[name] = gl.getUniformLocation(bakeProgram, name);
    }
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    );
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

    const makeTex = () => {
      if (!gl) return null;
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    };

    texWorld = makeTex();
    texGlow = makeTex();
    gl.activeTexture(gl.TEXTURE2);
    texBase = makeTex();
    gl.activeTexture(gl.TEXTURE3);
    texWeight = makeTex();

    gl.uniform1i(loc.uWorld, 0);
    gl.uniform1i(loc.uGlow, 1);
    gl.uniform1i(loc.uBase, 2);
    gl.uniform1i(loc.uWeight, 3);
    gl.disable(gl.BLEND);

    for (const [unit, tex] of [
      [gl.TEXTURE2, texBase],
      [gl.TEXTURE3, texWeight],
    ] as const) {
      gl.activeTexture(unit);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA8,
        1,
        1,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null
      );
    }
    bakeTarget = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, bakeTarget);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texBase,
      0
    );
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT1,
      gl.TEXTURE_2D,
      texWeight,
      0
    );
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    const complete =
      gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    if (!complete) {
      console.warn("slider-resident: Framebuffer incomplete, fallback to 2D");
      return false;
    }
    needBake = true;
    return true;
  };

  let ready = setupGl();
  let lost = !ready && !!gl && gl.isContextLost();
  let ctx2d: CanvasRenderingContext2D | null = null;
  let lowCanvas: HTMLCanvasElement | OffscreenCanvas | null = null;

  const useCanvas2d = () => {
    canvas.remove();
    canvas = document.createElement("canvas");
    canvas.className = "scene";
    canvas.setAttribute("aria-hidden", "true");
    slot.appendChild(canvas);
    ctx2d = canvas.getContext("2d");
  };
  if (!ready && !lost) useCanvas2d();

  const shape = {
    W: 1,
    H: 1,
    dpr: 1,
    pillW: 1,
    pillH: 1,
    bezel: 1,
    winW: 1,
    winH: 1,
    corner: 1,
    lensHX: 1,
    lensHY: 1,
    travel: 1,
    ox: 0,
    oy: 0,
  };
  let renderScale = 1;
  let fullK = 1;

  const pickK = (winH: number) => {
    const whole = Math.max(1, Math.floor(winH / CORE_H));
    return ((whole + 1) * CORE_H) / winH <= 1.08 ? whole + 1 : whole;
  };

  const measure = () => {
    const box = root.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) return false;

    const fullDpr = Math.min(2, window.devicePixelRatio || 1);
    const nextFullK = pickK(
      (Math.round(box.height * fullDpr) / 1.4) * (1 - 0.068 * 2)
    );
    if (nextFullK !== fullK) {
      fullK = nextFullK;
      renderScale = 1;
    }
    const dpr = fullDpr * renderScale;
    const W = Math.max(2, Math.round(box.width * dpr));
    const H = Math.max(2, Math.round(box.height * dpr));
    const changed = W !== shape.W || H !== shape.H;
    shape.W = W;
    shape.H = H;
    shape.dpr = dpr;

    shape.pillH = H / 1.4;
    shape.pillW = shape.pillH * PILL_RATIO;
    shape.bezel = shape.pillH * 0.068;
    shape.winW = shape.pillW - shape.bezel * 2;
    shape.winH = shape.pillH - shape.bezel * 2;

    const pillCss = shape.pillH / dpr;
    shape.corner = Math.min(
      shape.pillH / 2,
      cornerPx * dpr * Math.max(1, pillCss / 120)
    );
    shape.lensHX = shape.pillH * 0.36;
    shape.lensHY = shape.pillH * 0.52;
    shape.travel = shape.pillW - shape.pillH;

    canvas.style.width = `${W / dpr}px`;
    canvas.style.height = `${H / dpr}px`;
    const deviceDpr = window.devicePixelRatio || 1;
    const enlarged = deviceDpr > dpr;
    canvas.style.imageRendering = enlarged ? "pixelated" : "";
    const grid = enlarged ? deviceDpr : dpr;
    const fx = (box.left * grid) % 1;
    const fy = (box.top * grid) % 1;
    canvas.style.transform = `translate(${-fx / grid}px, ${-fy / grid}px)`;

    const thumb = (shape.lensHX * 2) / dpr;
    const rangeW = shape.travel / dpr + thumb;
    root.style.setProperty("--thumb", `${thumb}px`);
    input.style.width = `${rangeW}px`;
    input.style.height = `${pillCss}px`;
    input.style.left = `${(box.width - rangeW) / 2}px`;
    input.style.top = `${(box.height - pillCss) / 2}px`;
    input.style.borderRadius = `${shape.corner / dpr}px`;
    shade.style.width = `${shape.pillW / dpr}px`;
    shade.style.height = `${pillCss}px`;
    shade.style.left = `${(box.width - shape.pillW / dpr) / 2}px`;
    shade.style.top = `${(box.height - pillCss) / 2}px`;
    shade.style.borderRadius = `${shape.corner / dpr}px`;

    if (!changed) return false;
    canvas.width = W;
    canvas.height = H;

    k = Math.max(1, Math.round(fullK * renderScale));
    const needW = Math.ceil(shape.winW / k) + MARGIN * 2;
    const needH = Math.ceil(shape.winH / k) + MARGIN * 2;
    bw = needW + (needW & 1);
    bh = needH + (needH & 1);
    ox = (bw - CORE_W) >> 1;
    oy = Math.round((bh - CORE_H) * 0.54);
    const size = bw * bh;
    matBuf = new Uint8Array(size);
    baseBuf = new Uint8Array(size);
    tintBuf = new Uint8Array(size);
    pixels = new Uint32Array(size);
    pixelBytes = new Uint8Array(pixels.buffer);
    thrBuf = new Float32Array(size);
    ceilMap = new Float32Array(size);
    lampMap = new Float32Array(size);
    moonMap = new Float32Array(size);
    nextMap = new Float32Array(size);
    gridOf = new Int32Array(size);
    for (let y = 0; y < bh; y++) {
      for (let wx = 0; wx < bw; wx++) {
        thrBuf[y * bw + wx] = (bayerAt(wx, y) + 0.5) / 16;
      }
    }

    shape.ox = Math.floor(W / 2 - (bw * k) / 2);
    shape.oy = Math.floor(H / 2 + (bh * k) / 2);

    GRID_H = Math.max(8, Math.round((GRID_W * H) / W));
    const cells = GRID_W * GRID_H * 4;
    glowRaw = new Float32Array(cells);
    glowNearBuf = new Float32Array(cells);
    glowFarBuf = new Float32Array(cells);
    glowTemp = new Float32Array(cells);
    const cellW = W / GRID_W;
    const cellH = H / GRID_H;
    emitScale = ((k * k) / (cellW * cellH)) * (2.1 / 255);
    for (let y = 0; y < bh; y++) {
      for (let wx = 0; wx < bw; wx++) {
        const sx = shape.ox + (wx + 0.5) * k;
        const sy = H - shape.oy + (y + 0.5) * k;
        const gx = clamp(Math.floor(sx / cellW), 0, GRID_W - 1);
        const gy = clamp(Math.floor(sy / cellH), 0, GRID_H - 1);
        gridOf[y * bw + wx] = (gy * GRID_W + gx) * 4;
      }
    }

    buildBase();

    if (ready && gl) {
      gl.viewport(0, 0, W, H);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texWorld);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA8,
        bw,
        bh,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null
      );
      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MIN_FILTER,
        gl.LINEAR_MIPMAP_LINEAR
      );
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, texGlow);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA16F,
        GRID_W,
        GRID_H,
        0,
        gl.RGBA,
        gl.FLOAT,
        null
      );
      for (const [unit, tex] of [
        [gl.TEXTURE2, texBase],
        [gl.TEXTURE3, texWeight],
      ] as const) {
        gl.activeTexture(unit);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA8,
          W,
          H,
          0,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          null
        );
      }
      needBake = true;
    } else {
      lowCanvas = offscreen(bw, bh);
    }
    return true;
  };

  const uploadWorld = () => {
    if (!gl) return;
    glowNearBuf.set(glowRaw);
    boxBlur(glowNearBuf, glowTemp, GRID_W, GRID_H, 1);
    boxBlur(glowNearBuf, glowTemp, GRID_W, GRID_H, 1);
    glowFarBuf.set(glowRaw);
    boxBlur(glowFarBuf, glowTemp, GRID_W, GRID_H, 4);
    boxBlur(glowFarBuf, glowTemp, GRID_W, GRID_H, 4);
    for (let i = 0; i < glowNearBuf.length; i++) {
      glowNearBuf[i] += glowFarBuf[i] * 0.6;
    }

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texWorld);
    gl.texSubImage2D(
      gl.TEXTURE_2D,
      0,
      0,
      0,
      bw,
      bh,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      pixelBytes
    );
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texGlow);
    gl.texSubImage2D(
      gl.TEXTURE_2D,
      0,
      0,
      0,
      GRID_W,
      GRID_H,
      gl.RGBA,
      gl.FLOAT,
      glowNearBuf
    );
  };

  const lensShape = () => {
    const s = clamp(stretch, -0.5, 1.2);
    const grow = 1 + 0.03 * lift;
    const hx = shape.lensHX * grow * (1 + 0.26 * s);
    const hy = shape.lensHY * grow * (1 - 0.09 * s);
    return { hx, hy, cx: (x - 0.5) * shape.travel };
  };

  const bake = () => {
    if (!gl) return;
    gl.bindFramebuffer(gl.FRAMEBUFFER, bakeTarget);
    gl.useProgram(bakeProgram);
    gl.uniform2f(bakeLoc.uRes, shape.W, shape.H);
    gl.uniform2f(bakeLoc.uPill, shape.pillW / 2, shape.pillH / 2);
    gl.uniform1f(bakeLoc.uBezel, shape.bezel);
    gl.uniform1f(bakeLoc.uCorner, shape.corner);
    gl.uniform3fv(bakeLoc.uAlbedo, body.albedo);
    gl.uniform3fv(bakeLoc.uEnvHi, body.hi);
    gl.uniform3fv(bakeLoc.uEnvLo, body.lo);
    gl.uniform3fv(bakeLoc.uInk, unit(pal(RK, 0)));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    needBake = false;
  };

  const drawGl = (time: number) => {
    if (!gl) return;
    gl.bindVertexArray(vao);
    if (needBake) bake();
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.uniform2f(loc.uRes, shape.W, shape.H);
    gl.uniform2f(loc.uPill, shape.pillW / 2, shape.pillH / 2);
    gl.uniform2f(loc.uOrigin, shape.ox, shape.oy);
    gl.uniform2f(loc.uWorldSize, bw, bh);
    gl.uniform2f(loc.uGlowSize, GRID_W, GRID_H);
    gl.uniform2f(loc.uShift, shiftX, shiftY);
    gl.uniform1f(loc.uK, k);
    gl.uniform1f(loc.uLift, lift);
    gl.uniform1f(loc.uWobble, calm ? 0 : wobble);
    gl.uniform1f(loc.uTime, time % 1000);
    const lens = lensShape();
    gl.uniform4f(loc.uLens, lens.cx, 0, lens.hx, lens.hy);
    gl.uniform1f(
      loc.uLensR,
      Math.min(lens.hx, lens.hy, Math.max(shape.corner, lens.hx * 0.5))
    );
    gl.uniform3fv(loc.uAlbedo, body.albedo);
    gl.uniform3fv(loc.uEnvHi, body.hi);
    gl.uniform3fv(loc.uEnvLo, body.lo);
    gl.uniform3fv(loc.uGround, body.ground);
    gl.uniform3fv(loc.uInk, unit(pal(RK, 0)));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const cssColor = (c: number[], a = 1) => {
    const [r, g, b] = c.map((v) => Math.round(v * 255));
    return `rgb(${r} ${g} ${b} / ${a})`;
  };

  const draw2d = () => {
    if (!ctx2d || !lowCanvas) return;
    const g = ctx2d;
    const low = lowCanvas.getContext("2d") as
      | CanvasRenderingContext2D
      | OffscreenCanvasRenderingContext2D
      | null;
    if (!low) return;
    low.putImageData(
      new ImageData(new Uint8ClampedArray(pixels.buffer), bw, bh),
      0,
      0
    );
    g.clearRect(0, 0, shape.W, shape.H);
    const px = (shape.W - shape.pillW) / 2;
    const py = (shape.H - shape.pillH) / 2;
    const ink = unit(pal(RK, 0));

    const paintPill = () => {
      const face = g.createLinearGradient(0, py, 0, py + shape.pillH);
      face.addColorStop(0, cssColor(body.hi));
      face.addColorStop(0.35, cssColor(body.albedo));
      face.addColorStop(1, cssColor(body.lo));
      g.fillStyle = face;
      g.beginPath();
      g.roundRect(px, py, shape.pillW, shape.pillH, shape.corner);
      g.fill();
      g.save();
      g.beginPath();
      g.roundRect(
        px + shape.bezel,
        py + shape.bezel,
        shape.winW,
        shape.winH,
        Math.max(shape.corner - shape.bezel, 1)
      );
      g.clip();
      g.imageSmoothingEnabled = false;
      g.drawImage(
        lowCanvas as CanvasImageSource,
        shape.ox + shiftX * k,
        shape.H - shape.oy + shiftY * k,
        bw * k,
        bh * k
      );
      g.restore();
    };
    paintPill();

    const lens = lensShape();
    const cx = shape.W / 2 + lens.cx;
    const cy = shape.H / 2;
    const lensPath = () => {
      g.beginPath();
      g.roundRect(
        cx - lens.hx,
        cy - lens.hy,
        lens.hx * 2,
        lens.hy * 2,
        Math.min(lens.hx, lens.hy)
      );
    };

    g.save();
    g.shadowColor = cssColor(ink, 0.4);
    g.shadowBlur = shape.pillH * 0.14;
    g.shadowOffsetY = shape.pillH * (0.04 + 0.03 * lift);
    g.fillStyle = cssColor(body.ground);
    lensPath();
    g.fill();
    g.restore();

    g.save();
    lensPath();
    g.clip();
    g.fillStyle = cssColor(body.ground);
    g.fillRect(cx - lens.hx, cy - lens.hy, lens.hx * 2, lens.hy * 2);
    g.translate(cx, cy);
    g.scale(1.24, 1.24);
    g.translate(-cx, -cy);
    paintPill();
    g.restore();

    const rim = g.createLinearGradient(0, cy - lens.hy, 0, cy + lens.hy);
    rim.addColorStop(0, cssColor(body.hi, 0.95));
    rim.addColorStop(0.5, cssColor(ink, 0.25));
    rim.addColorStop(1, cssColor(ink, 0.5));
    g.strokeStyle = rim;
    g.lineWidth = Math.max(1, shape.pillH * 0.012);
    lensPath();
    g.stroke();
  };

  let raf = 0;
  let last = 0;
  let visible = true;
  let pageVisible = document.visibilityState !== "hidden";
  let worldAcc = 1;
  let dirty = true;
  let worldDirty = true;
  let slow = 0;
  let good = 0;
  let frames = 0;

  const OVERLOAD_MS = 12;
  const COST_SAMPLES = 5;
  const onePixel = new Uint8Array(4);
  let costLeft = 0;
  let costs: number[] = [];
  let weighedOnce = false;

  const lowerResolution = () => {
    const next = (k - 1) / fullK;
    if (k < 2 || next < 0.5) return;
    renderScale = next;
    measure();
    dirty = true;
    worldDirty = true;
    frames = 0;
  };

  const adapt = (dt: number) => {
    ++frames;
    if (frames === 40 && !weighedOnce) {
      weighedOnce = true;
      costLeft = COST_SAMPLES;
      costs = [];
    }
    if (frames < 40) return;
    if (dt > 0.0225) slow++;
    else good++;
    if (slow + good < 50) return;
    const suspect = slow > 30;
    slow = 0;
    good = 0;
    if (suspect && ready) {
      costLeft = COST_SAMPLES;
      costs = [];
    }
  };

  const weighCost = (startedAt: number) => {
    if (!gl) return;
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, onePixel);
    costs.push(performance.now() - startedAt);
    if (--costLeft > 0) return;
    const median = costs.sort((a, b) => a - b)[costs.length >> 1];
    if (median > OVERLOAD_MS) lowerResolution();
    else frames = -600;
  };

  const tick = (ms: number) => {
    raf = 0;
    if (lost) return;
    const t = ms / 1000;
    const dt = last ? Math.min(0.05, t - last) : 1 / 60;
    last = t;

    if (!calm && ready) adapt(dt);

    const target = (value - minVal) / Math.max(1, maxVal - minVal);
    if (calm) {
      if (x !== target) {
        x = target;
        worldDirty = true;
        dirty = true;
      }
      velocity = 0;
      stretch = 0;
      stretchV = 0;
      lift = liftTarget;
    } else {
      const omega = 24 * motionScale;
      const decay = Math.exp(-omega * dt);
      const away = x - target;
      const carry = (velocity + omega * away) * dt;
      x = clamp(target + (away + carry) * decay);
      velocity = (velocity - omega * carry) * decay;
      if (Math.abs(target - x) < 0.0002 && Math.abs(velocity) < 0.002) {
        x = target;
        velocity = 0;
      }
      const goal = clamp(Math.abs(velocity) * 0.5);
      const springDt = Math.min(dt, 1 / 40);
      stretchV += (190 * (goal - stretch) - 12 * stretchV) * springDt;
      stretch += stretchV * springDt;
      lift += (liftTarget - lift) * (1 - Math.exp(-dt * 14));
      wobble = Math.max(
        wobble * Math.exp(-dt * 3.4),
        clamp(Math.abs(velocity) * 0.9)
      );
      if (
        x !== target ||
        velocity !== 0 ||
        Math.abs(stretch) > 0.001 ||
        Math.abs(stretchV) > 0.01 ||
        Math.abs(lift - liftTarget) > 0.001 ||
        wobble > 0.02
      )
        dirty = true;
    }

    worldAcc += dt;
    const worldStep = calm
      ? worldDirty
      : worldAcc >= 1 / WORLD_HZ - WORLD_SLACK;
    if (worldStep) {
      stepWorld(Math.min(worldAcc, 0.1));
      renderWorld();
      worldAcc = 0;
      worldDirty = false;
      if (ready) uploadWorld();
      dirty = true;
    }

    if (dirty) {
      const weighing = costLeft > 0 && ready;
      const startedAt = weighing ? performance.now() : 0;
      if (ready) drawGl(t);
      else if (ctx2d) draw2d();
      dirty = false;
      if (weighing) weighCost(startedAt);
    }

    if (visible && pageVisible && !calm) raf = requestAnimationFrame(tick);
  };

  function wake() {
    if (!raf && visible && pageVisible && !lost) {
      last = 0;
      raf = requestAnimationFrame(tick);
    }
  }

  const syncValue = () => {
    value = clamp(Math.round(Number(input!.value) || minVal), minVal, maxVal);
    input!.setAttribute("aria-valuetext", describe(value));
    worldDirty = true;
    dirty = true;
    wake();
    if (onValueChange) onValueChange(value);
  };

  on(input, "input", syncValue);
  on(input, "change", syncValue);
  on(input, "pointerdown", () => {
    liftTarget = 1;
    dirty = true;
    wake();
  });
  const release = () => {
    liftTarget = 0;
    dirty = true;
    wake();
  };
  on(input, "pointerup", release);
  on(input, "pointercancel", release);
  on(input, "lostpointercapture", release);
  on(input, "blur", release);

  const stopDrawing = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };
  const io = new IntersectionObserver((entries) => {
    visible = entries.some((e) => e.isIntersecting);
    if (visible) {
      dirty = true;
      worldDirty = true;
      wake();
    } else stopDrawing();
  });
  io.observe(root);

  on(document, "visibilitychange", () => {
    pageVisible = document.visibilityState !== "hidden";
    if (pageVisible) {
      if (lost) waitForRestore();
      dirty = true;
      worldDirty = true;
      wake();
    } else stopDrawing();
  });

  const ro = new ResizeObserver(() => {
    measure();
    dirty = true;
    worldDirty = true;
    wake();
  });
  ro.observe(root);

  on(motionQuery, "change", () => {
    calm = motionQuery.matches;
    dirty = true;
    worldDirty = true;
    wake();
  });
  on(schemeQuery, "change", () => {
    readTokens();
    measure();
    dirty = true;
    worldDirty = true;
    wake();
  });

  const RESTORE_WAIT_MS = 3000;
  let restoreTimer: ReturnType<typeof setTimeout> | undefined;
  const redrawAll = () => {
    shape.W = 0;
    measure();
    dirty = true;
    worldDirty = true;
    wake();
  };

  function waitForRestore() {
    clearTimeout(restoreTimer);
    restoreTimer = setTimeout(() => {
      if (!lost || !pageVisible) return;
      lost = false;
      useCanvas2d();
      redrawAll();
    }, RESTORE_WAIT_MS);
  }

  on(canvas, "webglcontextlost", (event) => {
    event.preventDefault();
    ready = false;
    lost = true;
    costLeft = 0;
    stopDrawing();
    if (pageVisible) waitForRestore();
  });
  on(canvas, "webglcontextrestored", () => {
    clearTimeout(restoreTimer);
    lost = false;
    ready = setupGl();
    if (!ready) useCanvas2d();
    redrawAll();
  });

  readTokens();
  measure();
  if (lost) waitForRestore();
  input.setAttribute("aria-valuetext", describe(value));

  actor.mode = wantMode();
  actor.x = seatedMode(actor.mode) ? SOFA_X : DANCE_X;
  if (x >= 0.86) nb.light = 1;
  lampNow = value > minVal ? 1 : 0;
  party = smoothstep(0.62, 0.72, x);
  ballDrop = party > 0.02 ? 1 : 0;
  for (let i = 0; i < 90; i++) stepWorld(1 / 30);
  renderWorld();
  if (ready) uploadWorld();
  wake();

  return {
    setValue: (newVal: number) => {
      const next = clamp(Math.round(Number(newVal) || minVal), minVal, maxVal);
      if (next !== value) {
        value = next;
        input.value = String(next);
        input.setAttribute("aria-valuetext", describe(value));
        worldDirty = true;
        dirty = true;
        wake();
      }
    },
    destroy: () => {
      stopDrawing();
      clearTimeout(restoreTimer);
      visible = false;
      io.disconnect();
      ro.disconnect();
      for (const off of cleanups) off();
      if (gl && ready) {
        if (program) gl.deleteProgram(program);
        if (bakeProgram) gl.deleteProgram(bakeProgram);
        if (bakeTarget) gl.deleteFramebuffer(bakeTarget);
        if (texBase) gl.deleteTexture(texBase);
        if (texWeight) gl.deleteTexture(texWeight);
        if (quad) gl.deleteBuffer(quad);
        if (vao) gl.deleteVertexArray(vao);
        if (texWorld) gl.deleteTexture(texWorld);
        if (texGlow) gl.deleteTexture(texGlow);
      }
      canvas.remove();
    },
  };
}

export interface ResidentSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
  disabled?: boolean;
}

export default function ResidentSlider({
  value,
  onChange,
  min = 1,
  max = 100,
  className = "",
  disabled = false,
}: ResidentSliderProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<ResidentSliderController | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!rootRef.current) return;
    const controller = mountResidentSlider(rootRef.current, {
      min,
      max,
      initialValue: value,
      onValueChange: (v) => {
        onChangeRef.current?.(v);
      },
    });
    controllerRef.current = controller;

    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [min, max]);

  useEffect(() => {
    controllerRef.current?.setValue(value);
  }, [value]);

  return (
    <div
      ref={rootRef}
      data-ld-part="slider-resident"
      lang="id"
      className={`relative select-none ${className}`}
      style={{
        pointerEvents: disabled ? "none" : "auto",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <span className="shade" aria-hidden="true" />
      <div className="scene-slot" aria-hidden="true" />
      <input
        className="range"
        type="range"
        min={min}
        max={max}
        step={1}
        defaultValue={value}
        disabled={disabled}
        aria-label="Level Kesulitan Soal (Skala 1 - 100)"
      />
      <span className="probe" aria-hidden="true" />
    </div>
  );
}
