/**
 * This module contains a DOOM-like fire effect for a canvas.
 *
 * It overlays an animated burn effect on a given HTMLElement.
 *
 * @module
 *
 * @example
 * ```ts
 * import burn from "@manzt/burn";
 *
 * burn(document.querySelector("#target"));
 * ```
 */

/** @import { ColorPallete, Color, BurnController, BurnOptions } from "./types.ts" */

// @deno-fmt-ignore
/** @satisfies {ColorPallete} */
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
];

class Renderer {
	/** @type {number} */
	#scale;
	/** @type {ColorPallete} */
	#pallete;

	/** @type {HTMLCanvasElement} */
	#canvas;
	/** @type {CanvasRenderingContext2D} */
	#ctx;
	/** @type {HTMLCanvasElement} */
	#offscreenCanvas;
	/** @type {CanvasRenderingContext2D} */
	#offscreenCtx;

	/** @type {Uint8Array} */
	#pixels;

	/**
	 * @param {HTMLCanvasElement} canvas
	 * @param {{ scale: number, pallete: ColorPallete }} options
	 */
	constructor(canvas, options) {
		this.#scale = options.scale;
		this.#pallete = options.pallete;

		this.#canvas = canvas;
		this.#ctx =
			/** @type {CanvasRenderingContext2D} */ (canvas.getContext("2d"));
		this.#ctx.imageSmoothingEnabled = false;

		this.#offscreenCanvas = document.createElement("canvas");
		this.#offscreenCtx =
			/** @type {CanvasRenderingContext2D} */ (this.#offscreenCanvas.getContext(
				"2d",
			));

		this.#pixels = new Uint8Array(this.#width * this.#height);
		this.reset();
	}

	/** @type {number} */
	get #width() {
		return Math.floor(this.#canvas.width / this.#scale);
	}

	/** @type {number} */
	get #height() {
		return Math.floor(this.#canvas.height / this.#scale);
	}

	/** @type {ColorPallete} */
	get pallete() {
		return this.#pallete;
	}

	/** @param {ColorPallete} update */
	set pallete(update) {
		if (update.length !== 37) {
			throw TypeError("Color pallette must be 37 elements.");
		}
		this.#pallete = update;
	}

	/** @param {number} from */
	#spread(from) {
		if (from < this.#width) {
			return;
		}
		const decay = Math.floor(Math.random() * 3);
		const to = from - this.#width + (Math.random() > 0.5 ? 1 : -1);
		this.#pixels[to] = Math.max(this.#pixels[from] - decay, 0);
	}

	reset() {
		// clear pixels
		this.#pixels = new Uint8Array(this.#width * this.#height);
		this.#pixels.fill(0);
		for (let x = 0; x < this.#width; x++) {
			this.#pixels[(this.#height - 1) * this.#width + x] = 36;
		}
		this.render();
	}

	update() {
		for (let x = 0; x < this.#width; x++) {
			for (let y = 1; y < this.#height; y++) {
				this.#spread(y * this.#width + x);
			}
		}
	}

	render() {
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

/**
 * DOOM-like burn effect for a canvas.
 *
 * Implements a simple palette-based heat propagation model.
 *
 * @see https://fabiensanglard.net/doom_fire_psx
 *
 * @param {HTMLCanvasElement} canvas - A canvas element to render the simulation.
 * @param {BurnOptions} options - Options bag for with options for rendering
 *
 * @returns {BurnController}
 */
export default function burn(canvas, options = {}) {
	let {
		scale = 3.5,
		interval = 30,
		pallete = DEFAULT_PALLETE,
	} = options;

	/** @type {number | null} */
	let id = null;
	let renderer = new Renderer(canvas, { scale, pallete });

	function animate() {
		renderer.pallete = pallete;
		renderer.update();
		renderer.render();
		id = setTimeout(animate, interval);
	}

	/** @satisfies {BurnController} */
	const controller = {
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
	};

	controller.start();
	return controller;
}
