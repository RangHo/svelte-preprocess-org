import { Emacs, a, list, quote, type Atom } from "./emacs.js";

/**
 * Customization options for Org export engine.
 *
 * See the documentation for `ox` for more details.
 */
export type OrgExportCustomization = Partial<{
  withSmartQuotes: boolean;
  withEmphasize: boolean;
  withSpecialStrings: boolean;
  withFixedWidth: boolean;
  withTimestamps: boolean;
  preserveBreaks: boolean;
  withSubSuperscripts: boolean | Atom;
  withArchivedTrees: boolean | Atom;
  expandLinks: boolean;
  withBrokenLinks: boolean | Atom;
  withClocks: boolean;
  withCreator: boolean;
  withDrawers: boolean;
  withDate: boolean;
  withEntities: boolean;
  withEmail: boolean;
  withFootnotes: boolean;
  headlineLevels: number;
  withInlinetasks: boolean;
  withSectionNumbers: boolean | number;
  withPlanning: boolean;
  withPriority: boolean;
  withProperties: boolean | Atom[];
  withStatisticsCookies: boolean;
  withTags: boolean | Atom;
  withTasks: boolean | Atom;
  withLatex: boolean | Atom;
  timestampFile: boolean;
  withTitle: boolean;
  withToc: boolean;
  todoKeywords: boolean;
  withTables: boolean;
}>;

export function customize(options: OrgExportCustomization = {}) {
  return [];
}
