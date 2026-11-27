# MESSINHO Linguistic Intelligence 1.3.3

Date: 2026-11-27  
Branch: `feature/messinho-unified-ai-integration`

## Scope

This release improves conservative Modern Standard Arabic (MSA) detection when Arabic conjunctions are attached directly to a word. It is a scoring improvement only: the original message is retained and no text is silently normalized or rewritten.

## Changes

- Version `backend/messinho-linguistic-intelligence.js` to 1.3.3.
- Add a scoring-only matcher for one attached Arabic conjunction prefix: `و` or `ف`.
- Count the attached form only when removing exactly that one prefix yields a token already present in the reviewed MSA lexicon.
- Keep exact lexicon matches first, so dialect terms such as `فما` remain intact.
- Do not strip multiple prefixes, alter the token, or change the stored/source message.
- Add regression coverage for attached conjunctions, MSA versus Tunisian Derja, six-language examples with negation, uncertainty and the football identifier `U19`, plus colloquial translation-target requests in all six profiles.

## Safety and fidelity

- No destructive Arabic normalization.
- No automatic translation or rewriting.
- No change to Arabizi digit normalization or football identifiers.
- Ambiguous language input remains ambiguous; language scoring is a routing aid, not a claim of native-level fluency.
- The six profiles remain German, English, French, Modern Standard Arabic, Tunisian Derja (Arabic script and Latin Arabizi), and Spanish.

## Verification status

- Changes are committed on the feature branch only.
- Backend syntax, full staging branch CI including Vite production build, and staging health smoke are successful on `c1b5009a9c8942d7081ac92729c4f881dc993c29`.
- The isolated engineering sandbox is still running its baseline validation; no candidate-patch dispatch/callback was executed.
- The previous 1.3.2 commit had successful Node tests, backend syntax, staging branch CI, health smoke, and isolated baseline toolchain validation.
- The isolated sandbox's successful baseline run did not execute a live candidate-patch dispatch/callback round trip.
- No Supabase migration or knowledge-row write is part of this change.
- Render staging is not deployed. Auto-deploy remains disabled.
- `main`, production and production data remain untouched.

## Next work

1. Review and extend the six-language phrase corpus with short ambiguous utterances and realistic code-switching.
2. Add a quality evaluation harness for translation fidelity: negation, modality, names, numbers and football terminology.
3. Improve target-language command recognition in colloquial German, English, French, MSA, Tunisian Derja and Spanish.
4. Obtain independent native-speaker review for Tunisian Derja variants.
5. Keep all new language-knowledge entries versioned, sourced and reviewed before activation.
