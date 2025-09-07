import { a, list, quote, type Atom, type Value } from "./emacs";
import { toKebabCase } from "./utilities";

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

/**
 * Generate Emacs Lisp code to customize the Org export engine.
 */
export function customize(options: OrgExportCustomization = {}) {
  const transformed = Object.entries(options).flatMap(([key, val]) => {
    switch (key) {
      case "withProperties": {
        return [
          a`org-export-with-properties`,
          Array.isArray(val) ? quote(list(...val)) : val,
        ]
      }
     
      case "withSmartQuotes":
      case "withEmphasize":
      case "withSpecialStrings":
      case "withFixedWidth":
      case "withTimestamps":
      case "preserveBreaks":
      case "withSubSuperscripts":
      case "withArchivedTrees":
      case "expandLinks":
      case "withBrokenLinks":
      case "withClocks":
      case "withCreator":
      case "withDrawers":
      case "withDate":
      case "withEntities":
      case "withEmail":
      case "withFootnotes":
      case "headlineLevels":
      case "withInlinetasks":
      case "withSectionNumbers":
      case "withPlanning":
      case "withPriority":
      case "withStatisticsCookies":
      case "withTags":
      case "withTasks":
      case "withLatex":
      case "timestampFile":
      case "withTitle":
      case "withToc":
      case "todoKeywords":
      case "withTables":
        return [a`org-export-${toKebabCase(key)}`, val as Value];

      default:
        return [];
    }
  });

  return list(a`setq`, ...transformed);
}
