import type { ModelCatalog } from '../packages/runtime/src/models';
export const modelFixture: ModelCatalog = {
  defaultModel: 'fixture-thinking',
  defaultReasoningEffort: 'high',
  models: [
    {
      id: 'fixture-fast',
      model: 'fixture-fast',
      displayName: 'Fixture Fast',
      hidden: false,
      isDefault: true,
      defaultReasoningEffort: 'low',
      supportedReasoningEfforts: [{ reasoningEffort: 'low', description: 'Low' }],
    },
    {
      id: 'fixture-thinking',
      model: 'fixture-thinking',
      displayName: 'Fixture Thinking',
      hidden: false,
      isDefault: false,
      defaultReasoningEffort: 'low',
      supportedReasoningEfforts: [
        { reasoningEffort: 'low', description: 'Low' },
        { reasoningEffort: 'high', description: 'High' },
      ],
    },
  ],
};
