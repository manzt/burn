# @manzt/burn

[![JSR](https://jsr.io/badges/@manzt/burn)](https://jsr.io/@manzt/burn)

a DOOM-like fire effect for a HTML5 canvas

## usage

```ts
import burn from "jsr:@manzt/burn";

burn(document.querySelector("canvas"));
```

![DOOM fire effect](https://github.com/user-attachments/assets/41b92877-71e0-410e-94bb-732b4e63625b)

## about

implements a simple palette-based heat propagation model. see Fabirn Sanglard's
[post](https://fabiensanglard.net/doom_fire_psx) for more details.

## development

```sh
deno -A npm:vite # open http://localhost:5173
```

the source code is formatted, linted, and type-checked with deno

```ts
deno fmt
deno lint
deno check mod.ts
```
