import type { CollectionConfig } from 'payload'

export const MemoryInsights: CollectionConfig = {
  slug: 'memory-insights',
  admin: {
    useAsTitle: 'user',
  },
  access: {
    read: ({ req: { user } }) => {
      return {
        user: {
          equals: user?.id,
        },
      }
    },
    create: ({ req: { user } }) => {
      return {
        user: {
          equals: user?.id,
        },
      }
    },
    update: ({ req: { user } }) => {
      return {
        user: {
          equals: user?.id,
        },
      }
    },
    delete: ({ req: { user } }) => {
      return {
        user: {
          equals: user?.id,
        },
      }
    },
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'bot',
      type: 'relationship',
      relationTo: 'bot',
      required: true,
    },
    {
      name: 'conversation',
      type: 'relationship',
      relationTo: 'conversation',
    },
    {
      name: 'period',
      type: 'select',
      required: true,
      options: [
        { label: 'Daily', value: 'daily' },
        { label: 'Weekly', value: 'weekly' },
        { label: 'Monthly', value: 'monthly' },
        { label: 'Quarterly', value: 'quarterly' },
        { label: 'Yearly', value: 'yearly' },
        { label: 'Session', value: 'session' },
        { label: 'Custom', value: 'custom' },
      ],
    },
    {
      name: 'start_date',
      type: 'date',
      required: true,
    },
    {
      name: 'end_date',
      type: 'date',
      required: true,
    },
    {
      name: 'total_memories_created',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'total_memories_accessed',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'memory_recall_accuracy',
      type: 'number',
      min: 0,
      max: 100,
    },
    {
      name: 'context_relevance_score',
      type: 'number',
      min: 0,
      max: 10,
    },
    {
      name: 'story_continuity_score',
      type: 'number',
      min: 0,
      max: 10,
    },
    {
      name: 'episodic_memories',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'semantic_memories',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'procedural_memories',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'emotional_memories',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'total_conversations',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'avg_conversation_length',
      type: 'number',
      min: 0,
    },
    {
      name: 'topic_diversity_score',
      type: 'number',
      min: 0,
      max: 10,
    },
    {
      name: 'sentiment_trend',
      type: 'select',
      options: [
        { label: 'Very Negative', value: 'very-negative' },
        { label: 'Negative', value: 'negative' },
        { label: 'Neutral', value: 'neutral' },
        { label: 'Positive', value: 'positive' },
        { label: 'Very Positive', value: 'very-positive' },
        { label: 'Mixed', value: 'mixed' },
        { label: 'Fluctuating', value: 'fluctuating' },
      ],
    },
    {
      name: 'learning_velocity',
      type: 'number',
      min: 0,
      max: 10,
    },
    {
      name: 'retention_rate',
      type: 'number',
      min: 0,
      max: 100,
    },
    {
      name: 'pattern_accuracy',
      type: 'number',
      min: 0,
      max: 100,
    },
    {
      name: 'adaptation_score',
      type: 'number',
      min: 0,
      max: 10,
    },
    {
      name: 'access_speed_ms',
      type: 'number',
      min: 0,
    },
    {
      name: 'search_accuracy',
      type: 'number',
      min: 0,
      max: 100,
    },
    {
      name: 'confidence_score',
      type: 'number',
      min: 0,
      max: 10,
    },
    {
      name: 'key_insights',
      type: 'textarea',
    },
    {
      name: 'suggestions',
      type: 'textarea',
    },
    {
      name: 'anomaly_flags',
      type: 'text',
    },
    {
      name: 'analysis_version',
      type: 'text',
      defaultValue: '1.0',
    },
    {
      name: 'data_points',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'processing_time_ms',
      type: 'number',
      min: 0,
    },
    {
      name: 'confidence_level',
      type: 'number',
      min: 0,
      max: 100,
    },
    {
      name: 'generated_at',
      type: 'date',
      defaultValue: () => new Date(),
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'is_automated',
      type: 'checkbox',
      defaultValue: true,
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation === 'create' && req.user) {
          data.generated_at = new Date()
        }
        return data
      },
    ],
  },
}
