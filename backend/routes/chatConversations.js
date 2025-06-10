import express from 'express';
import { saveConversation ,getConversation,getAllConversations} from '../controllers/chatConversations.js';

const router = express.Router();

router.post('/', saveConversation);
router.get('/:chatId',getConversation);
router.get('/', getAllConversations);
export default router;
