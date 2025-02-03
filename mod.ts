/**
 * A DOOM-like fire effect for a canvas.
 *
 * It overlays an animated burn effect on a given HTMLElement.
 *
 * ```ts
 * import burn from "@manzt/burn";
 *
 * burn(document.querySelector("#target"));
 * ```
 *
 * @module
 */

export type Color = [r: number, g: number, b: number, a?: number];

export type ColorPallete = ReadonlyArray<Color>;

// @deno-fmt-ignore
const DEFAULT_PALLETE = [
  [0x07,0x07,0x07],
  [0x1F,0x07,0x07],
  [0x2F,0x0F,0x07],
  [0x47,0x0F,0x07],
  [0x57,0x17,0x07],
  [0x67,0x1F,0x07],
  [0x77,0x1F,0x07],
  [0x8F,0x27,0x07],
  [0x9F,0x2F,0x07],
  [0xAF,0x3F,0x07],
  [0xBF,0x47,0x07],
  [0xC7,0x47,0x07],
  [0xDF,0x4F,0x07],
  [0xDF,0x57,0x07],
  [0xDF,0x57,0x07],
  [0xD7,0x5F,0x07],
  [0xD7,0x5F,0x07],
  [0xD7,0x67,0x0F],
  [0xCF,0x6F,0x0F],
  [0xCF,0x77,0x0F],
  [0xCF,0x7F,0x0F],
  [0xCF,0x87,0x17],
  [0xC7,0x87,0x17],
  [0xC7,0x8F,0x17],
  [0xC7,0x97,0x1F],
  [0xBF,0x9F,0x1F],
  [0xBF,0x9F,0x1F],
  [0xBF,0xA7,0x27],
  [0xBF,0xA7,0x27],
  [0xBF,0xAF,0x2F],
  [0xB7,0xAF,0x2F],
  [0xB7,0xB7,0x2F],
  [0xB7,0xB7,0x37],
  [0xCF,0xCF,0x6F],
  [0xDF,0xDF,0x9F],
  [0xEF,0xEF,0xC7],
  [0xFF,0xFF,0xFF]
] satisfies ColorPallete;

class Renderer {
	#scale: number;
	#pallete: ColorPallete;

	#canvas: HTMLCanvasElement;
	#ctx: CanvasRenderingContext2D;
	#offscreenCanvas: HTMLCanvasElement;
	#offscreenCtx: CanvasRenderingContext2D;

	#pixels: Uint8Array;

	constructor(
		canvas: HTMLCanvasElement,
		options: { scale: number; pallete: ColorPallete },
	) {
		this.#scale = options.scale;
		this.#pallete = options.pallete;

		this.#canvas = canvas;
		this.#ctx = canvas.getContext("2d")!;
		this.#ctx.imageSmoothingEnabled = false;

		this.#offscreenCanvas = document.createElement("canvas");
		this.#offscreenCtx = this.#offscreenCanvas.getContext("2d")!;

		this.#pixels = new Uint8Array(this.#width * this.#height);
		this.reset();
	}

	get #width(): number {
		return Math.floor(this.#canvas.width / this.#scale);
	}

	get #height(): number {
		return Math.floor(this.#canvas.height / this.#scale);
	}

	get pallete(): ColorPallete {
		return this.#pallete;
	}

	set pallete(update: ColorPallete) {
		if (update.length !== 37) {
			throw TypeError("Color pallette must be 37 elements.");
		}
		this.#pallete = update;
	}

	#spread(from: number): void {
		if (from < this.#width) {
			return;
		}
		const decay = Math.floor(Math.random() * 3);
		const to = from - this.#width + (Math.random() > 0.5 ? 1 : -1);
		this.#pixels[to] = Math.max(this.#pixels[from] - decay, 0);
	}

	reset(): void {
		// clear pixels
		this.#pixels = new Uint8Array(this.#width * this.#height);
		this.#pixels.fill(0);
		for (let x = 0; x < this.#width; x++) {
			this.#pixels[(this.#height - 1) * this.#width + x] = 36;
		}
		this.render();
	}

	update(): void {
		for (let x = 0; x < this.#width; x++) {
			for (let y = 1; y < this.#height; y++) {
				this.#spread(y * this.#width + x);
			}
		}
	}

	render(): void {
		// render off screen
		this.#offscreenCanvas.width = this.#width;
		this.#offscreenCanvas.height = this.#height;
		let imageData = this.#offscreenCtx.createImageData(
			this.#width,
			this.#height,
		);
		for (let i = 0; i < this.#pixels.length; i++) {
			let intensity = this.#pixels[i];
			let [red, green, blue] = this.#pallete[intensity];

			let offset = i * 4;
			if (intensity === 0) {
				imageData.data[offset + 3] = 0; // transparent
			} else {
				imageData.data[offset] = red;
				imageData.data[offset + 1] = green;
				imageData.data[offset + 2] = blue;
				imageData.data[offset + 3] = 255;
			}
		}
		this.#offscreenCtx.putImageData(imageData, 0, 0);

		// Copy pixels
		this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
		this.#ctx.drawImage(
			this.#offscreenCanvas,
			0,
			this.#canvas.height - this.#offscreenCanvas.height * this.#scale,
			this.#canvas.width,
			this.#offscreenCanvas.height * this.#scale,
		);
	}
}

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

/**
 * DOOM-like burn effect for a canvas.
 *
 * Implements a simple palette-based heat propagation model.
 *
 * @see https://fabiensanglard.net/doom_fire_psx
 *
 * @param canvas - A canvas element to render the simulation.
 * @param options - Options bag for with options for rendering
 *
 * @returns {BurnController}
 */
export default function burn(
	canvas: HTMLCanvasElement,
	options: BurnOptions = {},
): BurnController {
	let {
		scale = 3.5,
		interval = 30,
		pallete = DEFAULT_PALLETE,
	} = options;

	let id: number | null = null;
	let renderer = new Renderer(canvas, { scale, pallete });

	function animate() {
		renderer.pallete = pallete;
		renderer.update();
		renderer.render();
		id = setTimeout(animate, interval);
	}

	let controller = {
		start() {
			if (id !== null) return;
			animate();
		},
		stop() {
			if (id === null) return;
			clearTimeout(id);
			id = null;
		},
		reset() {
			renderer.reset();
		},
		get pallete() {
			return pallete;
		},
		set pallete(update) {
			pallete = update;
		},
		get interval() {
			return interval;
		},
		set interval(update) {
			interval = update;
		},
	} satisfies BurnController;

	controller.start();
	return controller;
}
