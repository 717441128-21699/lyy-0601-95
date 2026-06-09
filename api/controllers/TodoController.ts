import type { Request, Response } from 'express';
import { TodoGeneratorService } from '../services/TodoGeneratorService';
import type { ApiResponse, TodoItem } from '../../shared/types';

export class TodoController {
  private todoService: TodoGeneratorService;

  constructor() {
    this.todoService = new TodoGeneratorService();
  }

  async getTodos(req: Request, res: Response<ApiResponse<TodoItem[]>>) {
    try {
      const { status, limit } = req.query;
      const todos = await this.todoService.getTodos(
        status as any,
        limit ? parseInt(limit as string) : undefined
      );
      return res.json({ success: true, data: todos });
    } catch (error) {
      return res.status(500).json({
        success: false,
        data: [],
        message: (error as Error).message,
      });
    }
  }

  async generateTodos(req: Request, res: Response<ApiResponse<TodoItem[]>>) {
    try {
      const { files } = req.body;
      const todos = await this.todoService.generateTodos(files);
      return res.json({ success: true, data: todos });
    } catch (error) {
      return res.status(500).json({
        success: false,
        data: [],
        message: (error as Error).message,
      });
    }
  }

  async addTodo(req: Request, res: Response<ApiResponse<TodoItem>>) {
    try {
      const todo = req.body;
      const newTodo = await this.todoService.addTodo(todo);
      return res.json({ success: true, data: newTodo });
    } catch (error) {
      return res.status(500).json({
        success: false,
        data: null as any,
        message: (error as Error).message,
      });
    }
  }

  async updateStatus(req: Request, res: Response<ApiResponse<TodoItem | undefined>>) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updated = await this.todoService.updateTodoStatus(id, status);
      return res.json({ success: true, data: updated });
    } catch (error) {
      return res.status(500).json({
        success: false,
        data: undefined,
        message: (error as Error).message,
      });
    }
  }

  async updateTodo(req: Request, res: Response<ApiResponse<TodoItem | undefined>>) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updated = await this.todoService.updateTodo(id, updates);
      return res.json({ success: true, data: updated });
    } catch (error) {
      return res.status(500).json({
        success: false,
        data: undefined,
        message: (error as Error).message,
      });
    }
  }

  async deleteTodo(req: Request, res: Response<ApiResponse<boolean>>) {
    try {
      const { id } = req.params;
      const deleted = await this.todoService.deleteTodo(id);
      return res.json({ success: true, data: deleted });
    } catch (error) {
      return res.status(500).json({
        success: false,
        data: false,
        message: (error as Error).message,
      });
    }
  }
}
