import express from 'express';
const router = express.Router();
import {
    createInstruction
} from '../controllers/instructions.js';


router.post('/', createInstruction);

export default router;