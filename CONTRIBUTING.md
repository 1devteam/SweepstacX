# Contributing to SweepstacX

Thank you for your interest in contributing to SweepstacX! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please be respectful and constructive in all interactions.

## Getting Started

### Prerequisites

- Node.js >= 18.17
- npm or pnpm
- Git

### Setting Up Your Development Environment

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/SweepstacX.git
   cd SweepstacX
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run tests to ensure everything works:
   ```bash
   npm test
   ```

## Development Workflow

### Making Changes

1. Create a new branch for your feature or bugfix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following our coding standards (see below)

3. Add tests for your changes in the `tests/` directory

4. Run the test suite:
   ```bash
   npm test
   ```

5. Run the linter:
   ```bash
   npm run lint
   ```

6. Commit your changes with a descriptive message:
   ```bash
   git commit -m "feat: add support for TypeScript files"
   ```

### Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `test:` - Test additions or modifications
- `refactor:` - Code refactoring
- `chore:` - Maintenance tasks
- `perf:` - Performance improvements

### Coding Standards

- Use ES6+ module syntax (`import`/`export`)
- Follow the ESLint configuration provided
- Write descriptive variable and function names
- Add JSDoc comments for public APIs
- Keep functions small and focused
- Prefer functional programming patterns where appropriate

### Testing

- Write unit tests for all new functionality
- Ensure tests are isolated and don't depend on external state
- Use descriptive test names that explain what is being tested
- Aim for high test coverage (>80%)

### Pull Request Process

1. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. Open a Pull Request on GitHub with:
   - A clear title and description
   - Reference to any related issues
   - Screenshots or examples if applicable

3. Wait for review and address any feedback

4. Once approved, your PR will be merged

## Project Structure

```
SweepstacX/
├── bin/              # CLI entry point
├── src/
│   ├── analyzers/    # Analysis engines (dead files, stale deps, etc.)
│   ├── commands/     # CLI command implementations
│   └── utils/        # Shared utilities
├── tests/            # Test files
├── docs/             # Documentation
└── examples/         # Example projects for testing
```

## Adding New Features

### Adding a New Analyzer

1. Create a new file in `src/analyzers/`
2. Export analysis functions with clear JSDoc comments
3. Add tests in `tests/`
4. Integrate into `src/commands/scan.js`
5. Update documentation

### Adding a New Command

1. Create a new file in `src/commands/`
2. Export a default async function
3. Register the command in `src/cli.js`
4. Add tests in `tests/`
5. Update README and docs

## Reporting Issues

When reporting issues, please include:

- SweepstacX version (`sweepstacx --version`)
- Node.js version (`node --version`)
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Relevant error messages or logs

## Feature Requests

We welcome feature requests! Please:

- Check existing issues first to avoid duplicates
- Clearly describe the use case and benefits
- Provide examples if possible
- Be open to discussion and feedback

## Questions?

If you have questions about contributing, feel free to:

- Open a GitHub Discussion
- Comment on relevant issues
- Reach out to maintainers

## License

By contributing to SweepstacX, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to SweepstacX! 🎉
