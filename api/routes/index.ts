import { Router } from 'express';
import { ScanController } from '../controllers/ScanController';
import { ClassificationController } from '../controllers/ClassificationController';
import { RenameController } from '../controllers/RenameController';
import { TodoController } from '../controllers/TodoController';
import { LogController } from '../controllers/LogController';
import { UndoController } from '../controllers/UndoController';
import { ExportController } from '../controllers/ExportController';
import { ScheduleController } from '../controllers/ScheduleController';
import { DashboardController } from '../controllers/DashboardController';
import { SettingsController } from '../controllers/SettingsController';

const router = Router();

const scanController = new ScanController();
const classificationController = new ClassificationController();
const renameController = new RenameController();
const todoController = new TodoController();
const logController = new LogController();
const undoController = new UndoController();
const exportController = new ExportController();
const scheduleController = new ScheduleController();
const dashboardController = new DashboardController();
const settingsController = new SettingsController();

router.get('/dashboard/stats', (req, res) => dashboardController.getStats(req, res));

router.get('/scan', (req, res) => scanController.scan(req, res));

router.get('/classification/rules', (req, res) => classificationController.getRules(req, res));
router.post('/classification/rules', (req, res) => classificationController.addRule(req, res));
router.put('/classification/rules/:id', (req, res) => classificationController.updateRule(req, res));
router.delete('/classification/rules/:id', (req, res) => classificationController.deleteRule(req, res));
router.post('/classification/preview', (req, res) => classificationController.preview(req, res));
router.post('/classification/execute', (req, res) => classificationController.execute(req, res));

router.get('/rename/rules', (req, res) => renameController.getRules(req, res));
router.post('/rename/rules', (req, res) => renameController.addRule(req, res));
router.put('/rename/rules/:id', (req, res) => renameController.updateRule(req, res));
router.delete('/rename/rules/:id', (req, res) => renameController.deleteRule(req, res));
router.post('/rename/preview', (req, res) => renameController.preview(req, res));
router.post('/rename/execute', (req, res) => renameController.execute(req, res));

router.get('/todos', (req, res) => todoController.getTodos(req, res));
router.post('/todos', (req, res) => todoController.addTodo(req, res));
router.post('/todos/generate', (req, res) => todoController.generateTodos(req, res));
router.put('/todos/:id/status', (req, res) => todoController.updateStatus(req, res));
router.put('/todos/:id', (req, res) => todoController.updateTodo(req, res));
router.delete('/todos/:id', (req, res) => todoController.deleteTodo(req, res));

router.get('/logs', (req, res) => logController.getLogs(req, res));
router.get('/logs/recent', (req, res) => logController.getRecent(req, res));

router.get('/undo/snapshots', (req, res) => undoController.getSnapshots(req, res));
router.get('/undo/latest', (req, res) => undoController.getLatest(req, res));
router.post('/undo/:snapshotId', (req, res) => undoController.undo(req, res));
router.post('/undo', (req, res) => undoController.undoLatest(req, res));

router.get('/export/logs', (req, res) => exportController.exportLogs(req, res));
router.post('/export/files', (req, res) => exportController.exportFiles(req, res));
router.get('/export/todos', (req, res) => exportController.exportTodos(req, res));
router.post('/export/processing', (req, res) => exportController.exportProcessingList(req, res));

router.get('/schedule/tasks', (req, res) => scheduleController.getTasks(req, res));
router.post('/schedule/tasks', (req, res) => scheduleController.addTask(req, res));
router.put('/schedule/tasks/:id', (req, res) => scheduleController.updateTask(req, res));
router.delete('/schedule/tasks/:id', (req, res) => scheduleController.deleteTask(req, res));
router.post('/schedule/tasks/:id/run', (req, res) => scheduleController.runTaskNow(req, res));

router.get('/settings', (req, res) => settingsController.getSettings(req, res));
router.put('/settings', (req, res) => settingsController.updateSettings(req, res));
router.get('/settings/ignore-rules', (req, res) => settingsController.getIgnoreRules(req, res));
router.post('/settings/ignore-rules', (req, res) => settingsController.addIgnoreRule(req, res));
router.put('/settings/ignore-rules/:id', (req, res) => settingsController.updateIgnoreRule(req, res));
router.delete('/settings/ignore-rules/:id', (req, res) => settingsController.deleteIgnoreRule(req, res));

export default router;
