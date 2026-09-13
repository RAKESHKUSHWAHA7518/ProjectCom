/**
 * Integration Tests: Session Booking Data Integrity & User Blocking
 *
 * Tests:
 * 1. Double-booking conflict returns HTTP 409
 * 2. Booking with insufficient credits returns HTTP 400
 * 3. Successful booking deducts 1 skill credit atomically
 * 4. Cancelling a pending session refunds the learner's credit
 * 5. User blocking / unblocking endpoints work correctly
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { mongoSetup, mongoTeardown, clearDatabase } from '../setup.js';
import User from '../../models/User.js';
import Skill from '../../models/Skill.js';
import Session from '../../models/Session.js';
import { createSession, updateSessionStatus } from '../../controllers/sessionController.js';
import { blockUser, unblockUser, getBlockedUsers } from '../../controllers/userController.js';

before(mongoSetup);
after(mongoTeardown);
beforeEach(clearDatabase);

function makeReqRes(body, user, params = {}) {
  const req = { body, user, params, app: { get: () => null } };
  const res = { _status: 200, _body: null };
  res.status = (code) => { res._status = code; return res; };
  res.json = (body) => { res._body = body; return res; };
  return { req, res };
}

async function createTestUser(name, email, credits = 5) {
  return User.create({
    name,
    email,
    password: 'Password123!',
    skillCredits: credits,
    emailVerified: true,
  });
}

describe('Session Booking Integrity & Concurrency', () => {
  it('deducts 1 credit atomically from learner upon booking', async () => {
    const mentor = await createTestUser('Mentor A', 'mentorA@example.com', 10);
    const learner = await createTestUser('Learner A', 'learnerA@example.com', 3);
    const skill = await Skill.create({ name: 'Node.js', category: 'Web Development', user: mentor._id, type: 'teach' });

    const futureDate = new Date(Date.now() + 86400000); // 1 day in future
    const { req, res } = makeReqRes(
      { mentorId: mentor._id.toString(), skillId: skill._id.toString(), scheduledAt: futureDate.toISOString() },
      { id: learner._id.toString(), name: learner.name }
    );

    await createSession(req, res);
    assert.equal(res._status, 201);

    const updatedLearner = await User.findById(learner._id);
    assert.equal(updatedLearner.skillCredits, 2, 'Learner skillCredits should be decremented from 3 to 2');
  });

  it('rejects booking with 400 when learner has 0 credits', async () => {
    const mentor = await createTestUser('Mentor B', 'mentorB@example.com', 10);
    const learner = await createTestUser('Learner B', 'learnerB@example.com', 0); // 0 credits
    const skill = await Skill.create({ name: 'React', category: 'Web Development', user: mentor._id, type: 'teach' });

    const futureDate = new Date(Date.now() + 86400000);
    const { req, res } = makeReqRes(
      { mentorId: mentor._id.toString(), skillId: skill._id.toString(), scheduledAt: futureDate.toISOString() },
      { id: learner._id.toString(), name: learner.name }
    );

    await createSession(req, res);
    assert.equal(res._status, 400);
    assert.match(res._body.message, /Insufficient skill credits/i);
  });

  it('rejects double-booking same mentor time slot with 409 Conflict', async () => {
    const mentor = await createTestUser('Mentor C', 'mentorC@example.com', 10);
    const learner1 = await createTestUser('Learner 1', 'learner1@example.com', 5);
    const learner2 = await createTestUser('Learner 2', 'learner2@example.com', 5);
    const skill = await Skill.create({ name: 'Python', category: 'Programming', user: mentor._id, type: 'teach' });

    const futureDate = new Date(Date.now() + 86400000);

    // First booking succeeds
    const { req: req1, res: res1 } = makeReqRes(
      { mentorId: mentor._id.toString(), skillId: skill._id.toString(), scheduledAt: futureDate.toISOString(), duration: 45 },
      { id: learner1._id.toString(), name: learner1.name }
    );
    await createSession(req1, res1);
    assert.equal(res1._status, 201);

    // Second booking 15 minutes later conflicts (within 45 min buffer)
    const conflictingDate = new Date(futureDate.getTime() + 15 * 60 * 1000);
    const { req: req2, res: res2 } = makeReqRes(
      { mentorId: mentor._id.toString(), skillId: skill._id.toString(), scheduledAt: conflictingDate.toISOString(), duration: 45 },
      { id: learner2._id.toString(), name: learner2.name }
    );
    await createSession(req2, res2);
    assert.equal(res2._status, 409);
    assert.match(res2._body.message, /already has a scheduled session/i);

    // Ensure learner2 credits were not deducted
    const unchangedLearner2 = await User.findById(learner2._id);
    assert.equal(unchangedLearner2.skillCredits, 5);
  });

  it('refunds deducted credit when a session is cancelled', async () => {
    const mentor = await createTestUser('Mentor D', 'mentorD@example.com', 10);
    const learner = await createTestUser('Learner D', 'learnerD@example.com', 4);
    const skill = await Skill.create({ name: 'TypeScript', category: 'Programming', user: mentor._id, type: 'teach' });

    const futureDate = new Date(Date.now() + 86400000);
    const { req: req1, res: res1 } = makeReqRes(
      { mentorId: mentor._id.toString(), skillId: skill._id.toString(), scheduledAt: futureDate.toISOString() },
      { id: learner._id.toString(), name: learner.name }
    );
    await createSession(req1, res1);
    assert.equal(res1._status, 201);
    const sessionId = res1._body._id;

    // Learner now has 3 credits
    assert.equal((await User.findById(learner._id)).skillCredits, 3);

    // Mentor cancels session
    const { req: req2, res: res2 } = makeReqRes(
      { status: 'cancelled' },
      { id: mentor._id.toString(), name: mentor.name, role: 'user' },
      { id: sessionId.toString() }
    );
    await updateSessionStatus(req2, res2);

    // Learner is refunded back to 4 credits
    const refundedLearner = await User.findById(learner._id);
    assert.equal(refundedLearner.skillCredits, 4, 'Learner should be refunded to 4 credits upon cancellation');
  });
});

describe('User Blocking & Safety', () => {
  it('blocks and unblocks a user correctly', async () => {
    const userA = await createTestUser('User A', 'usera@example.com');
    const userB = await createTestUser('User B', 'userb@example.com');

    // User A blocks User B
    const { req: reqBlock, res: resBlock } = makeReqRes(
      {},
      { id: userA._id.toString() },
      { id: userB._id.toString() }
    );
    await blockUser(reqBlock, resBlock);
    assert.equal(resBlock._status, 200);

    const userAAfterBlock = await User.findById(userA._id);
    assert.ok(userAAfterBlock.blockedUsers.map(String).includes(userB._id.toString()));

    // Verify list
    const { req: reqList, res: resList } = makeReqRes({}, { id: userA._id.toString() });
    await getBlockedUsers(reqList, resList);
    assert.equal(resList._status, 200);
    assert.equal(resList._body.length, 1);
    assert.equal(resList._body[0]._id.toString(), userB._id.toString());

    // User A unblocks User B
    const { req: reqUnblock, res: resUnblock } = makeReqRes(
      {},
      { id: userA._id.toString() },
      { id: userB._id.toString() }
    );
    await unblockUser(reqUnblock, resUnblock);
    assert.equal(resUnblock._status, 200);

    const userAAfterUnblock = await User.findById(userA._id);
    assert.equal(userAAfterUnblock.blockedUsers.length, 0);
  });
});
