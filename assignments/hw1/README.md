# HW1: Prompt Engineering Battle

Master effective prompting through iteration and experimentation.

## Challenges

| Challenge           | Difficulty | Weight |
| ------------------- | ---------- | ------ |
| 1. Email Validation | Easy       | 25%    |
| 2. React Data Table | Medium     | 35%    |
| 3. Caching Layer    | Hard       | 40%    |

### Challenge 1

**Task:** Email validation function with regex

- Create a function that validates email addresses
- Handle common edge cases (plus addressing, subdomains)
- Include test cases

### Challenge 2

**Task:** React sortable/filterable data table with pagination

- Sortable columns (click to sort)
- Filter by text input
- Pagination (configurable page size)
- Proper TypeScript types

### Challenge 3

**Task:** Caching layer with TTL, LRU eviction, persistence

- Time-to-live (TTL) for entries
- Least Recently Used (LRU) eviction when full
- Persistence to localStorage or file
- Configurable max size

## Running the Code

```bash
# Install dependencies
bun install

# Run email validation tests
bun test:email

# Run cache tests
bun test:cache

# Start React data table dev server
bun run dev
```

## Deliverables

- [Prompt Versions](./docs/prompts.md) - All prompt iterations for each challenge
- [Reflection](./docs/reflection.md) - 500-word reflection on effective prompting
- [Template](./docs/template.md) - Personal reusable prompt template
