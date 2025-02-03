export type Color = [r: number, g: number, b: number, a?: number];

export type ColorPallete = ReadonlyArray<Color>;

/** The options bag to pass to the {@link burn} method. */
export interface BurnOptions {
	/**
	 * Scaling factor for the effect, determining pixel size.
	 * Higher values create a blockier, more pixelated effect.
	 *
	 * @default 3.5
	 */
	scale?: number;
	/**
	 * The interval between renders in milliseconds.
	 *
	 * @default 30
	 */
	interval?: number;
	/**
	 * Initial height of the effect. If not specified,
	 * adapts to the element size.
	 */
	height?: number;
	/**
	 * Color palette used for rendering the effect.
	 * Must contain exactly 37 colors.
	 */
	pallete?: ColorPallete;
}

/**
 * The API returned from the {@link burn} method.
 */
export interface BurnController {
	/**
	 * Starts the animation if it was previously stopped.
	 */
	start(): void;
	/**
	 * Stops the animation loop, pausing the effect.
	 */
	stop(): void;
	/**
	 * Resets the renderer, clearing and reinitializing the effect.
	 * Useful after resizing or changing parameters.
	 */
	reset(): void;
	/**
	 * The color palette used for rendering.
	 * Must be an array of 37 RGB color values.
	 */
	pallete: ColorPallete;
	/**
	 * The interval between renders in milliseconds.
	 */
	interval: number;
}
