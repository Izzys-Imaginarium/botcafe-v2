import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

// Terms of Service content in Payload's lexical format
const termsOfServiceContent = {
  root: {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text: 'Welcome to BotCafé! These Terms of Service ("Terms") govern your access to and use of the BotCafé platform, including our website, services, and applications (collectively, the "Service"). By accessing or using the Service, you agree to be bound by these Terms.',
          },
        ],
      },
      {
        type: 'heading',
        tag: 'h2',
        children: [{ type: 'text', text: '1. Acceptance of Terms' }],
      },
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text: 'By creating an account or using the Service, you confirm that you are at least 13 years old (or the minimum age required in your jurisdiction) and have the legal capacity to enter into this agreement. If you are using the Service on behalf of an organization, you represent that you have the authority to bind that organization to these Terms.',
          },
        ],
      },
      {
        type: 'heading',
        tag: 'h2',
        children: [{ type: 'text', text: '2. Description of Service' }],
      },
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text: 'BotCafé is a platform that enables users to create, customize, and interact with AI-powered chatbots and companions. The Service includes:',
          },
        ],
      },
      {
        type: 'list',
        listType: 'bullet',
        children: [
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Creation and management of AI chatbots with customizable personalities',
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Conversation interfaces for interacting with AI companions',
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              { type: 'text', text: 'Knowledge base and memory systems for personalized interactions' },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Creator tools for publishing and sharing bots with the community',
              },
            ],
          },
          {
            type: 'listitem',
            children: [{ type: 'text', text: 'Social features including following creators and favoriting bots' }],
          },
        ],
      },
      {
        type: 'heading',
        tag: 'h2',
        children: [{ type: 'text', text: '3. User Accounts' }],
      },
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text: 'To access certain features of the Service, you must create an account. You agree to:',
          },
        ],
      },
      {
        type: 'list',
        listType: 'bullet',
        children: [
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Provide accurate, current, and complete information during registration',
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              { type: 'text', text: 'Maintain the security of your account credentials' },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Promptly update your account information if it changes',
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Accept responsibility for all activities that occur under your account',
              },
            ],
          },
        ],
      },
      {
        type: 'heading',
        tag: 'h2',
        children: [{ type: 'text', text: '4. User Content and Conduct' }],
      },
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text: 'You retain ownership of content you create on the Service ("User Content"). By posting User Content, you grant BotCafé a worldwide, non-exclusive, royalty-free license to use, display, and distribute your content as necessary to provide the Service.',
          },
        ],
      },
      {
        type: 'paragraph',
        children: [
          { type: 'text', text: 'You agree ', format: 0 },
          { type: 'text', text: 'not', format: 1 },
          { type: 'text', text: ' to create or share content that:' },
        ],
      },
      {
        type: 'list',
        listType: 'bullet',
        children: [
          {
            type: 'listitem',
            children: [
              { type: 'text', text: 'Is illegal, harmful, threatening, abusive, or harassing' },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Violates the rights of others, including intellectual property rights',
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Contains malware, viruses, or other malicious code',
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Impersonates any person or entity without authorization',
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Promotes violence, discrimination, or illegal activities',
              },
            ],
          },
        ],
      },
      {
        type: 'heading',
        tag: 'h2',
        children: [{ type: 'text', text: '5. AI-Generated Content' }],
      },
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text: 'The Service uses artificial intelligence to generate responses and content. You acknowledge that:',
          },
        ],
      },
      {
        type: 'list',
        listType: 'bullet',
        children: [
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'AI-generated content may not always be accurate, appropriate, or suitable for your purposes',
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'AI responses do not constitute professional advice (legal, medical, financial, etc.)',
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'You are responsible for evaluating and using AI-generated content appropriately',
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'BotCafé does not guarantee the accuracy or reliability of AI outputs',
              },
            ],
          },
        ],
      },
      {
        type: 'heading',
        tag: 'h2',
        children: [{ type: 'text', text: '6. Intellectual Property' }],
      },
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text: 'The Service, including its design, features, and content (excluding User Content), is owned by BotCafé and protected by intellectual property laws. You may not copy, modify, distribute, or create derivative works from the Service without our express permission.',
          },
        ],
      },
      {
        type: 'heading',
        tag: 'h2',
        children: [{ type: 'text', text: '7. Privacy' }],
      },
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text: 'Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your information. By using the Service, you consent to our data practices as described in the Privacy Policy.',
          },
        ],
      },
      {
        type: 'heading',
        tag: 'h2',
        children: [{ type: 'text', text: '8. Termination' }],
      },
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text: 'We may suspend or terminate your account if you violate these Terms or engage in conduct that we determine is harmful to the Service, other users, or third parties. You may delete your account at any time through your account settings.',
          },
        ],
      },
      {
        type: 'heading',
        tag: 'h2',
        children: [{ type: 'text', text: '9. Disclaimers and Limitations' }],
      },
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text: 'THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. TO THE MAXIMUM EXTENT PERMITTED BY LAW, BOTCAFÉ DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED. WE DO NOT GUARANTEE UNINTERRUPTED OR ERROR-FREE SERVICE.',
          },
        ],
      },
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text: 'IN NO EVENT SHALL BOTCAFÉ BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE.',
          },
        ],
      },
      {
        type: 'heading',
        tag: 'h2',
        children: [{ type: 'text', text: '10. Changes to Terms' }],
      },
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text: 'We may update these Terms from time to time. We will notify you of significant changes by posting a notice on the Service or sending you an email. Your continued use of the Service after changes take effect constitutes acceptance of the new Terms.',
          },
        ],
      },
      {
        type: 'heading',
        tag: 'h2',
        children: [{ type: 'text', text: '11. Contact Us' }],
      },
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text: 'If you have questions about these Terms, please contact us through our Discord community or help center.',
          },
        ],
      },
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  },
}

// Privacy Policy content
const privacyPolicyContent = {
  root: {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text: 'At BotCafé, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service.',
          },
        ],
      },
      {
        type: 'heading',
        tag: 'h2',
        children: [{ type: 'text', text: '1. Information We Collect' }],
      },
      {
        type: 'heading',
        tag: 'h3',
        children: [{ type: 'text', text: '1.1 Information You Provide' }],
      },
      {
        type: 'list',
        listType: 'bullet',
        children: [
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Account information: email address, username, display name, and profile picture',
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'User content: bots you create, conversation histories, knowledge entries, and memories',
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Communications: messages you send to us for support or feedback',
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Creator profile information: bio, social links, and portfolio details (if you become a creator)',
              },
            ],
          },
        ],
      },
      {
        type: 'heading',
        tag: 'h3',
        children: [{ type: 'text', text: '1.2 Information Collected Automatically' }],
      },
      {
        type: 'list',
        listType: 'bullet',
        children: [
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Usage data: pages visited, features used, interactions with bots, and session duration',
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Device information: browser type, operating system, and device identifiers',
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Log data: IP address, access times, and referring URLs',
              },
            ],
          },
        ],
      },
      {
        type: 'heading',
        tag: 'h2',
        children: [{ type: 'text', text: '2. How We Use Your Information' }],
      },
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'We use the information we collect to:' }],
      },
      {
        type: 'list',
        listType: 'bullet',
        children: [
          {
            type: 'listitem',
            children: [
              { type: 'text', text: 'Provide, maintain, and improve the Service' },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Personalize your experience and deliver relevant content',
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              { type: 'text', text: 'Process transactions and send related information' },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Send you technical notices, updates, security alerts, and support messages',
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Respond to your comments, questions, and requests',
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Monitor and analyze trends, usage, and activities',
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Detect, investigate, and prevent fraudulent transactions and abuse',
              },
            ],
          },
        ],
      },
      {
        type: 'heading',
        tag: 'h2',
        children: [{ type: 'text', text: '3. AI Processing and Conversations' }],
      },
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text: 'When you interact with AI companions on BotCafé:',
          },
        ],
      },
      {
        type: 'list',
        listType: 'bullet',
        children: [
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Your conversations are processed by third-party AI providers (such as OpenAI, Anthropic, or Google) to generate responses',
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Conversation data may be stored to provide memory and continuity features',
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'We do not use your private conversations to train AI models',
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'You can delete your conversation history at any time',
              },
            ],
          },
        ],
      },
      {
        type: 'heading',
        tag: 'h2',
        children: [{ type: 'text', text: '4. Information Sharing' }],
      },
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text: 'We do not sell your personal information. We may share information in the following circumstances:',
          },
        ],
      },
      {
        type: 'list',
        listType: 'bullet',
        children: [
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'With service providers who assist in operating the Service (hosting, analytics, authentication)',
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'With AI providers to process your conversations and generate responses',
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'When required by law or to protect our rights and safety',
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'In connection with a merger, acquisition, or sale of assets',
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'With your consent or at your direction',
              },
            ],
          },
        ],
      },
      {
        type: 'heading',
        tag: 'h2',
        children: [{ type: 'text', text: '5. Data Security' }],
      },
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text: 'We implement appropriate technical and organizational measures to protect your information, including:',
          },
        ],
      },
      {
        type: 'list',
        listType: 'bullet',
        children: [
          {
            type: 'listitem',
            children: [
              { type: 'text', text: 'Encryption of data in transit and at rest' },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Secure authentication through Clerk',
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              { type: 'text', text: 'Regular security assessments and updates' },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Access controls limiting employee access to personal data',
              },
            ],
          },
        ],
      },
      {
        type: 'heading',
        tag: 'h2',
        children: [{ type: 'text', text: '6. Data Retention' }],
      },
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text: 'We retain your information for as long as your account is active or as needed to provide the Service. You can request deletion of your data at any time. After account deletion, we may retain certain information as required by law or for legitimate business purposes.',
          },
        ],
      },
      {
        type: 'heading',
        tag: 'h2',
        children: [{ type: 'text', text: '7. Your Rights and Choices' }],
      },
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'Depending on your location, you may have the right to:' }],
      },
      {
        type: 'list',
        listType: 'bullet',
        children: [
          {
            type: 'listitem',
            children: [
              { type: 'text', text: 'Access the personal information we hold about you' },
            ],
          },
          {
            type: 'listitem',
            children: [
              { type: 'text', text: 'Correct inaccurate or incomplete information' },
            ],
          },
          {
            type: 'listitem',
            children: [{ type: 'text', text: 'Delete your personal information' }],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Export your data in a portable format',
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              { type: 'text', text: 'Object to or restrict certain processing' },
            ],
          },
          {
            type: 'listitem',
            children: [
              { type: 'text', text: 'Withdraw consent where processing is based on consent' },
            ],
          },
        ],
      },
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text: 'To exercise these rights, visit your account settings or contact us through our help center.',
          },
        ],
      },
      {
        type: 'heading',
        tag: 'h2',
        children: [{ type: 'text', text: '8. Cookies and Tracking' }],
      },
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text: 'We use cookies and similar technologies to provide functionality, analyze usage, and personalize content. You can manage cookie preferences through your browser settings.',
          },
        ],
      },
      {
        type: 'heading',
        tag: 'h2',
        children: [{ type: 'text', text: "9. Children's Privacy" }],
      },
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text: 'The Service is not intended for children under 13. We do not knowingly collect personal information from children under 13. If we learn that we have collected such information, we will take steps to delete it.',
          },
        ],
      },
      {
        type: 'heading',
        tag: 'h2',
        children: [{ type: 'text', text: '10. International Data Transfers' }],
      },
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text: 'Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers in compliance with applicable data protection laws.',
          },
        ],
      },
      {
        type: 'heading',
        tag: 'h2',
        children: [{ type: 'text', text: '11. Changes to This Policy' }],
      },
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text: 'We may update this Privacy Policy from time to time. We will notify you of material changes by posting the new policy on this page and updating the effective date.',
          },
        ],
      },
      {
        type: 'heading',
        tag: 'h2',
        children: [{ type: 'text', text: '12. Contact Us' }],
      },
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text: 'If you have questions about this Privacy Policy or our data practices, please contact us through our Discord community or help center.',
          },
        ],
      },
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  },
}

// Responsible AI / Acceptable Use Policy content
const responsibleAIContent = {
  root: {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text: 'BotCafé is committed to the responsible and ethical use of artificial intelligence. This policy outlines our principles and your responsibilities when using AI-powered features on our platform.',
          },
        ],
      },
      {
        type: 'heading',
        tag: 'h2',
        children: [{ type: 'text', text: '1. Our AI Principles' }],
      },
      {
        type: 'paragraph',
        children: [
          { type: 'text', text: 'BotCafé is built on the following principles:' },
        ],
      },
      {
        type: 'list',
        listType: 'bullet',
        children: [
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Safety First: We prioritize user safety and implement safeguards against harmful content',
                format: 1,
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Transparency: We are clear about when you are interacting with AI and how your data is used',
                format: 1,
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'User Control: You have control over your data, conversations, and AI interactions',
                format: 1,
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Continuous Improvement: We actively work to improve our AI systems and address concerns',
                format: 1,
              },
            ],
          },
        ],
      },
      {
        type: 'heading',
        tag: 'h2',
        children: [{ type: 'text', text: '2. Understanding AI Limitations' }],
      },
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text: 'AI companions on BotCafé are designed for entertainment, creative expression, and companionship. It is important to understand that:',
          },
        ],
      },
      {
        type: 'list',
        listType: 'bullet',
        children: [
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'AI responses are generated by machine learning models and may contain inaccuracies',
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'AI companions do not have real emotions, consciousness, or understanding',
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'AI should not be used as a substitute for professional advice (medical, legal, financial, mental health)',
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'AI may occasionally produce unexpected or inappropriate responses despite our safety measures',
              },
            ],
          },
        ],
      },
      {
        type: 'heading',
        tag: 'h2',
        children: [{ type: 'text', text: '3. Acceptable Use' }],
      },
      {
        type: 'paragraph',
        children: [
          { type: 'text', text: 'When using BotCafé, you agree to use the Service responsibly. ', format: 0 },
          { type: 'text', text: 'You MAY:', format: 1 },
        ],
      },
      {
        type: 'list',
        listType: 'bullet',
        children: [
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Create and interact with AI companions for entertainment and creative purposes',
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Build characters with diverse personalities, backgrounds, and stories',
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Share your creations with the community (following content guidelines)',
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Use AI for creative writing, roleplay, and storytelling',
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Explore ideas and have thoughtful conversations with AI',
              },
            ],
          },
        ],
      },
      {
        type: 'heading',
        tag: 'h2',
        children: [{ type: 'text', text: '4. Prohibited Uses' }],
      },
      {
        type: 'paragraph',
        children: [
          { type: 'text', text: 'You ', format: 0 },
          { type: 'text', text: 'MAY NOT', format: 1 },
          { type: 'text', text: ' use BotCafé to:', format: 0 },
        ],
      },
      {
        type: 'list',
        listType: 'bullet',
        children: [
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Generate content that sexualizes minors or depicts child abuse',
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Create content promoting violence, terrorism, or self-harm',
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Harass, bully, or threaten other users',
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Generate hate speech or content discriminating against protected groups',
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Create deepfakes or impersonate real people without consent',
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Spread misinformation or create deceptive content',
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Attempt to bypass safety filters or content moderation',
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Use AI for illegal activities or to facilitate harm',
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Scrape, copy, or misuse AI-generated content in ways that violate intellectual property rights',
              },
            ],
          },
        ],
      },
      {
        type: 'heading',
        tag: 'h2',
        children: [{ type: 'text', text: '5. Content Moderation' }],
      },
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text: 'We employ multiple layers of content moderation:',
          },
        ],
      },
      {
        type: 'list',
        listType: 'bullet',
        children: [
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Automated filters to prevent harmful content generation',
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Community reporting systems for users to flag concerning content',
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Human review of reported content and creator profiles',
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Regular audits of public bots and content',
              },
            ],
          },
        ],
      },
      {
        type: 'heading',
        tag: 'h2',
        children: [{ type: 'text', text: '6. Creator Responsibilities' }],
      },
      {
        type: 'paragraph',
        children: [
          { type: 'text', text: 'If you create and share bots on BotCafé, you are responsible for:' },
        ],
      },
      {
        type: 'list',
        listType: 'bullet',
        children: [
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Ensuring your bots comply with this policy and our Terms of Service',
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Providing accurate descriptions and content warnings where appropriate',
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Responding to reports and feedback about your creations',
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Not designing bots to circumvent safety measures',
              },
            ],
          },
        ],
      },
      {
        type: 'heading',
        tag: 'h2',
        children: [{ type: 'text', text: '7. Mental Health and Wellbeing' }],
      },
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text: 'We care about your wellbeing. Please remember:',
          },
        ],
      },
      {
        type: 'list',
        listType: 'bullet',
        children: [
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'AI companions are not a replacement for human connection or professional mental health support',
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'If you are experiencing a mental health crisis, please reach out to qualified professionals or crisis services',
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Take breaks from AI interactions and maintain real-world relationships',
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Our wellbeing features are designed to encourage healthy usage patterns',
              },
            ],
          },
        ],
      },
      {
        type: 'heading',
        tag: 'h2',
        children: [{ type: 'text', text: '8. Reporting Concerns' }],
      },
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text: 'If you encounter content or behavior that violates this policy, please report it immediately using our in-app reporting tools or by contacting our support team. We take all reports seriously and will investigate promptly.',
          },
        ],
      },
      {
        type: 'heading',
        tag: 'h2',
        children: [{ type: 'text', text: '9. Enforcement' }],
      },
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text: 'Violations of this policy may result in:',
          },
        ],
      },
      {
        type: 'list',
        listType: 'bullet',
        children: [
          {
            type: 'listitem',
            children: [{ type: 'text', text: 'Content removal' }],
          },
          {
            type: 'listitem',
            children: [{ type: 'text', text: 'Temporary or permanent account suspension' }],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Removal of creator privileges',
              },
            ],
          },
          {
            type: 'listitem',
            children: [
              {
                type: 'text',
                text: 'Reporting to law enforcement where required',
              },
            ],
          },
        ],
      },
      {
        type: 'heading',
        tag: 'h2',
        children: [{ type: 'text', text: '10. Updates to This Policy' }],
      },
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text: 'As AI technology evolves, we will update this policy to address new challenges and opportunities. We encourage you to review this policy periodically.',
          },
        ],
      },
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text: 'Together, we can create a safe and enjoyable AI companion experience for everyone.',
          },
        ],
      },
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  },
}

/**
 * POST /api/admin/seed-legal
 *
 * Seeds the legal documents collection with default documents.
 * Requires authentication and admin privileges (for now, just checks for authenticated user).
 */
export async function POST() {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Find or create the user in Payload by email
    const users = await payload.find({
      collection: 'users',
      where: {
        email: { equals: clerkUser.emailAddresses[0]?.emailAddress },
      },
    })

    let payloadUserId: string | number
    if (users.docs.length > 0) {
      payloadUserId = users.docs[0].id
    } else {
      const newUser = await payload.create({
        collection: 'users',
        data: {
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          name: clerkUser.firstName
            ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`
            : clerkUser.username || 'Admin',
          role: 'admin',
        },
      })
      payloadUserId = newUser.id
    }

    const effectiveDate = new Date().toISOString()
    const results = []

    // Create Terms of Service
    const existingTos = await payload.find({
      collection: 'legal-documents',
      where: { documentType: { equals: 'terms-of-service' } },
    })

    if (existingTos.docs.length === 0) {
      const tos = await payload.create({
        collection: 'legal-documents',
        data: {
          title: 'Terms of Service',
          documentType: 'terms-of-service',
          version: '1.0',
          content: termsOfServiceContent as any,
          effectiveDate,
          language: 'en',
          status: 'active',
          createdBy: payloadUserId,
          summary:
            'These Terms of Service govern your use of BotCafé. By using our platform, you agree to these terms.',
          isGlobal: true,
          consentRequired: true,
          tags: [{ tag: 'legal' }, { tag: 'terms' }, { tag: 'agreement' }],
        },
      })
      results.push({ type: 'terms-of-service', status: 'created', id: tos.id })
    } else {
      results.push({ type: 'terms-of-service', status: 'exists', id: existingTos.docs[0].id })
    }

    // Create Privacy Policy
    const existingPrivacy = await payload.find({
      collection: 'legal-documents',
      where: { documentType: { equals: 'privacy-policy' } },
    })

    if (existingPrivacy.docs.length === 0) {
      const privacy = await payload.create({
        collection: 'legal-documents',
        data: {
          title: 'Privacy Policy',
          documentType: 'privacy-policy',
          version: '1.0',
          content: privacyPolicyContent as any,
          effectiveDate,
          language: 'en',
          status: 'active',
          createdBy: payloadUserId,
          summary:
            'This Privacy Policy explains how BotCafé collects, uses, and protects your personal information.',
          isGlobal: true,
          consentRequired: true,
          tags: [{ tag: 'legal' }, { tag: 'privacy' }, { tag: 'data' }],
        },
      })
      results.push({ type: 'privacy-policy', status: 'created', id: privacy.id })
    } else {
      results.push({ type: 'privacy-policy', status: 'exists', id: existingPrivacy.docs[0].id })
    }

    // Create Responsible AI / Acceptable Use Policy
    const existingAUP = await payload.find({
      collection: 'legal-documents',
      where: { documentType: { equals: 'acceptable-use-policy' } },
    })

    if (existingAUP.docs.length === 0) {
      const aup = await payload.create({
        collection: 'legal-documents',
        data: {
          title: 'Responsible AI Use Policy',
          documentType: 'acceptable-use-policy',
          version: '1.0',
          content: responsibleAIContent as any,
          effectiveDate,
          language: 'en',
          status: 'active',
          createdBy: payloadUserId,
          summary:
            'Guidelines for ethical and responsible use of AI companions on BotCafé.',
          isGlobal: true,
          consentRequired: false,
          tags: [{ tag: 'legal' }, { tag: 'ai' }, { tag: 'responsible-use' }, { tag: 'guidelines' }],
        },
      })
      results.push({ type: 'acceptable-use-policy', status: 'created', id: aup.id })
    } else {
      results.push({ type: 'acceptable-use-policy', status: 'exists', id: existingAUP.docs[0].id })
    }

    return NextResponse.json({
      success: true,
      message: 'Legal documents seeded successfully',
      results,
    })
  } catch (error: any) {
    console.error('Error seeding legal documents:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to seed legal documents' },
      { status: 500 }
    )
  }
}
