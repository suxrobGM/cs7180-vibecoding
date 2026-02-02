# Personal Prompt Template

A reusable template for generating high-quality code from LLMs.

---

## Template Structure

```markdown
You are a [ROLE] specializing in [SPECIALTY]. [TASK_DESCRIPTION]

## Constraints

- [CONSTRAINT_1: e.g., "No external dependencies"]
- [CONSTRAINT_2: e.g., "TypeScript with strict mode"]
- [CONSTRAINT_3: e.g., "Must be a pure function"]

## Interface/Signature

\`\`\`typescript
[EXPECTED_INTERFACE_OR_FUNCTION_SIGNATURE]
\`\`\`

## Requirements

### [FEATURE_1]

- [Detail 1]
- [Detail 2]

### [FEATURE_2]

- [Detail 1]
- [Detail 2]

## Examples

### Valid/Expected Inputs

- [EXAMPLE_1]: [EXPECTED_OUTPUT]
- [EXAMPLE_2]: [EXPECTED_OUTPUT]

### Invalid/Edge Cases

- [INVALID_1]: [EXPECTED_BEHAVIOR]
- [INVALID_2]: [EXPECTED_BEHAVIOR]

## Output Format

1. [FILE_1] - [DESCRIPTION]
2. [FILE_2] - [DESCRIPTION]
3. [FILE_3] - [DESCRIPTION]

## Trade-offs

Prioritize [PRIMARY_CONCERN] over [SECONDARY_CONCERN].

[ADDITIONAL_GUIDANCE]
```

---

## Example: Filled Template

```markdown
You are a senior backend engineer specializing in distributed systems. Implement a rate limiter service.

## Constraints

- No external dependencies except Node.js standard library
- TypeScript with strict mode
- Must handle concurrent requests safely

## Interface/Signature

\`\`\`typescript
interface RateLimiter {
check(clientId: string): Promise<{ allowed: boolean; retryAfter?: number }>;
configure(clientId: string, options: RateLimitOptions): void;
}

interface RateLimitOptions {
maxRequests: number;
windowMs: number;
}
\`\`\`

## Requirements

### Sliding Window Algorithm

- Track requests per client within a time window
- Smoothly handle window transitions
- O(1) check complexity

### Configuration

- Per-client rate limits
- Default fallback limits
- Runtime reconfiguration

## Examples

### Valid Scenarios

- 10 requests in 1 second with limit of 100/min: allowed
- 101st request in same minute: denied with retryAfter

### Edge Cases

- Unknown client: use default limits
- Clock skew: handle gracefully

## Output Format

1. rate-limiter.ts - Core implementation
2. types.ts - TypeScript interfaces
3. rate-limiter.test.ts - Unit tests

## Trade-offs

Prioritize correctness and simplicity over raw performance.
Favor in-memory storage for this implementation.
```

---

## Quick Reference Checklist

Before submitting a prompt, verify:

- [ ] **Role assigned** - "You are a [role]..."
- [ ] **Constraints listed** - What NOT to do
- [ ] **Interface defined** - Expected API shape
- [ ] **Examples provided** - Both valid and invalid
- [ ] **Output structure specified** - File names and purposes
- [ ] **Trade-offs stated** - What to prioritize

---

## Adapting the Template

| Task Type        | Key Additions                                           |
| ---------------- | ------------------------------------------------------- |
| **UI Component** | Add accessibility requirements, visual specs            |
| **Algorithm**    | Add complexity requirements, input/output examples      |
| **API Endpoint** | Add error codes, authentication requirements            |
| **Refactor**     | Add "preserve existing behavior" constraint             |
| **Bug Fix**      | Include reproduction steps, expected vs actual behavior |

---

## Anti-Patterns to Avoid

1. **Vague roles**: "You are a developer" → Be specific about seniority and specialty
2. **Missing constraints**: Without them, you get over-engineered solutions
3. **No examples**: Descriptions are ambiguous, examples are concrete
4. **Implicit expectations**: If you want tests, ask for tests
5. **Conflicting requirements**: Review for internal consistency
