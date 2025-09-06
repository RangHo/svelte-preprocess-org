<script lang="ts">
  import type { Snippet } from "svelte";

  type Props = {
    href: string;
    children: Snippet;
  };

  let { href, children }: Props = $props();

  let realHref = $derived(
    href.startsWith("src/lib/orgs/")
      ? href.replace("src/lib/orgs/", "").replace(".org", "")
      : href,
  );
</script>

<a href={realHref} class="text-blue-600 hover:underline">
  {@render children()}
</a>
