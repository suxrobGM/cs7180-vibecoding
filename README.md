# CS7180 Vibe Coding

A monorepo containing assignments for the CS7180 Vibe Coding course (Spring 2026). The repository is structured as a Bun workspace monorepo, allowing each assignment to have its own dependencies while sharing common configurations.

## Assignments

- [HW1: Prompt Engineering Battle](./assignments/hw1)

## Prerequisites

- [Bun](https://bun.sh/) v1.3+ (package manager and runtime)

### Install Bun

```bash
# macOS/Linux
curl -fsSL https://bun.sh/install | bash

# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"
```

## Project Structure

```text
cs7180-vibecoding/
├── package.json              # Root workspace configuration
├── prettier.config.js        # Code formatter, automatically formats code on save action
├── tsconfig.json             # Shared TypeScript config
├── assignments/
│   ├── hw1/                  # HW1: Prompt Engineering Battle
│   │   ├── package.json
│   │   ├── README.md
│   │   ├── docs/             # Deliverables (prompts, reflection, template)
│   │   ├── challenge-1-email/
│   │   ├── challenge-2-data-table/
│   │   └── challenge-3-cache/
│   ├── hw2/                  # Other assignments
│   └── ...
└── shared/                   # Shared utilities
```

## Quick Start

```bash
# Clone the repository
git clone <https://github.com/suxrobGM/cs7180-vibecoding>
cd cs7180-vibecoding

# Install all dependencies
bun install
```

## Running Assignments

Each assignment has its own readme file in the root folder, containing instructions on how to run and test it.

## Assignment Deliverables

Each assignment contains documentation in the `docs/` folder:

- **prompts.md** - All prompt iterations with analysis
- **reflection.md** - Written reflection on learnings
- **template.md** - Personal reusable prompt template

## Tech Stack

- **Runtime**: Bun
- **Language**: TypeScript (strict mode)
- **Frontend**: React 19 + Vite + Tailwind CSS v4
- **Testing**: bun:test

## License

MIT
