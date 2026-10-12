# AI handwriting recognition

`/handwriting-recognize` is a separate endpoint. It accepts only a cropped PNG from the drawing pad and returns up to 10 candidate characters for the user to choose. It uses `HANDWRITING_MODEL` when configured and otherwise defaults to `gemini-3.5-flash-lite`. It requires network access, sign-in, `GEMINI_API_KEY`, and `FIREBASE_API_KEY`; local recognition continues to work offline. Calling AI does not opt in to sample sharing.

Sample contribution still requires the separate checkbox and explicit character confirmation. Stored samples record the suggestion source (`local`, `ai`, or `manual`) and remain `pending` until review. Apply `migrations/0002_handwriting_suggestion_source.sql` to the existing D1 database before deploying the new Worker bundle. Pending samples are not training data, and this change does not train a model.
