import type { CollectionConfig } from 'payload'

export const PersonaAnalytics: CollectionConfig = {
  slug: 'persona-analytics',
  admin: {
    useAsTitle: 'persona',
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
      name: 'persona',
      type: 'relationship',
      relationTo: 'personas',
      required: true,
    },
    {
      name: 'bot',
      type: 'relationship',
      relationTo: 'bot',
      required: true,
    },
    {
      name: 'analysis_period',
      type: 'select',
      required: true,
      options: [
        { label: 'Daily', value: 'daily' },
        { label: 'Weekly', value: 'weekly' },
        { label: 'Monthly', value: 'monthly' },
        { label: 'Quarterly', value: 'quarterly' },
        { label: 'Yearly', value: 'yearly' },
        { label: 'Conversation Session', value: 'session' },
        { label: 'Custom Range', value: 'custom' },
      ],
    },
    {
      name: 'period_start_date',
      type: 'date',
      required: true,
    },
    {
      name: 'period_end_date',
      type: 'date',
      required: true,
    },
    {
      name: 'usage_metrics',
      type: 'group',
      fields: [
        {
          name: 'total_interactions',
          type: 'number',
          defaultValue: 0,
          admin: {
            description: 'Total number of interactions with this persona',
          },
        },
        {
          name: 'total_conversation_time_minutes',
          type: 'number',
          defaultValue: 0,
          admin: {
            description: 'Total time spent in conversation (minutes)',
          },
        },
        {
          name: 'average_session_duration_minutes',
          type: 'number',
          min: 0,
          admin: {
            description: 'Average duration of each session (minutes)',
          },
        },
        {
          name: 'interaction_frequency',
          type: 'number',
          min: 0,
          admin: {
            description: 'Number of interactions per day on average',
          },
        },
        {
          name: 'return_user_rate_percentage',
          type: 'number',
          min: 0,
          max: 100,
          admin: {
            description: 'Percentage of users who return to use this persona',
          },
        },
        {
          name: 'unique_users_count',
          type: 'number',
          defaultValue: 0,
          admin: {
            description: 'Number of unique users who interacted with this persona',
          },
        },
      ],
    },
    {
      name: 'engagement_metrics',
      type: 'group',
      fields: [
        {
          name: 'message_response_rate',
          type: 'number',
          min: 0,
          max: 100,
          admin: {
            description: 'Percentage of user messages that received responses',
          },
        },
        {
          name: 'average_conversation_length',
          type: 'number',
          min: 0,
          admin: {
            description: 'Average number of messages per conversation',
          },
        },
        {
          name: 'conversation_completion_rate',
          type: 'number',
          min: 0,
          max: 100,
          admin: {
            description: 'Percentage of conversations that reach natural completion',
          },
        },
        {
          name: 'user_satisfaction_score',
          type: 'number',
          min: 0,
          max: 10,
          admin: {
            description: 'Average user satisfaction score (1-10)',
          },
        },
        {
          name: 'persona_switch_rate',
          type: 'number',
          min: 0,
          max: 100,
          admin: {
            description: 'Percentage of users who switch to different personas',
          },
        },
        {
          name: 'repeat_interaction_rate',
          type: 'number',
          min: 0,
          max: 100,
          admin: {
            description: 'Percentage of users who interact with persona multiple times',
          },
        },
      ],
    },
    {
      name: 'persona_effectiveness',
      type: 'group',
      fields: [
        {
          name: 'persona_consistency_score',
          type: 'number',
          min: 0,
          max: 10,
          admin: {
            description: 'How consistently the persona maintains its character (1-10)',
          },
        },
        {
          name: 'persona_relevance_score',
          type: 'number',
          min: 0,
          max: 10,
          admin: {
            description: 'How relevant the persona responses are (1-10)',
          },
        },
        {
          name: 'persona_creativity_score',
          type: 'number',
          min: 0,
          max: 10,
          admin: {
            description: 'How creative the persona responses are (1-10)',
          },
        },
        {
          name: 'persona_engagement_score',
          type: 'number',
          min: 0,
          max: 10,
          admin: {
            description: 'How engaging the persona is (1-10)',
          },
        },
        {
          name: 'persona_helpfulness_score',
          type: 'number',
          min: 0,
          max: 10,
          admin: {
            description: 'How helpful the persona is (1-10)',
          },
        },
        {
          name: 'persona_appropriateness_score',
          type: 'number',
          min: 0,
          max: 10,
          admin: {
            description: 'How appropriate the persona responses are (1-10)',
          },
        },
      ],
    },
    {
      name: 'conversation_quality',
      type: 'group',
      fields: [
        {
          name: 'response_relevance_percentage',
          type: 'number',
          min: 0,
          max: 100,
          admin: {
            description: 'Percentage of responses deemed relevant by users',
          },
        },
        {
          name: 'response_accuracy_percentage',
          type: 'number',
          min: 0,
          max: 100,
          admin: {
            description: 'Percentage of responses that are factually accurate',
          },
        },
        {
          name: 'response_completeness_score',
          type: 'number',
          min: 0,
          max: 10,
          admin: {
            description: 'How complete the responses are (1-10)',
          },
        },
        {
          name: 'conversation_flow_score',
          type: 'number',
          min: 0,
          max: 10,
          admin: {
            description: 'How natural the conversation flow feels (1-10)',
          },
        },
        {
          name: 'context_understanding_score',
          type: 'number',
          min: 0,
          max: 10,
          admin: {
            description: 'How well the persona understands context (1-10)',
          },
        },
        {
          name: 'emotional_intelligence_score',
          type: 'number',
          min: 0,
          max: 10,
          admin: {
            description: 'How well the persona recognizes and responds to emotions (1-10)',
          },
        },
      ],
    },
    {
      name: 'user_feedback',
      type: 'group',
      fields: [
        {
          name: 'positive_feedback_count',
          type: 'number',
          defaultValue: 0,
          admin: {
            description: 'Number of positive feedback messages',
          },
        },
        {
          name: 'negative_feedback_count',
          type: 'number',
          defaultValue: 0,
          admin: {
            description: 'Number of negative feedback messages',
          },
        },
        {
          name: 'neutral_feedback_count',
          type: 'number',
          defaultValue: 0,
          admin: {
            description: 'Number of neutral feedback messages',
          },
        },
        {
          name: 'user_suggestions_count',
          type: 'number',
          defaultValue: 0,
          admin: {
            description: 'Number of improvement suggestions from users',
          },
        },
        {
          name: 'common_praise_topics',
          type: 'text',
          admin: {
            placeholder: 'topic1, topic2, topic3',
            description: 'Most commonly praised aspects',
          },
        },
        {
          name: 'common_criticism_topics',
          type: 'text',
          admin: {
            placeholder: 'topic1, topic2, topic3',
            description: 'Most commonly criticized aspects',
          },
        },
        {
          name: 'improvement_requests',
          type: 'textarea',
          admin: {
            description: 'User requests for persona improvements',
          },
        },
      ],
    },
    {
      name: 'technical_performance',
      type: 'group',
      fields: [
        {
          name: 'average_response_time_ms',
          type: 'number',
          min: 0,
          admin: {
            description: 'Average response time in milliseconds',
          },
        },
        {
          name: 'error_rate_percentage',
          type: 'number',
          min: 0,
          max: 100,
          admin: {
            description: 'Percentage of interactions that resulted in errors',
          },
        },
        {
          name: 'timeout_rate_percentage',
          type: 'number',
          min: 0,
          max: 100,
          admin: {
            description: 'Percentage of interactions that timed out',
          },
        },
        {
          name: 'system_resource_usage_score',
          type: 'number',
          min: 0,
          max: 10,
          admin: {
            description: 'Resource usage efficiency (1-10)',
          },
        },
        {
          name: 'availability_percentage',
          type: 'number',
          min: 0,
          max: 100,
          admin: {
            description: 'Percentage of time the persona was available',
          },
        },
      ],
    },
    {
      name: 'comparison_metrics',
      type: 'group',
      fields: [
        {
          name: 'ranking_among_personas',
          type: 'number',
          min: 1,
          admin: {
            description: 'Ranking among all personas by usage',
          },
        },
        {
          name: 'usage_percentage_of_total',
          type: 'number',
          min: 0,
          max: 100,
          admin: {
            description: 'Percentage of total persona usage this persona receives',
          },
        },
        {
          name: 'performance_vs_average',
          type: 'number',
          min: -10,
          max: 10,
          admin: {
            description: 'Performance difference from average persona (negative to positive)',
          },
        },
        {
          name: 'unique_strengths',
          type: 'text',
          admin: {
            placeholder: 'strength1, strength2',
            description: 'Areas where this persona excels compared to others',
          },
        },
        {
          name: 'areas_for_improvement',
          type: 'text',
          admin: {
            placeholder: 'area1, area2',
            description: 'Areas that need improvement compared to others',
          },
        },
      ],
    },
    {
      name: 'insights_and_recommendations',
      type: 'group',
      fields: [
        {
          name: 'key_insights',
          type: 'textarea',
          admin: {
            description: 'Key insights from persona performance analysis',
          },
        },
        {
          name: 'optimization_suggestions',
          type: 'textarea',
          admin: {
            description: 'Suggestions for optimizing persona performance',
          },
        },
        {
          name: 'training_recommendations',
          type: 'textarea',
          admin: {
            description: 'Recommendations for persona training improvements',
          },
        },
        {
          name: 'feature_requests',
          type: 'text',
          admin: {
            placeholder: 'feature1, feature2',
            description: 'New features users would like to see',
          },
        },
        {
          name: 'anomaly_flags',
          type: 'text',
          admin: {
            placeholder: 'anomaly1, anomaly2',
            description: 'Unusual patterns or anomalies detected',
          },
        },
      ],
    },
    {
      name: 'analysis_metadata',
      type: 'group',
      fields: [
        {
          name: 'analysis_version',
          type: 'text',
          defaultValue: '1.0',
          admin: {
            description: 'Version of analysis algorithm used',
          },
        },
        {
          name: 'data_points_analyzed',
          type: 'number',
          defaultValue: 0,
          admin: {
            description: 'Number of data points included in analysis',
          },
        },
        {
          name: 'processing_time_ms',
          type: 'number',
          min: 0,
          admin: {
            description: 'Time taken to complete analysis in milliseconds',
          },
        },
        {
          name: 'confidence_level',
          type: 'number',
          min: 0,
          max: 100,
          admin: {
            description: 'Overall confidence level of the analysis (%)',
          },
        },
        {
          name: 'last_updated',
          type: 'date',
          admin: {
            readOnly: true,
            description: 'When this analysis was last updated',
          },
        },
      ],
    },
    {
      name: 'generated_at',
      type: 'date',
      defaultValue: () => new Date(),
      admin: {
        readOnly: true,
        description: 'When this analysis was generated',
      },
    },
    {
      name: 'is_automated_analysis',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Whether this was generated by automated analysis',
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation === 'create' && req.user) {
          data.generated_at = new Date()
          data.analysis_metadata = {
            ...data.analysis_metadata,
            last_updated: new Date(),
          }
        }
        if (operation === 'update') {
          data.analysis_metadata = {
            ...data.analysis_metadata,
            last_updated: new Date(),
          }
        }
        return data
      },
    ],
  },
}
