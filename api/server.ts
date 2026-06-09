/**
 * 本地服务器入口文件
 */
import app from './app.js';
import { ScheduleService } from './services/ScheduleService.js';

/**
 * start server with port
 */
const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, async () => {
  console.log(`服务器已启动，端口: ${PORT}`);
  
  try {
    const scheduleService = ScheduleService.getInstance();
    await scheduleService.startAll();
    console.log('定时任务服务已启动');
  } catch (error) {
    console.error('定时任务启动失败:', error);
  }
});

/**
 * close server
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;