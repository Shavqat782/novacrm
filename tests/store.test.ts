import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../store';
import { DealStage } from '../types';
import type { Deal, Task } from '../types';

const makeDeal = (id: string, stage: DealStage = DealStage.NEW_LEAD): Deal => ({
  id,
  title: 'Deal ' + id,
  amount: 1000,
  contactId: 'c1',
  stage,
  expectedCloseDate: '2026-01-01',
  priority: 'Средний',
});

const makeTask = (id: string, completed = false): Task => ({
  id,
  title: 'Task ' + id,
  dueDate: '2026-01-01',
  createdBy: 'user',
  completed,
  priority: 'Средний',
});

describe('useAppStore — сделки', () => {
  beforeEach(() => {
    useAppStore.setState({ deals: [], tasks: [] });
  });

  it('addDeal добавляет сделку в конец', () => {
    const { addDeal } = useAppStore.getState();
    addDeal(makeDeal('1'));
    addDeal(makeDeal('2'));
    expect(useAppStore.getState().deals.map(d => d.id)).toEqual(['1', '2']);
  });

  it('updateDeal обновляет только нужные поля', () => {
    const { addDeal, updateDeal } = useAppStore.getState();
    addDeal(makeDeal('1'));
    updateDeal('1', { amount: 9999, title: 'Updated' });
    const deal = useAppStore.getState().deals[0];
    expect(deal.amount).toBe(9999);
    expect(deal.title).toBe('Updated');
    expect(deal.stage).toBe(DealStage.NEW_LEAD);
  });

  it('deleteDeal удаляет сделку', () => {
    const { addDeal, deleteDeal } = useAppStore.getState();
    addDeal(makeDeal('1'));
    addDeal(makeDeal('2'));
    deleteDeal('1');
    expect(useAppStore.getState().deals.map(d => d.id)).toEqual(['2']);
  });

  it('moveDealToStage меняет стадию сделки', () => {
    const { addDeal, moveDealToStage } = useAppStore.getState();
    addDeal(makeDeal('1'));
    moveDealToStage('1', DealStage.CLOSED_WON);
    expect(useAppStore.getState().deals[0].stage).toBe(DealStage.CLOSED_WON);
  });

  it('moveDealToStage не трогает другие сделки', () => {
    const { addDeal, moveDealToStage } = useAppStore.getState();
    addDeal(makeDeal('1'));
    addDeal(makeDeal('2'));
    moveDealToStage('1', DealStage.CLOSED_LOST);
    const deals = useAppStore.getState().deals;
    expect(deals[1].stage).toBe(DealStage.NEW_LEAD);
  });
});

describe('useAppStore — задачи', () => {
  beforeEach(() => {
    useAppStore.setState({ deals: [], tasks: [] });
  });

  it('addTask добавляет задачу в начало', () => {
    const { addTask } = useAppStore.getState();
    addTask(makeTask('1'));
    addTask(makeTask('2'));
    expect(useAppStore.getState().tasks.map(t => t.id)).toEqual(['2', '1']);
  });

  it('updateTask отмечает выполнение', () => {
    const { addTask, updateTask } = useAppStore.getState();
    addTask(makeTask('1'));
    updateTask('1', { completed: true });
    expect(useAppStore.getState().tasks[0].completed).toBe(true);
  });

  it('deleteTask удаляет задачу', () => {
    const { addTask, deleteTask } = useAppStore.getState();
    addTask(makeTask('1'));
    deleteTask('1');
    expect(useAppStore.getState().tasks).toHaveLength(0);
  });
});
