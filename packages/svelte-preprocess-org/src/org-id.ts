import { list, quote, a } from "./emacs.js";

export function updateIdLocations(locations: string[]) {
    return list(
      a`progn`,
      list(a`require`, quote(a`org`)),
      list(a`require`, quote(a`org-id`)),
      list(a`org-id-update-id-locations`, quote(list(...locations))),
    );
}
