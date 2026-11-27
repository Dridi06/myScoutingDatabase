# MESSINHO Linguistic Intelligence 1.3.2

**Status:** implemented on the feature branch; automated tests and staging branch CI passed. No Render deployment or database migration was performed for this change.

## Scope

The existing six-profile architecture is retained:
- German (de)
- English (en)
- French (fr)
- Modern Standard Arabic (ar)
- Tunisian Derja (ar-tn), Arabic script and Latin Arabizi
- Spanish (es)

## Changes in 1.3.2

- Expanded Tunisian Derja lexical markers for common spelling variants in Arabic script and Arabizi.
- Added detection of additional colloquial request forms with attached pronouns, including explain, correct and translate requests.
- Added a Tunisian rephrasing request form in Latin Arabizi.
- Added regression coverage for the new spellings and action intents.
- Added a Unicode-aware boundary guard so the beginning of a Modern Standard Arabic verb is not mistaken for a standalone Derja particle.

## Safety and fidelity rules

- Detection does not silently translate, rewrite or normalize the user's message.
- Arabizi digit substitutions remain conservative and are limited to recognizable Arabizi-shaped tokens.
- Identifiers, football age groups, formations, dates, scores and standalone statistics must remain unchanged.
- A language or target-language guess with insufficient evidence must remain ambiguous and trigger clarification when needed.
- Tunisian Derja remains distinct from Modern Standard Arabic; dialect writing is not treated as incorrect MSA.
- Language detection is a routing aid, not proof of native-level fluency or translation accuracy.

## Verification

- GitHub Node test workflow: successful on the current 1.3.2 commit.
- Backend syntax workflow: successful.
- Staging branch CI including production build: successful.
- Staging health smoke test: successful.
- Isolated engineering sandbox validation was still running at the time of this checkpoint.
- No Supabase migration was executed; no language knowledge rows were added or activated by this change.
- Render staging was not deployed; production and main were untouched.

## Known limitations / next work

1. Build a balanced, reviewed phrase test corpus for all six profiles, including code-switching and short ambiguous messages.
2. Add independent Tunisian Derja review for regional spelling and idiom variation.
3. Improve Arabic clitic and conjunction handling without destructive normalization.
4. Add translation-quality evaluation with source/target meaning, negation, modality, names, numbers and football terminology checks.
5. Evaluate target-language command recognition across colloquial forms in all supported profiles.
6. Expand first-party authored language knowledge only after content review; keep new entries versioned and traceable.
