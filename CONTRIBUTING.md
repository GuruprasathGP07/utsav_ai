# Contributing to UtsavAI

Thank you for your interest in contributing to UtsavAI!

## Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/utsavai/utsavai.git
   cd utsavai
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run in development mode**:
   ```bash
   npm run dev
   ```

4. **Run tests and type-checks**:
   ```bash
   npm run type-check
   npm test
   ```

## Development Guidelines

- **TypeScript Strict Mode**: No `any`, no implicit returns, no unchecked indexed accesses.
- **Pure Deterministic Engines**: Any arithmetic or scheduling logic belongs in `src/engine/` as pure functions where `today` is passed as a parameter.
- **Multilingual Support**: Ensure new UI strings are added to all 6 language bundles in `src/locales/`.
- **Zero TODOs / Placeholders**: Code submitted must be complete, tested, and fully functional.

