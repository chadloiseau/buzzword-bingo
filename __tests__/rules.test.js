/**
 * Firebase Security Rules Tests
 *
 * Tests database.rules.json using Firebase Rules Unit Testing
 *
 * Run with: npm run test:rules
 * Or with emulator: npm run emulators:test
 */

const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds
} = require('@firebase/rules-unit-testing');
const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'test-buzzword-bingo';
const RULES_PATH = path.join(__dirname, '../database.rules.json');

let testEnv;

describe('Firebase Security Rules', () => {
  beforeAll(async () => {
    // Initialize test environment with rules
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      database: {
        rules: fs.readFileSync(RULES_PATH, 'utf8'),
        host: 'localhost',
        port: 9000
      }
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  afterEach(async () => {
    await testEnv.clearDatabase();
  });

  describe('Session Read Rules', () => {
    test('authenticated users can read sessions', async () => {
      const db = testEnv.authenticatedContext('user1').database();
      await assertSucceeds(db.ref('bingo-sessions/TEST123').get());
    });

    test('unauthenticated users cannot read sessions', async () => {
      const db = testEnv.unauthenticatedContext().database();
      await assertFails(db.ref('bingo-sessions/TEST123').get());
    });
  });

  describe('Session Creation Rules', () => {
    test('authenticated users can create new sessions', async () => {
      const db = testEnv.authenticatedContext('user1').database();

      const sessionData = {
        host: 'user1',
        status: 'lobby',
        seed: 12345,
        round: 1,
        players: {
          user1: {
            name: 'Alice',
            joinedAt: Date.now()
          }
        }
      };

      await assertSucceeds(db.ref('bingo-sessions/TEST123').set(sessionData));
    });

    test('unauthenticated users cannot create sessions', async () => {
      const db = testEnv.unauthenticatedContext().database();

      const sessionData = {
        host: 'user1',
        status: 'lobby',
        seed: 12345,
        round: 1
      };

      await assertFails(db.ref('bingo-sessions/TEST123').set(sessionData));
    });

    test('host field must match authenticated user', async () => {
      const db = testEnv.authenticatedContext('user1').database();

      const sessionData = {
        host: 'user2', // Trying to set different user as host
        status: 'lobby',
        seed: 12345,
        round: 1
      };

      await assertFails(db.ref('bingo-sessions/TEST123/host').set('user2'));
    });

    test('status must be valid value', async () => {
      const db = testEnv.authenticatedContext('user1').database();

      // Set up session first
      await db.ref('bingo-sessions/TEST123').set({
        host: 'user1',
        status: 'lobby',
        seed: 12345,
        round: 1
      });

      // Valid status values
      await assertSucceeds(db.ref('bingo-sessions/TEST123/status').set('playing'));
      await assertSucceeds(db.ref('bingo-sessions/TEST123/status').set('ended'));

      // Invalid status
      await assertFails(db.ref('bingo-sessions/TEST123/status').set('invalid'));
    });

    test('seed must be a number', async () => {
      const db = testEnv.authenticatedContext('user1').database();

      await db.ref('bingo-sessions/TEST123').set({
        host: 'user1',
        status: 'lobby',
        seed: 12345,
        round: 1
      });

      await assertSucceeds(db.ref('bingo-sessions/TEST123/seed').set(54321));
      await assertFails(db.ref('bingo-sessions/TEST123/seed').set('not-a-number'));
    });

    test('round must be a number >= 1', async () => {
      const db = testEnv.authenticatedContext('user1').database();

      await db.ref('bingo-sessions/TEST123').set({
        host: 'user1',
        status: 'lobby',
        seed: 12345,
        round: 1
      });

      await assertSucceeds(db.ref('bingo-sessions/TEST123/round').set(2));
      await assertFails(db.ref('bingo-sessions/TEST123/round').set(0));
      await assertFails(db.ref('bingo-sessions/TEST123/round').set(-1));
    });
  });

  describe('Player Data Rules', () => {
    beforeEach(async () => {
      // Set up session for player tests
      const db = testEnv.authenticatedContext('user1').database();
      await db.ref('bingo-sessions/TEST123').set({
        host: 'user1',
        status: 'lobby',
        seed: 12345,
        round: 1
      });
    });

    test('users can write their own player data', async () => {
      const db = testEnv.authenticatedContext('user1').database();

      const playerData = {
        name: 'Alice',
        joinedAt: Date.now()
      };

      await assertSucceeds(
        db.ref('bingo-sessions/TEST123/players/user1').set(playerData)
      );
    });

    test('users cannot write other users player data', async () => {
      const db = testEnv.authenticatedContext('user1').database();

      const playerData = {
        name: 'Hacker',
        joinedAt: Date.now()
      };

      await assertFails(
        db.ref('bingo-sessions/TEST123/players/user2').set(playerData)
      );
    });

    test('player name must be 2-20 characters', async () => {
      const db = testEnv.authenticatedContext('user1').database();

      // Too short
      await assertFails(
        db.ref('bingo-sessions/TEST123/players/user1').set({
          name: 'A',
          joinedAt: Date.now()
        })
      );

      // Too long
      await assertFails(
        db.ref('bingo-sessions/TEST123/players/user1').set({
          name: 'A'.repeat(21),
          joinedAt: Date.now()
        })
      );

      // Valid length
      await assertSucceeds(
        db.ref('bingo-sessions/TEST123/players/user1').set({
          name: 'Alice',
          joinedAt: Date.now()
        })
      );
    });

    test('joinedAt must be in the past', async () => {
      const db = testEnv.authenticatedContext('user1').database();

      const futureTime = Date.now() + 100000;

      await assertFails(
        db.ref('bingo-sessions/TEST123/players/user1').set({
          name: 'Alice',
          joinedAt: futureTime
        })
      );
    });

    test('progress must be between 0 and 5', async () => {
      const db = testEnv.authenticatedContext('user1').database();

      // Set up player first
      await db.ref('bingo-sessions/TEST123/players/user1').set({
        name: 'Alice',
        joinedAt: Date.now()
      });

      // Valid progress values
      await assertSucceeds(
        db.ref('bingo-sessions/TEST123/players/user1/progress').set(0)
      );
      await assertSucceeds(
        db.ref('bingo-sessions/TEST123/players/user1/progress').set(5)
      );
      await assertSucceeds(
        db.ref('bingo-sessions/TEST123/players/user1/progress').set(3)
      );

      // Invalid progress values
      await assertFails(
        db.ref('bingo-sessions/TEST123/players/user1/progress').set(-1)
      );
      await assertFails(
        db.ref('bingo-sessions/TEST123/players/user1/progress').set(6)
      );
    });
  });

  describe('Winner Data Rules', () => {
    beforeEach(async () => {
      // Set up session
      const db = testEnv.authenticatedContext('user1').database();
      await db.ref('bingo-sessions/TEST123').set({
        host: 'user1',
        status: 'playing',
        seed: 12345,
        round: 1
      });
    });

    test('authenticated users can declare winner', async () => {
      const db = testEnv.authenticatedContext('user1').database();

      const winnerData = {
        playerId: 'user1',
        name: 'Alice',
        line: 'Row 1',
        lineCells: [0, 1, 2, 3, 4],
        timestamp: Date.now()
      };

      await assertSucceeds(
        db.ref('bingo-sessions/TEST123/winner').set(winnerData)
      );
    });

    test('winner must have required fields', async () => {
      const db = testEnv.authenticatedContext('user1').database();

      // Missing fields
      await assertFails(
        db.ref('bingo-sessions/TEST123/winner').set({
          playerId: 'user1',
          name: 'Alice'
          // Missing: line, lineCells, timestamp
        })
      );
    });

    test('host can clear winner', async () => {
      const db = testEnv.authenticatedContext('user1').database();

      // Set winner first
      await db.ref('bingo-sessions/TEST123/winner').set({
        playerId: 'user1',
        name: 'Alice',
        line: 'Row 1',
        lineCells: [0, 1, 2, 3, 4],
        timestamp: Date.now()
      });

      // Host can clear (set to null)
      await assertSucceeds(
        db.ref('bingo-sessions/TEST123/winner').set(null)
      );
    });

    test('non-host cannot clear winner', async () => {
      const db1 = testEnv.authenticatedContext('user1').database();
      const db2 = testEnv.authenticatedContext('user2').database();

      // User1 (host) sets winner
      await db1.ref('bingo-sessions/TEST123/winner').set({
        playerId: 'user1',
        name: 'Alice',
        line: 'Row 1',
        lineCells: [0, 1, 2, 3, 4],
        timestamp: Date.now()
      });

      // User2 (not host) tries to clear - should fail
      await assertFails(
        db2.ref('bingo-sessions/TEST123/winner').set(null)
      );
    });
  });

  describe('Host-Only Operations', () => {
    beforeEach(async () => {
      // Set up session with user1 as host
      const db = testEnv.authenticatedContext('user1').database();
      await db.ref('bingo-sessions/TEST123').set({
        host: 'user1',
        status: 'lobby',
        seed: 12345,
        round: 1
      });
    });

    test('host can change game status', async () => {
      const db = testEnv.authenticatedContext('user1').database();
      await assertSucceeds(
        db.ref('bingo-sessions/TEST123/status').set('playing')
      );
    });

    test('non-host cannot change game status', async () => {
      const db = testEnv.authenticatedContext('user2').database();
      await assertFails(
        db.ref('bingo-sessions/TEST123/status').set('playing')
      );
    });

    test('host can change seed and round', async () => {
      const db = testEnv.authenticatedContext('user1').database();
      await assertSucceeds(
        db.ref('bingo-sessions/TEST123/seed').set(54321)
      );
      await assertSucceeds(
        db.ref('bingo-sessions/TEST123/round').set(2)
      );
    });

    test('non-host cannot change seed and round', async () => {
      const db = testEnv.authenticatedContext('user2').database();
      await assertFails(
        db.ref('bingo-sessions/TEST123/seed').set(54321)
      );
      await assertFails(
        db.ref('bingo-sessions/TEST123/round').set(2)
      );
    });

    test('host can delete session', async () => {
      const db = testEnv.authenticatedContext('user1').database();
      await assertSucceeds(
        db.ref('bingo-sessions/TEST123').remove()
      );
    });

    test('non-host cannot delete session', async () => {
      const db = testEnv.authenticatedContext('user2').database();
      await assertFails(
        db.ref('bingo-sessions/TEST123').remove()
      );
    });
  });
});
