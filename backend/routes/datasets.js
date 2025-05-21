import express from 'express';
const router = express.Router();
import {
    getAllDatasets,
    createDataset,
    updateDataset,
    deleteDataset
  } from '../controllers/datasets.js';

router.get('/', getAllDatasets);
router.post('/', createDataset);
router.put('/:id', updateDataset);
router.delete('/:id', deleteDataset);

export default router;