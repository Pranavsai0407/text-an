import express from 'express';
const router = express.Router();
import {
    getAllDatasets,
    createDataset,
    updateDataset,
    deleteDataset,
    getDatasetById
  } from '../controllers/datasets.js';

router.get('/', getAllDatasets);
router.get('/:id', getDatasetById);
router.post('/', createDataset);
router.put('/:id', updateDataset);
router.delete('/:id', deleteDataset);

export default router;