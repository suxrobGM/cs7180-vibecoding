# Challenge 1: Email Validation - Prompt Iterations

## Version 1 (Basic)

**Prompt:**

```text
Write a function to validate email addresses.
```

**Generated Code Issues:**

- No TypeScript types
- Only basic regex, misses edge cases
- No handling for plus addressing or subdomains
- No test cases included

**Test Results:**

- Basic emails work (user@example.com)
- Fails on plus addressing (user+tag@example.com)
- Fails on subdomains (user@mail.example.com)

---

## Version 2 (Improved)

**Prompt:**

```text
You are a senior TypeScript developer. Write an email validation function that:

1. Uses regex to validate email format
2. Handles these edge cases:
   - Plus addressing (user+tag@domain.com)
   - Subdomains (user@mail.example.com)
   - Common TLDs (.com, .org, .io, .co.uk)
3. Returns a boolean

Include test cases for each edge case.
```

**Improvements Made:**

- Added role (senior TypeScript developer)
- Specified edge cases explicitly
- Requested test cases

**Generated Code Issues:**

- Better coverage but regex still imperfect
- Missing some invalid email rejection cases
- Tests exist but not comprehensive

**Test Results:**

- Plus addressing works
- Subdomains work
- Still accepts some invalid formats (consecutive dots)

---

## Version 3 (Final)

**Prompt:**

```text
You are a senior TypeScript developer specializing in input validation. Create an email validation function with these requirements:

## Constraints
- Use only regex, no external libraries
- Must be a pure function with no side effects
- TypeScript with strict types

## Function Signature
function isValidEmail(email: string): boolean

## Must Accept (Valid Emails)
- Standard: user@example.com
- Plus addressing: user+tag@example.com
- Subdomains: user@mail.example.com
- Numbers: user123@example.com
- Dots in local part: first.last@example.com
- Long TLDs: user@example.museum

## Must Reject (Invalid Emails)
- Missing @: userexample.com
- Missing domain: user@
- Missing local part: @example.com
- Double dots: user..name@example.com
- Spaces: user @example.com
- Invalid chars: user<>@example.com

## Output Format
1. The isValidEmail function
2. Comprehensive test suite using bun:test
3. Brief comments explaining the regex parts

Focus on correctness over performance.
```

**Improvements Made:**

- Clear constraints (no external libs, pure function)
- Explicit function signature
- Positive AND negative test cases specified
- Output format clearly defined
- Trade-off guidance (correctness > performance)

**Test Results:**

- All valid emails accepted
- All invalid emails rejected
- Clean, documented code
