import express from 'express';
import { saveConversation ,getConversation} from '../controllers/chatConversations.js';

const router = express.Router();

router.post('/', saveConversation);
router.get('/:chatId',getConversation);

export default router;
