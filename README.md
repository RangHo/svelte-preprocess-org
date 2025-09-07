# Svelte Preprocessor for Org-mode Documents

[Svelte](https://svelte.dev/) preprocessor to import [Org mode](https://orgmode.org) documents as a component, powered by [ox-svelte](https://github.com/RangHo/ox-svelte).

## Prerequisites

You need the following installed on your machine to properly run this preprocessor:

- Emacs 30 or later
- Org 9.4 or later

## How to use

Register the preprocessor and its corresponding file extention to Svelte config.
The example below is for the `svelte.config.js` file that is read by SvelteKit.

``` javascript
import { orgPreprocess } from 'svelte-preprocess-org';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  extensions: [".svelte", ".org"],
  preprocess: [
    orgPreprocess({
      // Org preprocessor options
jjj    }),
    // ...other preprocessors
  ],
  // ...other configurations
};

export default config;
```

The Org preprocessor option object is the union of three types:

1. Org preprocessor options;
2. customization options for `ox`, Org-mode export engine; and
3. customization options for `ox-svelte`, Svelte export backend for Org-mode.

For the customization options, see the corresponding Eldoc documents for more information.

## Common Issues

These are the list of issues that occur frequently.

### "Cannot find module *.org or its corresponding type declarations."

In TypeScript projects, you might get this error during compilation.
`ox-svelte` already provides the shape of the Org "module", so you can declare the existence of `*.org` modules in global declaration files:

``` typescript
declare global {
  declare module "*.org" {
    import type { OrgModule } from "ox-svelte";

    const mod: OrgModule;
    export default mod;
  }
}
```

