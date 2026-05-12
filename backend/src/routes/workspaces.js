const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const workspaceController = require('../controllers/workspaceController');
const auditLogController = require('../controllers/auditLogController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.use(authenticate);

router.get('/', workspaceController.getAll);

router.post('/', [
  body('name').trim().isLength({ min: 2 }),
  validate
], workspaceController.create);

router.get('/invitations/me', workspaceController.getMyPendingInvitations);
router.post('/invitations/:token/accept', workspaceController.acceptInvitationByToken);

router.get('/:id/members', workspaceController.getMembers);

router.post('/:id/members', [
  body('email').isEmail().normalizeEmail(),
  body('role').optional().isIn(['owner', 'admin', 'member']),
  validate
], workspaceController.addMember);

router.get('/:id/invites', workspaceController.getWorkspaceInvites);
router.delete('/:id/invites/:inviteId', workspaceController.revokeWorkspaceInvite);

router.patch('/:id/members/:memberId', [
  body('role').isIn(['owner', 'admin', 'member']),
  validate
], workspaceController.updateMemberRole);

router.delete('/:id/members/:memberId', workspaceController.removeMember);

router.get('/:id/audit', auditLogController.getWorkspaceLogs);

module.exports = router;
