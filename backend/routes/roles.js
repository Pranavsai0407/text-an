import express from 'express';
const router = express.Router();
import {
    getAllRoles,createRole,updateRole,deleteRole
  } from '../controllers/roles.js';

router.get('/', getAllRoles);
router.post('/', createRole);
router.put('/:id', updateRole);
router.delete('/:id', deleteRole);

export default router;