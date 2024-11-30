;;; convert.el --- Read Org-mode files from stdin and write Svelte components to stdout.

;; Author: RangHo Lee <hello@rangho.me>

;;; Commentary:

;; This script accepts the content of an Org-mode file from stdin, converts it
;; to a Svelte component, and writes the result to stdout.  This is an Emacs
;; Lisp script; that is, it needs to be run with Emacs in batch mode.
;;
;; It uses `ox-svelte' to perform the conversion.  Make sure that `ox-svelte'
;; repository is checked out in the same directory, preferably as a git
;; submodule.
;;
;; This script accepts the following command line arguments:
;;     --preface <elisp-code>
;;         Evaluate the given Elisp code before processing.
;;     --latex-environment-format <format>
;;         Set the format of LaTeX environment to <format>.  The format string
;;         should contain a single `%s' with which the LaTeX environment content
;;         will be replaced as a JavaScript raw string.
;;     --latex-fragment-format <format>
;;         Set the format of LaTeX fragment to <format>.  The format string
;;         should contain a single `%s' with which the LaTeX fragment content
;;         will be replaced as a JavaScript raw string.
;;     --src-block-format <format>
;;         Set the format of source block to <format>.  The format string should
;;         contain two `%s' with which the language and the content of the src
;;         block will be replaced as a JavaScript raw string.
;;
;; To allow more smooth preprocessor chaning, this script sets some arbitrary
;; options to Org-mode exporter engine.  You can customize the behavior of the
;; exporter by setting command line arguments, or by providing preface S-exps.

;;; Code:

(require 'ox-svelte
         (expand-file-name "ox-svelte.el"
                           (file-name-directory load-file-name)))

;; Set default settings
(setq org-export-with-section-numbers nil)

;; Process command line arguments
(let ((i 0))
  (while (elt argv i)
    (cond
     ;; Evaluate the preface S-exp if provided
     ((string= (elt argv i) "--preface")
      (eval (car (read-from-string (elt argv (1+ i)))))
      (setq i (1+ i)))

     ;; Set the LaTeX environment format
     ((string= (elt argv i) "--latex-environment-format")
      (setq org-svelte-latex-environment-format (elt argv (1+ i)))
      (setq i (1+ i)))

     ;; Set the LaTeX fragment format
     ((string= (elt argv i) "--latex-fragment-format")
      (setq org-svelte-latex-fragment-format (elt argv (1+ i)))
      (setq i (1+ i)))

     ;; Set the source block format
     ((string= (elt argv i) "--src-block-format")
      (setq org-svelte-src-block-format (elt argv (1+ i)))
      (setq i (1+ i)))

     ;; No match found, warn the user and do nothing
     (t
      (warn (format "Unsupported argument: %s" (elt argv i)))))

    (setq i (1+ i))))

;; Read the content of the Org-mode file from stdin and convert
(with-temp-buffer
  (while (condition-case err
      (setq line (read-from-minibuffer ""))
      (error nil))
    (insert line "\n"))
  (org-svelte-export-as-svelte)
  (princ (buffer-string)))

;; Exit Emacs after conversion to prevent unnecessary errors
(kill-emacs 0)

;;; convert.el ends here
