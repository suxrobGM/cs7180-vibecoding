# Reflection: What Makes a Great Prompt?

Through iterating on prompts across three challenges of varying complexity, I discovered that effective prompting is less about finding magic words and more about clear, structured communication. Here are the key insights from my experimentation.

## The Power of Role-Playing

The single most impactful technique was assigning a role to the AI. Saying "You are a senior TypeScript developer" versus just asking for code produced dramatically different results. With a role, the AI adopted industry best practices, used proper typing, and considered edge cases without being explicitly told. The role sets expectations and context that permeate the entire response.

## Constraints Prevent Unwanted Solutions

Without constraints, the AI often reached for external libraries or over-engineered solutions. By explicitly stating "no external dependencies" or "use only regex," I received focused implementations that matched my actual requirements. Constraints act as guardrails, narrowing the solution space to what's actually useful.

## Show, Don't Just Tell

Providing explicit examples of expected behavior—both positive and negative—eliminated ambiguity far better than descriptions alone. For the email validator, listing specific valid emails (like `user+tag@domain.com`) and invalid ones (like `user..name@domain.com`) gave the AI concrete targets to test against. Examples are unambiguous specifications.

## Structure Your Output Expectations

Early prompts produced code dumps that required significant reorganization. By specifying output structure ("1. Main component, 2. Types file, 3. Demo app"), I received well-organized, production-ready code. This saved time and demonstrated that the AI can follow architectural patterns when given explicit guidance.

## Trade-off Guidance Matters

When I added phrases like "prioritize correctness over performance" or "focus on accessibility," the AI made different implementation choices. These trade-off hints help the AI understand project priorities and make appropriate decisions when multiple valid approaches exist.

## Iteration Is Essential

No first prompt was perfect. Each iteration built on specific failures of the previous version. V1 prompts identified missing requirements, V2 prompts refined constraints, and V3 prompts polished output quality. Treating prompting as an iterative design process—not a one-shot task—yields dramatically better results.

## The Template Emerges

From these experiments, a pattern emerged: start with role, add constraints, provide interface definitions, include examples, specify output structure, and give trade-off guidance. This template now guides all my prompts, but I continue to adapt it based on each task's unique requirements.

The meta-lesson is clear: prompt engineering is software engineering. The same principles that make code maintainable—clarity, specificity, modularity—make prompts effective. A great prompt is a well-written specification, and like any specification, it benefits from iteration and refinement.
