import express from 'express';
const router = express.Router();
import {
    updateInstruction,deleteInstruction,createInstruction
  } from '../controllers/enhancedInstructions.js';


router.put('/', updateInstruction);
router.post('/', createInstruction);
router.delete('/:instructionId',deleteInstruction);

export default router;