/**
 * Unit Tests for Core Utility Functions
 *
 * Tests session code generation, validation, and game logic
 */

describe('Session Code Generation', () => {
  // Mock crypto.getRandomValues for testing
  const mockCrypto = {
    getRandomValues: (array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 4294967296);
      }
      return array;
    }
  };

  const generateSessionCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const array = new Uint32Array(5);
    mockCrypto.getRandomValues(array);
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars[array[i] % chars.length];
    }
    return code;
  };

  test('generates 5-character code', () => {
    const code = generateSessionCode();
    expect(code).toHaveLength(5);
  });

  test('uses only allowed characters', () => {
    const code = generateSessionCode();
    expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{5}$/);
  });

  test('does not use ambiguous characters', () => {
    const code = generateSessionCode();
    // No I, O, 0, 1
    expect(code).not.toMatch(/[IO01]/);
  });

  test('generates different codes', () => {
    const codes = new Set();
    for (let i = 0; i < 100; i++) {
      codes.add(generateSessionCode());
    }
    // Should generate at least 95 unique codes out of 100 (allowing for rare collisions)
    expect(codes.size).toBeGreaterThan(95);
  });
});

describe('Name Validation', () => {
  const BLOCKED_WORDS = [
    'ass','asshole','bastard','bitch','bollocks','cock','crap','cunt',
    'damn','dick','douche','fag','faggot','fuck','fucker','fucking',
    'goddamn','hell','homo','jerk','kike','milf','motherfucker',
    'negro','nigga','nigger','piss','prick','pussy','retard','shit',
    'slut','spic','tit','tits','twat','wanker','whore'
  ];

  function containsProfanity(name) {
    const normalized = name.toLowerCase().replace(/[^a-z]/g, '');
    return BLOCKED_WORDS.some(word => normalized.includes(word));
  }

  function validateName(name) {
    if (!name) return 'Please enter your name';
    if (name.length < 2) return 'Name must be at least 2 characters';
    if (containsProfanity(name)) return 'Please choose an appropriate name';
    return null;
  }

  test('accepts valid names', () => {
    expect(validateName('Alice')).toBeNull();
    expect(validateName('Bob')).toBeNull();
    expect(validateName('John Smith')).toBeNull();
    expect(validateName('María')).toBeNull();
  });

  test('rejects empty names', () => {
    expect(validateName('')).toBe('Please enter your name');
    expect(validateName(null)).toBe('Please enter your name');
    expect(validateName(undefined)).toBe('Please enter your name');
  });

  test('rejects names that are too short', () => {
    expect(validateName('A')).toBe('Name must be at least 2 characters');
  });

  test('accepts minimum length names', () => {
    expect(validateName('AB')).toBeNull();
  });

  test('accepts maximum length names', () => {
    expect(validateName('A'.repeat(20))).toBeNull();
  });

  test('rejects profanity', () => {
    expect(validateName('fuck')).toBe('Please choose an appropriate name');
    expect(validateName('asshole')).toBe('Please choose an appropriate name');
    expect(validateName('shit')).toBe('Please choose an appropriate name');
  });

  test('known limitation: profanity with special chars bypasses filter (BUG-010)', () => {
    // BUG-010: Filter strips non-alpha chars, so "a$$hole" → "ahole" which doesn't match "asshole"
    // This is a known P2 limitation documented in the fix plan
    const result = validateName('a$$hole');
    expect(result).toBeNull(); // Currently passes — should be caught in future fix
  });
});

describe('Card Generation', () => {
  const BUZZWORDS = [
    "Synergy", "Low-Hanging Fruit", "Move the Needle", "Circle Back", "Bandwidth",
    "Deep Dive", "Leverage", "Align on This", "Run it up the Flagpole", "Ecosystem",
    "Pivot", "Value-Add", "Take This Offline", "Boil the Ocean", "Scalable",
    "Net-Net", "Thought Leadership", "Drill Down", "Tiger Team", "Parking Lot",
    "Disruptive", "Double-Click", "Unpack That", "North Star", "Quick Win",
    "Touch Base", "Action Items", "Optics", "Guardrails", "Buy-In",
    "Stakeholder", "Bleeding Edge", "Game Changer", "Best Practice", "Ideate",
    "Circle the Wagons", "Table Stakes", "Cadence", "Headwinds", "Tailwinds",
    "Ducks in a Row", "Solutioning", "Rightsizing", "Core Competency",
    "Swim Lane", "Hard Stop", "Lean In", "End of the Day", "Bio Break",
    "NPS"
  ];

  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + ch;
      hash |= 0;
    }
    return hash;
  }

  function generateCard(seed, playerId) {
    const combinedSeed = seed ^ hashString(playerId);
    const rng = mulberry32(combinedSeed);

    const words = [...BUZZWORDS];
    for (let i = words.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [words[i], words[j]] = [words[j], words[i]];
    }

    const grid = [];
    let idx = 0;
    for (let r = 0; r < 5; r++) {
      const row = [];
      for (let c = 0; c < 5; c++) {
        if (r === 2 && c === 2) {
          row.push('FREE SPACE');
        } else {
          row.push(words[idx++]);
        }
      }
      grid.push(row);
    }
    return grid;
  }

  test('generates 5x5 grid', () => {
    const card = generateCard(12345, 'player1');
    expect(card).toHaveLength(5);
    card.forEach(row => {
      expect(row).toHaveLength(5);
    });
  });

  test('center cell is FREE SPACE', () => {
    const card = generateCard(12345, 'player1');
    expect(card[2][2]).toBe('FREE SPACE');
  });

  test('same seed and player generates same card', () => {
    const card1 = generateCard(12345, 'player1');
    const card2 = generateCard(12345, 'player1');
    expect(card1).toEqual(card2);
  });

  test('different seeds generate different cards', () => {
    const card1 = generateCard(12345, 'player1');
    const card2 = generateCard(54321, 'player1');
    expect(card1).not.toEqual(card2);
  });

  test('different players generate different cards with same seed', () => {
    const card1 = generateCard(12345, 'player1');
    const card2 = generateCard(12345, 'player2');
    expect(card1).not.toEqual(card2);
  });

  test('all words are from buzzwords list', () => {
    const card = generateCard(12345, 'player1');
    const allWords = [...BUZZWORDS, 'FREE SPACE'];

    card.forEach(row => {
      row.forEach(word => {
        expect(allWords).toContain(word);
      });
    });
  });

  test('no duplicate words (except FREE SPACE)', () => {
    const card = generateCard(12345, 'player1');
    const words = [];

    card.forEach(row => {
      row.forEach(word => {
        if (word !== 'FREE SPACE') {
          words.push(word);
        }
      });
    });

    const uniqueWords = new Set(words);
    expect(uniqueWords.size).toBe(words.length);
  });
});

describe('Win Detection', () => {
  const WIN_LINES = [
    // Rows
    [0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14], [15, 16, 17, 18, 19], [20, 21, 22, 23, 24],
    // Columns
    [0, 5, 10, 15, 20], [1, 6, 11, 16, 21], [2, 7, 12, 17, 22], [3, 8, 13, 18, 23], [4, 9, 14, 19, 24],
    // Diagonals
    [0, 6, 12, 18, 24], [4, 8, 12, 16, 20]
  ];

  function getWinningLines(markedCells) {
    const winning = [];
    for (let i = 0; i < WIN_LINES.length; i++) {
      if (WIN_LINES[i].every(idx => markedCells.has(idx))) {
        winning.push(i);
      }
    }
    return winning;
  }

  test('detects horizontal win (row 1)', () => {
    const marked = new Set([0, 1, 2, 3, 4]);
    const winning = getWinningLines(marked);
    expect(winning).toContain(0); // Row 1
  });

  test('detects horizontal win (row 3 with FREE SPACE)', () => {
    const marked = new Set([10, 11, 12, 13, 14]);
    const winning = getWinningLines(marked);
    expect(winning).toContain(2); // Row 3
  });

  test('detects vertical win (column 1)', () => {
    const marked = new Set([0, 5, 10, 15, 20]);
    const winning = getWinningLines(marked);
    expect(winning).toContain(5); // Column B
  });

  test('detects diagonal win (top-left to bottom-right)', () => {
    const marked = new Set([0, 6, 12, 18, 24]);
    const winning = getWinningLines(marked);
    expect(winning).toContain(10); // Diagonal ↘
  });

  test('detects diagonal win (top-right to bottom-left)', () => {
    const marked = new Set([4, 8, 12, 16, 20]);
    const winning = getWinningLines(marked);
    expect(winning).toContain(11); // Diagonal ↙
  });

  test('no win with incomplete line', () => {
    const marked = new Set([0, 1, 2, 3]); // Missing one for row 1
    const winning = getWinningLines(marked);
    expect(winning).toHaveLength(0);
  });

  test('detects multiple wins', () => {
    // Mark all cells - should have multiple wins
    const marked = new Set(Array.from({length: 25}, (_, i) => i));
    const winning = getWinningLines(marked);
    expect(winning.length).toBeGreaterThan(1);
  });

  test('FREE SPACE alone is not a win', () => {
    const marked = new Set([12]); // Just FREE SPACE
    const winning = getWinningLines(marked);
    expect(winning).toHaveLength(0);
  });
});

describe('Error Message Mapper', () => {
  function getUserFriendlyError(error) {
    if (!error) return 'An unexpected error occurred. Please try again.';

    const errorMessage = error.message || error.toString();
    const errorCode = error.code || '';

    const errorMap = {
      'PERMISSION_DENIED': 'Unable to connect to the game. Please refresh the page and try again.',
      'permission-denied': 'Unable to connect to the game. Please refresh the page and try again.',
      'NETWORK_ERROR': 'Network connection lost. Please check your internet and try again.',
      'network-request-failed': 'Network connection lost. Please check your internet and try again.',
      'disconnected': 'Connection to game server lost. Please refresh the page.',
      'unavailable': 'Game server is temporarily unavailable. Please try again in a moment.',
      'cancelled': 'Operation was cancelled. Please try again.',
      'deadline-exceeded': 'Request timed out. Please check your connection and try again.',
      'invalid-argument': 'Invalid request. Please refresh the page and try again.',
      'not-found': 'Session not found. Please check the code and try again.',
      'already-exists': 'Session already exists. Please try a different code.',
      'unauthenticated': 'Authentication failed. Please refresh the page.',
      'auth/network-request-failed': 'Network connection lost. Please check your internet and try again.'
    };

    if (errorCode && errorMap[errorCode]) {
      return errorMap[errorCode];
    }

    for (const [key, value] of Object.entries(errorMap)) {
      if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
        return value;
      }
    }

    return 'Something went wrong. Please try again.';
  }

  test('maps PERMISSION_DENIED error', () => {
    const error = { code: 'PERMISSION_DENIED', message: 'Permission denied' };
    expect(getUserFriendlyError(error)).toBe('Unable to connect to the game. Please refresh the page and try again.');
  });

  test('maps network error', () => {
    const error = { code: 'network-request-failed', message: 'Network request failed' };
    expect(getUserFriendlyError(error)).toBe('Network connection lost. Please check your internet and try again.');
  });

  test('maps disconnected error', () => {
    const error = { message: 'disconnected from server' };
    expect(getUserFriendlyError(error)).toBe('Connection to game server lost. Please refresh the page.');
  });

  test('returns fallback for unknown error', () => {
    const error = { code: 'UNKNOWN_ERROR', message: 'Unknown error occurred' };
    expect(getUserFriendlyError(error)).toBe('Something went wrong. Please try again.');
  });

  test('handles null error', () => {
    expect(getUserFriendlyError(null)).toBe('An unexpected error occurred. Please try again.');
  });

  test('handles error with message only', () => {
    const error = { message: 'PERMISSION_DENIED: access denied' };
    expect(getUserFriendlyError(error)).toBe('Unable to connect to the game. Please refresh the page and try again.');
  });
});
