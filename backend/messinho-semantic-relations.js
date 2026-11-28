/**
 * MESSINHO Semantic Relation Intelligence.
 *
 * Converts the existing bounded semantic frames into explicit, auditable
 * relation candidates. It does not claim full semantic parsing, resolve
 * pronouns, infer causality, or rewrite the user's source text.
 */
export const MESSINHO_SEMANTIC_RELATION_VERSION = '0.1.0';

const ALLOWED_CONCEPTS = new Set([
  'player_readiness', 'performance_quality', 'development',
  'capability', 'availability'
]);

function safeConcepts(frame) {
  return [...new Set((Array.isArray(frame?.concepts) ? frame.concepts : [])
    .filter(value => ALLOWED_CONCEPTS.has(value)))].slice(0, 8);
}

function safeCueList(frame, key) {
  const values = frame?.cues?.[key];
  return Array.isArray(values) ? values.filter(value => typeof value === 'string').slice(0, 8) : [];
}

/**
 * Analyze only relations directly supported by already-detected lexical and
 * discourse evidence. Every output is a candidate with unresolved scope.
 */
export function buildMessinhoSemanticRelationAnalysis(inputFrames) {
  const frames = (Array.isArray(inputFrames) ? inputFrames : []).slice(0, 12);
  const relations = [];

  for (let index = 0; index < frames.length; index += 1) {
    const frame = frames[index];
    const concepts = safeConcepts(frame);
    const previousConcepts = index > 0 ? safeConcepts(frames[index - 1]) : [];
    const negation = safeCueList(frame, 'negation_scope_cues');
    const uncertainty = safeCueList(frame, 'uncertainty_cues');
    const contrast = safeCueList(frame, 'contrast_cues');

    if (concepts.length && (negation.length || uncertainty.length)) {
      relations.push({
        type: 'qualification_candidate',
        frame_index: index,
        concepts,
        evidence: [...negation, ...uncertainty],
        scope: 'segment_level_unresolved',
        confidence: 0.4
      });
    }

    if (index > 0 && previousConcepts.length && concepts.length && contrast.length) {
      relations.push({
        type: 'contrast_candidate',
        from_frame_index: index - 1,
        to_frame_index: index,
        from_concepts: previousConcepts,
        to_concepts: concepts,
        evidence: contrast,
        scope: 'between_adjacent_segments_candidate',
        confidence: 0.45
      });
    }

    if (index > 0 && concepts.length) {
      const recurring = concepts.filter(concept => previousConcepts.includes(concept));
      if (recurring.length) {
        relations.push({
          type: 'concept_recurrence_candidate',
          from_frame_index: index - 1,
          to_frame_index: index,
          concepts: recurring,
          scope: 'cross_segment_topic_continuity_candidate',
          confidence: 0.5
        });
      }
    }

    if (relations.length >= 30) break;
  }

  return {
    version: MESSINHO_SEMANTIC_RELATION_VERSION,
    status: relations.length ? 'candidate_relations_found' : 'no_supported_relations',
    relation_count: relations.length,
    relations,
    source_text_preserved: true,
    method: 'bounded_relation_candidates_from_existing_semantic_frames',
    limitations: [
      'Relations are candidates based on lexical/discourse cues, not verified meaning.',
      'Negation and uncertainty scope remain unresolved at segment level.',
      'No pronoun/entity resolution, sarcasm detection, causal inference or full semantic parsing is performed.',
      'Missing cues do not prove that a relation is absent.'
    ]
  };
}
