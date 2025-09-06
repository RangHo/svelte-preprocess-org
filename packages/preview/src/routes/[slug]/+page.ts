import type { PageLoad } from "./$types";

import Dummy from "$lib/orgs/dummy.org";
import Hyperlink from "$lib/orgs/hyperlink.org";

export const load: PageLoad = async ({ params }) => {
  if (params.slug === "hyperlink") {
    return { org: Hyperlink };
  } else {
    return { org: Dummy };
  }
};
