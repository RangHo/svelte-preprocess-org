// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
  declare module "*.org" {
    import type { OrgModule } from "ox-svelte";

    const mod: OrgModule;
    export default mod;
  }
}

export {};
