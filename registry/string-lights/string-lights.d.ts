export type StringLayout = 'roofline' | 'curtain' | 'draped' | 'border';
export type StringShape = 'rice' | 'round' | 'crystal' | 'flower' | 'led';
export type StringMode = 'static' | 'blink' | 'chase' | 'twinkle' | 'wave';
export type StringPalette = 'multicolor' | 'electric' | 'warm' | 'white' | 'tricolor';
export interface StringOptions {
  layout?: StringLayout;
  shape?: StringShape | readonly StringShape[];
  colors?: StringPalette | readonly string[];
  mode?: StringMode;
  /** Subtle twinkle is enabled by default. Disable light animation without losing the selected pattern. */
  animated?: boolean;
  spacing?: number;
  size?: number;
  sag?: number;
  speed?: number;
  glow?: number;
  glitter?: boolean;
  dimBase?: boolean;
  breeze?: boolean;
  wind?: number;
  interactive?: boolean;
  /** Gentle contact between strands in this instance. Default true. */
  collisions?: boolean;
  seed?: number;
  paused?: boolean;
  /** Body/document overlays: fixed to the viewport, or absolute and scrolling with the document. */
  pagePosition?: 'fixed' | 'absolute';
  patternOrder?: 'fixed' | 'cycle' | 'random';
  patternInterval?: number;
  patternSequence?: readonly StringMode[];
}
export type NormalizedStringOptions = Required<
  Omit<StringOptions, 'colors' | 'shape' | 'patternSequence'>
> & {
  colors: string[];
  shape: StringShape | StringShape[];
  patternSequence: StringMode[];
};
export interface StringController {
  readonly element: SVGSVGElement;
  readonly pattern: StringMode;
  update(options?: StringOptions): void;
  pause(): void;
  play(): void;
  destroy(): void;
}
export interface StringPoint {
  x: number;
  y: number;
  mobility: number;
  /** A curtain drop's tied endpoint on its header. */
  attachment?: { wire: number; segment: number; t: number };
}
export interface StringBulb extends StringPoint {
  wire: number;
  segment: number;
  t: number;
  angle: number;
  shape: StringShape;
  color: string;
  phase: number;
  group: number;
}
export interface StringGeometry {
  wires: StringPoint[][];
  bulbs: StringBulb[];
}
export interface RopeNode {
  x: number;
  y: number;
  px: number;
  py: number;
  homeX: number;
  homeY: number;
  pinned: boolean;
  mass: number;
}
export interface StringRope {
  nodes: RopeNode[];
  lengths: number[];
  active: boolean;
  accumulator: number;
  quietTime: number;
  sleeping: boolean;
}
export interface RopeGrab {
  segment: number;
  t: number;
  x: number;
  y: number;
}
export interface StringPreset {
  readonly name: string;
  readonly description: string;
  readonly options: Readonly<StringOptions>;
}
export type StringPresetName =
  'festive' | 'classic' | 'warm' | 'white' | 'flowers' | 'crystal' | 'tricolor' | 'mixed';
export declare const stringLightsPresets: Readonly<Record<StringPresetName, StringPreset>>;
export declare const palettes: Readonly<Record<StringPalette, readonly string[]>>;
export declare const layouts: readonly StringLayout[];
export declare const shapes: readonly StringShape[];
export declare const modes: readonly StringMode[];
export declare function normalizeOptions(options?: StringOptions): NormalizedStringOptions;
export declare function createGeometry(
  width: number,
  height: number,
  options?: StringOptions,
): StringGeometry;
export declare function createStringLights(
  target: string | HTMLElement,
  options?: StringOptions,
): StringController;
export declare function createBulbPreview(options?: StringOptions): SVGSVGElement;
export declare function breezeForce(time: number, strand?: number): number;
export declare function createRope(points: readonly StringPoint[]): StringRope;
export declare function ropeAttachment(
  rope: StringRope,
  segment: number,
  t: number,
): { x: number; y: number };
export declare function stepRope(
  rope: StringRope,
  dt: number,
  grab?: RopeGrab | null,
  wind?: number,
): void;
export declare function releaseRope(
  rope: StringRope,
  grab: Pick<RopeGrab, 'segment' | 't'>,
  velocity: { x: number; y: number },
): void;
