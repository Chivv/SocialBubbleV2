# SocialBubbleV2 Specialized AI Agents

This directory contains specialized AI agent configurations for the SocialBubbleV2 project. Each agent has deep expertise in specific areas of the codebase and can help with complex tasks in their domain.

## Available Agents

### 1. 🗄️ Supabase Database & Migration Specialist
**File:** `supabase-specialist.md`  
**Expertise:** PostgreSQL, RLS policies, migrations, query optimization  
**Use for:**
- Creating or modifying database schemas
- Writing complex SQL migrations
- Implementing Row Level Security policies
- Optimizing database queries for performance
- Managing multi-role access patterns

### 2. 📧 Email & Automation Workflow Specialist
**File:** `email-automation-specialist.md`  
**Expertise:** React Email templates, Resend API, Slack notifications, automation rules  
**Use for:**
- Creating or updating email templates
- Setting up automation workflows
- Managing email campaigns and sequences
- Implementing Slack notifications
- Troubleshooting email delivery issues

### 3. 👥 Creator Management & Analytics Specialist
**File:** `creator-management-specialist.md`  
**Expertise:** Creator onboarding, analytics, invoicing, performance tracking  
**Use for:**
- Building creator dashboard features
- Implementing analytics and reporting
- Managing creator import and invitations
- Handling invoice and payment workflows
- Optimizing creator discovery and matching

### 4. 🎬 Creative Production Pipeline Specialist
**File:** `creative-production-specialist.md`  
**Expertise:** Briefings, castings, creative agenda, content management  
**Use for:**
- Managing casting workflows
- Implementing briefing systems
- Building creative review processes
- Handling media uploads and storage
- Tracking production timelines

## How to Use These Agents

When working on a specific area of the project, you can request help from the relevant specialist:

```
"I need help from the Supabase specialist to create a migration for adding a new table"

"Can the Email specialist help me create a new notification template?"

"I need the Creator Management specialist to help optimize the dashboard analytics queries"

"Can the Creative Production specialist help implement a new casting workflow?"
```

## Agent Integration Points

The agents are designed to work together on cross-functional features:

- **Database + Email**: Triggers for automated emails based on database events
- **Creator + Email**: Campaign management and bulk communications
- **Production + Database**: Optimizing media storage and retrieval
- **Creator + Production**: Matching algorithms and casting assignments

## Adding New Agents

To add a new specialized agent:

1. Create a new `.md` file in this directory
2. Follow the existing agent template structure:
   - Core Responsibilities
   - Project-Specific Context
   - Common Patterns
   - Integration Points
   - Best Practices
3. Update this README with the new agent information
4. Commit the changes to version control

## Best Practices

1. **Use the right specialist**: Each agent has deep knowledge in their domain
2. **Provide context**: Share relevant file paths and current implementation
3. **Be specific**: Clearly describe what you need help with
4. **Cross-reference**: Mention if multiple specialists might be needed
5. **Follow patterns**: Each specialist knows the project's established patterns

## Project Context

These agents are configured specifically for SocialBubbleV2, a platform that connects brands with content creators through a comprehensive casting and briefing system. The platform serves three main user types:

- **Social Bubble** (Admins): Internal team managing the platform
- **Clients**: Brands creating briefings and castings
- **Creators**: Content creators responding to opportunities

Each agent understands this context and can provide solutions that fit the project's architecture and business logic.