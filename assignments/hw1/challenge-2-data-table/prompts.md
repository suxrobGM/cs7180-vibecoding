# Challenge 2: React Data Table - Prompt Iterations

## Version 1

**Prompt:**

```text
Create a React data table component with sorting, filtering, and pagination.
```

**Generated Code Issues:**

- No TypeScript types
- Basic implementation, hard to customize
- No accessibility considerations
- Tight coupling between features

**Test Results:**

- Basic functionality works
- Not reusable for different data shapes
- No keyboard navigation

---

## Version 2

**Prompt:**

```text
You are a senior React developer. Create a sortable, filterable data table component with:

1. TypeScript with proper generics for row data
2. Click column headers to sort (asc/desc toggle)
3. Text input to filter all columns
4. Pagination with configurable page size (10, 25, 50)
5. Props interface for customization

Use functional components with hooks.
```

**Improvements Made:**

- Role-playing (senior React developer)
- Specified TypeScript generics
- Clearer feature requirements
- Mentioned hooks preference

**Generated Code Issues:**

- Better types but not fully generic
- Pagination works but UI basic
- No loading/empty states

**Test Results:**

- Sorting works correctly
- Filtering works on all columns
- Pagination functional
- Types could be more flexible

---

## Version 3

**Prompt:**

```text
You are a senior React developer who writes accessible, performant components. Create a production-ready data table with these specifications:

## Technical Requirements
- React 18+ with TypeScript
- Functional components with hooks
- No external UI libraries (vanilla CSS or inline styles)

## Component API
interface DataTableProps<T extends Record<string, unknown>> {
  data: T[];
  columns: ColumnDef<T>[];
  pageSize?: number;
  pageSizeOptions?: number[];
}

interface ColumnDef<T> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

## Features
1. **Sorting**: Click headers to sort. Show asc/desc indicators (▲/▼)
2. **Filtering**: Single text input filters across all string columns
3. **Pagination**:
   - Page size selector (default: [10, 25, 50])
   - Previous/Next buttons
   - Current page indicator "Page X of Y"
4. **Empty State**: Show message when no data matches filter

## Accessibility
- Use semantic table elements (<table>, <thead>, <tbody>)
- Column headers should be <th> with scope="col"
- Sort buttons should be keyboard accessible

## Performance
- Use useMemo for sorted/filtered data
- Avoid re-renders when page size changes

## Output Structure
1. DataTable.tsx - Main component
2. types.ts - TypeScript interfaces
3. App.tsx - Demo with sample data

Provide clean, readable code with minimal comments.
```

**Improvements Made:**

- Specific component API with TypeScript generics
- Accessibility requirements included
- Performance considerations (useMemo)
- Clear output structure
- Demo app requested

**Test Results:**

- All features working
- Fully typed with generics
- Keyboard accessible
- Proper semantic HTML
- Clean component architecture

---

## Version 4

**Prompt:**

```text
You are an expert React developer following modern best practices. Refactor the data table to use:

## Technical Requirements
- React 19 with TypeScript
- Tailwind CSS v4 for styling (no inline styles)
- Remove useCallback and useMemo (React 19's compiler handles optimization)
- Kebab-case file naming convention
- Component breakdown into smaller, focused components

## Component Architecture
src/
├── components/
│   └── data-table/
│       ├── index.ts         # Barrel export
│       ├── types.ts         # Shared types
│       ├── data-table.tsx   # Main component (state management)
│       ├── table-filter.tsx # Filter input + page size selector
│       ├── table-header.tsx # Sortable column headers
│       ├── table-body.tsx   # Table rows with data
│       └── table-pagination.tsx # Pagination controls

## Type Improvements
- Remove Record<string, unknown> constraint for better flexibility
- Use `keyof T & string` for column keys
- Export DataTableProps for consumer use

## Tailwind Integration
- Use @tailwindcss/vite plugin
- Replace inline styles with Tailwind utility classes
- Add hover, focus, and transition states

Provide clean, modular code with single responsibility per component.
```

**Improvements Made:**

- React 19 adoption (removed unnecessary memoization)
- Tailwind v4 for consistent, maintainable styling
- Kebab-case naming for consistency with modern conventions
- Single responsibility principle for components
- Flexible generic types without Record constraint

**Test Results:**

- All features still working
- Cleaner code without useMemo/useCallback boilerplate
- Consistent styling with Tailwind
- Better code organization
- Improved TypeScript flexibility
