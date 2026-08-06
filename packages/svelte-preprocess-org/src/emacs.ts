import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Options for starting an Emacs intsance.
 */
export type EmacsCustomization = {
  /**
   * Directory to use as Emacs `user-emacs-directory`.
   */
  initDirectory: string;

  /**
   * Largest amount of data in bytes allowed on stdout or stderr.
   */
  maxBuffer: number;
};

/**
 * An S-expression.
 */
export type Sexp = Value | Cell;

/**
 * A value in an S-expression.
 */
export type Value = Atom | Keyword | Quote | string | number | boolean | null;

/**
 * A cons cell.
 */
export type Cell = {
  car: Sexp;
  cdr: Sexp;
};

/**
 * An atom in an S-expression.
 */
export type Atom = {
  atom: string;
};

/**
 * A keyword in an S-expression.
 */
export type Keyword = {
  keyword: string;
};

/**
 * A quoted S-expression.
 */
export type Quote = {
  quote: Sexp;
};

/**
 * Check if a value is a cons cell.
 */
export function isCell(x: unknown): x is Cell {
  return x instanceof Object && "car" in x && "cdr" in x;
}

/**
 * Check if a value is an atom.
 */
export function isAtom(x: unknown): x is Atom {
  return x instanceof Object && "atom" in x;
}

/**
 * Check if a value is a keyword.
 */
export function isKeyword(x: unknown): x is Keyword {
  return x instanceof Object && "keyword" in x;
}

/**
 * Check if a value is a quoted S-expression.
 */
export function isQuote(x: unknown): x is Quote {
  return x instanceof Object && "quote" in x;
}

/**
 * Check if a value is a valid value in an S-expression.
 */
export function isValue(x: unknown): x is Value {
  return (
    isAtom(x) ||
    isKeyword(x) ||
    isQuote(x) ||
    isString(x) ||
    isNumber(x) ||
    isBoolean(x) ||
    isNil(x)
  );
}

/**
 * Check if a value is a nil value
 */
export function isNil(x: unknown): x is null {
  return x === null;
}

/**
 * Check if a value is a list.
 *
 * Note that improper lists are also considered lists.
 */
export function isList(x: unknown): x is Cell {
  return isCell(x) || isNil(x);
}

/**
 * Check if a value is a string.
 */
export function isString(x: unknown): x is string {
  return typeof x === "string";
}

/**
 * Check if a value is a number.
 */
export function isNumber(x: unknown): x is number {
  return typeof x === "number";
}

/**
 * Check if a value is a boolean.
 */
export function isBoolean(x: unknown): x is boolean {
  return typeof x === "boolean";
}

/**
 * Create a cons cell.
 */
export function cons(car: Sexp, cdr: Sexp): Cell {
  return { car, cdr };
}

/**
 * Create a quoted S-expression.
 */
export function quote(sexp: Sexp): Quote | Keyword {
  if (isKeyword(sexp)) {
    // A quoted keyword is still a keyword.
    return k`${sexp.keyword}`;
  } else {
    // For the rest, just quote the S-expression.
    return { quote: sexp };
  }
}

/**
 * Create a list from a sequence of S-expressions.
 */
export function list(...args: Sexp[]): Sexp {
  if (args.length === 0) {
    return null;
  }

  const [car, ...rest] = args;
  return cons(car, list(...rest));
}

/**
 * Create an atom from a tagged template string.
 */
export function a(
  raw: TemplateStringsArray,
  ...substitutions: unknown[]
): Atom {
  return { atom: String.raw({ raw }, ...substitutions) };
}

/**
 * Create a keyword from a tagged template string.
 */
export function k(
  raw: TemplateStringsArray,
  ...substitutions: unknown[]
): Keyword {
  return { keyword: String.raw({ raw }, ...substitutions) };
}

/**
 * Escape a string so it can be embedded as a Lisp string literal.
 *
 * Only the backslash and double-quote characters are special inside a Lisp
 * string literal; everything else (including newlines, unicode, etc.) is
 * passed through verbatim.
 */
function escapeLispString(s: string): string {
  return s.replace(/[\\"]/g, (c) => `\\${c}`);
}

/**
 * Convert an S-expression to a string.
 */
export function stringify(sexp: Sexp): string {
  // Dispatch based on the type of the expression.
  switch (true) {
    case isCell(sexp):
      return `(${stringifyList(sexp)})`;
    case isNil(sexp):
      return "nil";
    case isString(sexp):
      return `"${escapeLispString(sexp)}"`;
    case isNumber(sexp):
      return sexp.toString();
    case isBoolean(sexp):
      return sexp ? "t" : "nil";
    case isAtom(sexp):
      return sexp.atom;
    case isKeyword(sexp):
      return `:${sexp.keyword}`;
    case isQuote(sexp):
      return `'${stringify(sexp.quote)}`;
    default:
      throw new TypeError(`Unknown type of S-expression: ${typeof sexp}`);
  }
}

/**
 * Convert a list to a string.
 */
function stringifyList(list: Cell): string {
  // Stringify the car of the list.
  let result = "";
  if (isCell(list.car)) {
    result += `(${stringifyList(list.car)})`;
  } else {
    result += stringify(list.car);
  }

  // There are three cases for a cdr:
  // 1. cdr is another cell -> recursively stringify the cdr
  // 2. cdr is nil -> end of the list, so just return the result
  // 3. cdr is something else -> add a dot and the stringified cdr
  if (isCell(list.cdr)) {
    result += ` ${stringifyList(list.cdr)}`;
  } else if (isNil(list.cdr)) {
    return result;
  } else {
    result += ` . ${stringify(list.cdr)}`;
  }

  return result;
}

/**
 * Undo the outer Lisp string-literal quoting that `emacsclient --eval`
 * wraps its reply in (e.g. `"hello \"world\""` -> `hello "world"`).
 *
 * This only reverses `\\` and `\"`, which is all that's needed here: the
 * payload is always JSON text (see `run()`), so it never contains a raw
 * control character for Emacs to escape some other way.
 */
function unwrapLispString(printed: string): string {
  const trimmed = printed.trim();
  if (!trimmed.startsWith('"') || !trimmed.endsWith('"')) {
    throw new Error(
      `Expected Emacs to return a Lisp string, but got: ${printed}`,
    );
  }

  const body = trimmed.slice(1, -1);
  let result = "";
  for (let i = 0; i < body.length; i++) {
    if (body[i] === "\\" && i + 1 < body.length) {
      result += body[++i];
    } else {
      result += body[i];
    }
  }

  return result;
}

/**
 * Parse the result of an `emacsclient --eval` call whose return value was
 * produced by `(json-serialize (list :result STRING))` (see `run()`).
 *
 * Going through JSON (rather than trying to parse Emacs's own `prin1`/`pp`
 * escaping directly) sidesteps a subtlety: `emacsclient`'s reply channel is
 * line-oriented, so the server forces embedded newlines (and possibly other
 * control characters) in the *returned* string to be escaped for transport
 * -- this happens regardless of `print-escape-newlines` and friends, since
 * it's a wire-protocol necessity rather than an ordinary `prin1` setting.
 * Encoding the payload as JSON first means the only characters the outer
 * Lisp layer ever needs to escape are `"` and `\`, which `unwrapLispString`
 * already handles, and `JSON.parse` reliably handles everything else
 * (newlines, unicode, control characters, ...).
 */
function parseEmacsClientResult(printed: string): string {
  const json = unwrapLispString(printed);
  return (JSON.parse(json) as { result: string }).result;
}

/**
 * Pause execution synchronously for the given number of milliseconds.
 *
 * Used while polling for the Emacs daemon socket to become available,
 * without needing to make the whole `Emacs` API asynchronous.
 */
function sleepSync(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/**
 * The dynamically-scoped Lisp variable that the Org document content is
 * made available through while a `run()` call is being evaluated.
 *
 * The file it points to is written and cleaned up per-call by `Emacs.run`.
 */
export const inputFileVariable = a`svelte-preprocess-org--input-file`;

/**
 * An Emacs instance for evaluating S-expressions.
 *
 * Rather than spawning a fresh `emacs --batch` process (and reloading Org,
 * `ox`, `ox-svelte`, etc. from scratch) for every call, this class starts a
 * single Emacs daemon lazily on first use and reuses it for every
 * subsequent `run()` call by talking to it through `emacsclient`. Since
 * each Emacs instance constructed from this class is assigned its own
 * temporary directory as its init directory, any persistent state that
 * needs to be preserved between evaluations can be stored in that
 * directory (e.g. in the .eld files).
 *
 * The daemon is intentionally spawned with its stdio ignored and
 * `unref()`'d, and is killed when this process exits. Without that, the
 * daemon's open stdio pipes keep Node's event loop alive, which is
 * harmless for a long-lived dev server but means a one-shot process (e.g.
 * `vite build`) would hang forever waiting for a daemon nobody asked it to
 * wait for.
 */
export class Emacs {
  /**
   * Directory that will be used as the `user-emacs-directory`.
   */
  private initDirectory: string;

  /**
   * Largest amount of data in bytes allowed on stdout or stderr.
   */
  private maxBuffer: number;

  /**
   * Unique `emacsclient`/`emacs --fg-daemon` socket name for this instance,
   * so multiple preprocessor instances (e.g. concurrent projects) never
   * collide on the same socket.
   */
  private socketName: string;

  /**
   * The running daemon child process, if any.
   */
  private daemonProcess: ChildProcess | null = null;

  /**
   * Whether the daemon has been confirmed reachable via `emacsclient`.
   */
  private daemonReady = false;

  /**
   * Whether the process-exit cleanup handler has already been registered.
   */
  private exitHandlerRegistered = false;

  /**
   * S-expression to evaluate when `run` method is called.
   */
  private sexps: Sexp[] = [];

  /**
   * String value to be piped into the standard input.
   */
  private stdin: string = "";

  /**
   * How many times to poll `emacsclient` while waiting for the daemon to
   * finish starting up.
   */
  private static readonly MAX_CONNECT_ATTEMPTS = 40;

  /**
   * Delay between connection attempts while waiting for the daemon, in
   * milliseconds.
   */
  private static readonly CONNECT_RETRY_DELAY_MS = 250;

  /**
   * Initialize a new Emacs instance.
   *
   * This does not start the daemon yet; it is started lazily on the first
   * `run()` call. `opts` is optional and defaults match `orgPreprocess`'s
   * own defaults (see `index.ts`).
   *
   * @param opts -
   */
  constructor(opts?: Partial<EmacsCustomization>) {
    this.initDirectory =
      opts?.initDirectory ??
      mkdtempSync(join(tmpdir(), "svelte-preprocess-org-"));
    this.maxBuffer = opts?.maxBuffer ?? 10 * 1024 * 1024; // 10 MiB
    this.socketName = `svelte-preprocess-org-${randomUUID()}`;
  }

  /**
   * Register the features/packages to require.
   *
   * This function will append to the previous value.
   * The `run` call will not reset this value.
   */
  require(feature: string, filename?: string) {
    this.sexps.push(
      filename
        ? list(a`require`, quote(a`${feature}`), filename)
        : list(a`require`, quote(a`${feature}`)),
    );

    return this;
  }

  /**
   * Register S-expressions to evaluate.
   *
   * This function will append to the previous value.
   * The `run` call will reset this value.
   */
  progn(...sexps: Sexp[]) {
    this.sexps.push(...sexps);

    return this;
  }

  /**
   * Register the string to be fed into the standard input.
   *
   * This function will replace the previous value.
   * The `run` call will reset this value.
   */
  minibuffer(content: string) {
    this.stdin = content;

    return this;
  }

  /**
   * Spawn the Emacs daemon if it is not already running.
   */
  private ensureDaemon(): void {
    if (this.daemonProcess && this.daemonProcess.exitCode === null) {
      return;
    }

    const daemon = spawn(
      "emacs",
      [
        `--fg-daemon=${this.socketName}`,
        `--init-directory=${this.initDirectory}`,
      ],
      {
        // Ignore stdio and unref the child so a lingering daemon never
        // keeps a one-shot process (e.g. `vite build`) from exiting.
        stdio: "ignore",
      },
    );
    daemon.unref();

    this.daemonProcess = daemon;
    this.daemonReady = false;

    if (!this.exitHandlerRegistered) {
      this.exitHandlerRegistered = true;

      // Covers process.exit() and the event loop draining naturally
      // (e.g. a one-shot `vite build` finishing).
      process.once("exit", () => this.shutdown());

      // 'exit' alone isn't reliably emitted for signal-terminated
      // processes unless something is listening for the signal itself
      // (e.g. Ctrl-C, or a CI job being cancelled with SIGTERM). Handle
      // those explicitly, then re-raise the signal so the process still
      // exits with its conventional signal-based exit code.
      for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"] as const) {
        process.once(signal, () => {
          this.shutdown();
          process.kill(process.pid, signal);
        });
      }
    }
  }

  /**
   * Make sure the daemon is running and reachable via `emacsclient`,
   * blocking (synchronously) until it is or until we give up.
   */
  private ensureDaemonReady(): void {
    if (this.daemonReady) {
      return;
    }

    this.ensureDaemon();

    for (let attempt = 0; attempt < Emacs.MAX_CONNECT_ATTEMPTS; attempt++) {
      const { status, error } = spawnSync("emacsclient", [
        `--socket-name=${this.socketName}`,
        "--eval",
        "t",
      ]);

      if (!error && status === 0) {
        this.daemonReady = true;
        return;
      }

      sleepSync(Emacs.CONNECT_RETRY_DELAY_MS);
    }

    throw new Error(
      `Timed out waiting for the Emacs daemon (socket "${this.socketName}") to start.`,
    );
  }

  /**
   * Kill the Emacs daemon, if it is running.
   *
   * This is called automatically when the current process exits, but can
   * also be called manually (e.g. in tests) to tear it down earlier.
   */
  shutdown(): void {
    if (this.daemonProcess && this.daemonProcess.exitCode === null) {
      this.daemonProcess.kill();
    }
    this.daemonProcess = null;
    this.daemonReady = false;
  }

  /**
   * Run the registered S-expressions in Emacs.
   *
   * @returns The standard output of the Emacs process.
   */
  run(): string {
    this.ensureDaemonReady();

    // Content can't be streamed over stdin to a running daemon the way it
    // can be to a fresh `emacs --batch` process, so it is handed off
    // through a scratch file instead, and made available to the
    // S-expressions via `inputFileVariable`.
    const scratchDirectory = mkdtempSync(
      join(tmpdir(), "svelte-preprocess-org-io-"),
    );

    try {
      const inputFile = join(scratchDirectory, "input");
      writeFileSync(inputFile, this.stdin);

      // Similarly, `princ`/`prin1`/etc. output can't be captured off a
      // daemon's stdout, since evaluation happens in a process that was
      // already running. Instead, `standard-output` is rebound to a
      // throwaway buffer for the duration of the evaluation, and that
      // buffer's contents become the return value of the whole form,
      // which `emacsclient --eval` prints back to us as a Lisp string.
      const form = list(
        a`let`,
        list(
          list(inputFileVariable, inputFile),
          list(
            a`standard-output`,
            list(a`generate-new-buffer`, ` *svelte-preprocess-org-output*`),
          ),
        ),
        list(
          a`unwind-protect`,
          list(
            a`progn`,
            ...this.sexps,
            // See `parseEmacsClientResult` for why the result is wrapped
            // in JSON rather than returned as a plain string.
            list(
              a`json-serialize`,
              list(
                a`list`,
                k`result`,
                list(
                  a`with-current-buffer`,
                  a`standard-output`,
                  list(a`buffer-string`),
                ),
              ),
            ),
          ),
          list(a`kill-buffer`, a`standard-output`),
        ),
      );

      const { stdout, stderr, status, error } = spawnSync(
        "emacsclient",
        [`--socket-name=${this.socketName}`, "--eval", stringify(form)],
        { maxBuffer: this.maxBuffer },
      );

      if (error || status !== 0) {
        // The daemon may have died or otherwise become unreachable; make
        // sure the next call restarts it instead of retrying forever.
        this.daemonReady = false;
        throw new Error(`Error running Emacs: ${stderr}`, { cause: error });
      }

      // Reset the S-expressions and stdin for the next run.
      this.sexps = [];
      this.stdin = "";

      return parseEmacsClientResult(stdout.toString());
    } finally {
      rmSync(scratchDirectory, { recursive: true, force: true });
    }
  }
}
