# Testing Guide - Buzzword Bingo

**Last Updated:** 2026-03-24

This document explains how to run tests, write new tests, and understand the testing infrastructure for the Buzzword Bingo application.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Test Structure](#test-structure)
3. [Running Tests](#running-tests)
4. [Writing Tests](#writing-tests)
5. [CI/CD](#cicd)
6. [Coverage](#coverage)
7. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites

- Node.js 18.x or higher
- npm (comes with Node.js)
- Firebase CLI (for rules testing)

### Installation

```bash
# Install dependencies
npm install

# Install Firebase CLI globally (if not already installed)
npm install -g firebase-tools
```

### Run All Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode (for development)
npm run test:watch
```

---

## Test Structure

```
buzzword-bingo/
├── __tests__/
│   ├── utils.test.js           # Unit tests for core functions
│   └── rules.test.js            # Firebase security rules tests
├── .github/
│   └── workflows/
│       └── test.yml             # CI/CD pipeline
├── package.json                 # Test scripts and dependencies
└── TESTING.md                   # This file
```

### Test Categories

| Test File | What It Tests | Dependencies |
|-----------|---------------|--------------|
| `utils.test.js` | Session codes, name validation, card generation, win detection, error messages | Jest |
| `rules.test.js` | Firebase security rules | Jest + Firebase Emulator |

---

## Running Tests

### Unit Tests

Run just the unit tests (fast, no emulator needed):

```bash
npm test -- __tests__/utils.test.js
```

### Firebase Rules Tests

Run security rules tests (requires Firebase emulator):

```bash
# Start emulator in one terminal
npm run emulators

# In another terminal, run rules tests
npm run test:rules
```

Or run both together:

```bash
# Starts emulator, runs tests, shuts down emulator
npm run emulators:test
```

### Watch Mode

Run tests automatically on file changes:

```bash
npm run test:watch
```

### Coverage Report

Generate and view test coverage:

```bash
npm run test:coverage

# Coverage report will be in coverage/lcov-report/index.html
open coverage/lcov-report/index.html
```

---

## Test Details

### Unit Tests (`utils.test.js`)

#### Session Code Generation Tests

Tests that session codes are:
- Exactly 5 characters long
- Use only allowed characters (no ambiguous I, O, 0, 1)
- Cryptographically random (no predictable patterns)
- Unique across multiple generations

```javascript
// Example test
test('generates 5-character code', () => {
  const code = generateSessionCode();
  expect(code).toHaveLength(5);
});
```

#### Name Validation Tests

Tests that name validation:
- Accepts valid names (2-20 characters)
- Rejects empty names
- Rejects names that are too short (< 2 chars)
- Rejects profanity (with and without special characters)

```javascript
// Example test
test('rejects profanity', () => {
  expect(validateName('fuck')).toBe('Please choose an appropriate name');
});
```

#### Card Generation Tests

Tests that card generation:
- Creates 5x5 grid
- Places FREE SPACE in center
- Is deterministic (same seed + player = same card)
- Is unique (different seed or player = different card)
- Uses only words from buzzwords list
- Has no duplicate words

```javascript
// Example test
test('same seed and player generates same card', () => {
  const card1 = generateCard(12345, 'player1');
  const card2 = generateCard(12345, 'player1');
  expect(card1).toEqual(card2);
});
```

#### Win Detection Tests

Tests that win detection:
- Detects horizontal wins (all rows)
- Detects vertical wins (all columns)
- Detects diagonal wins (both diagonals)
- Does not false-positive on incomplete lines
- Can detect multiple simultaneous wins

```javascript
// Example test
test('detects horizontal win (row 1)', () => {
  const marked = new Set([0, 1, 2, 3, 4]);
  const winning = getWinningLines(marked);
  expect(winning).toContain(0); // Row 1
});
```

#### Error Message Mapper Tests

Tests that error messages:
- Map Firebase error codes to user-friendly messages
- Handle errors with codes
- Handle errors with message patterns
- Provide fallback for unknown errors
- Handle null/undefined errors gracefully

```javascript
// Example test
test('maps PERMISSION_DENIED error', () => {
  const error = { code: 'PERMISSION_DENIED' };
  expect(getUserFriendlyError(error)).toBe('Unable to connect to the game. Please refresh the page and try again.');
});
```

---

### Firebase Rules Tests (`rules.test.js`)

#### Session Read Rules

Tests that:
- ✅ Authenticated users CAN read sessions
- ❌ Unauthenticated users CANNOT read sessions

#### Session Creation Rules

Tests that:
- ✅ Authenticated users CAN create new sessions
- ❌ Unauthenticated users CANNOT create sessions
- ✅ Host field must match authenticated user
- ✅ Status must be valid (lobby/playing/ended)
- ✅ Seed must be a number
- ✅ Round must be a number >= 1

#### Player Data Rules

Tests that:
- ✅ Users CAN write their own player data
- ❌ Users CANNOT write other users' player data
- ✅ Player name must be 2-20 characters
- ✅ JoinedAt must be in the past
- ✅ Progress must be between 0 and 5

#### Winner Data Rules

Tests that:
- ✅ Authenticated users CAN declare winner
- ✅ Winner must have required fields (playerId, name, line, lineCells, timestamp)
- ✅ Host CAN clear winner (for next round)
- ❌ Non-host CANNOT clear winner

#### Host-Only Operations

Tests that:
- ✅ Host CAN change game status
- ❌ Non-host CANNOT change game status
- ✅ Host CAN change seed and round
- ❌ Non-host CANNOT change seed and round
- ✅ Host CAN delete session
- ❌ Non-host CANNOT delete session

---

## Writing New Tests

### Adding Unit Tests

1. Open `__tests__/utils.test.js`
2. Add a new `describe` block for your test suite
3. Write `test` cases inside the `describe` block

```javascript
describe('New Feature', () => {
  test('should do something', () => {
    const result = myNewFunction();
    expect(result).toBe(expectedValue);
  });
});
```

### Adding Rules Tests

1. Open `__tests__/rules.test.js`
2. Add a new `describe` block for your rule category
3. Use `assertSucceeds` for operations that should work
4. Use `assertFails` for operations that should be blocked

```javascript
describe('New Rule Category', () => {
  test('should allow valid operation', async () => {
    const db = testEnv.authenticatedContext('user1').database();
    await assertSucceeds(db.ref('path/to/data').set(validData));
  });

  test('should block invalid operation', async () => {
    const db = testEnv.unauthenticatedContext().database();
    await assertFails(db.ref('path/to/data').set(validData));
  });
});
```

---

## CI/CD

### GitHub Actions Workflow

Tests run automatically on:
- ✅ Every push to `main` or `develop` branch
- ✅ Every pull request to `main` or `develop` branch

### Pipeline Jobs

1. **test** - Runs unit tests on Node.js 18.x and 20.x
2. **rules-test** - Runs Firebase security rules tests
3. **lint** - Checks for security issues
4. **status-check** - Summarizes all test results

### Viewing Results

1. Go to GitHub repository
2. Click "Actions" tab
3. Click on the workflow run
4. View test results and logs

### Local CI Simulation

Run the same tests that CI runs:

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run rules tests with emulator
npm run emulators:test
```

---

## Coverage

### Current Coverage Goals

| Category | Target | Current |
|----------|--------|---------|
| Core Functions | > 80% | TBD |
| Security Rules | 100% | TBD |
| Overall | > 75% | TBD |

### Viewing Coverage

```bash
# Generate coverage report
npm run test:coverage

# Open HTML report
open coverage/lcov-report/index.html
```

### Coverage Report Shows:

- ✅ Lines covered (green)
- ❌ Lines not covered (red)
- ⚠️ Branches not covered (yellow)
- 📊 Overall percentage

---

## Troubleshooting

### "Cannot find module" Error

```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Firebase Emulator Not Starting

```bash
# Check if emulator is already running
lsof -i :9000

# Kill existing process
kill -9 <PID>

# Try starting again
npm run emulators
```

### Tests Hanging on Firebase Rules Tests

```bash
# Ensure emulator is running in separate terminal
npm run emulators

# Then run rules tests
npm run test:rules
```

### Port Already in Use

```bash
# Change emulator port in firebase.json
# Or kill process using port 9000
lsof -ti:9000 | xargs kill -9
```

### Tests Pass Locally But Fail in CI

1. Check Node.js version matches (18.x or 20.x)
2. Check that all dependencies are in `package.json`
3. Check for environment-specific code
4. Look at CI logs for specific error messages

---

## Test Metrics

### Test Execution Time

| Test Suite | Expected Time |
|------------|---------------|
| Unit Tests | < 1 second |
| Rules Tests | < 5 seconds |
| Full Suite | < 10 seconds |

### Test Count

| Test File | Test Count |
|-----------|------------|
| utils.test.js | 40+ tests |
| rules.test.js | 30+ tests |
| **Total** | **70+ tests** |

---

## Best Practices

### DO:
- ✅ Write tests for all new features
- ✅ Keep tests fast (< 1s per test)
- ✅ Use descriptive test names
- ✅ Test both success and failure cases
- ✅ Run tests before committing
- ✅ Maintain > 80% coverage

### DON'T:
- ❌ Skip tests or mark as `.skip` without reason
- ❌ Write tests that depend on external services
- ❌ Write tests that depend on specific timing
- ❌ Commit commented-out tests
- ❌ Write tests without assertions
- ❌ Test implementation details (test behavior)

---

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Firebase Rules Unit Testing](https://firebase.google.com/docs/rules/unit-tests)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

---

## Questions?

**For test failures:** Check the error message and stack trace
**For CI issues:** Check GitHub Actions logs
**For coverage questions:** Run `npm run test:coverage` locally

---

**Last Updated:** 2026-03-24
**Test Framework:** Jest 29.7.0
**Node Version:** 18.x / 20.x
**Firebase Emulator:** Required for rules tests
