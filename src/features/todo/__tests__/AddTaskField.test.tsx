import { fireEvent, screen } from '@testing-library/react-native';

import { renderWithTheme } from '@/design-system/test-utils/render';

import { AddTaskField } from '../components/AddTaskField';
import { ValidationError } from '../domain/validation';

describe('AddTaskField', () => {
  it('clears immediately on submit so the next task can be typed', async () => {
    const onAdd = jest.fn(() => Promise.resolve());
    await renderWithTheme(<AddTaskField onAdd={onAdd} />);
    const input = screen.getByLabelText('Adicionar tarefa');

    await fireEvent.changeText(input, 'Lavar louça');
    await fireEvent(input, 'submitEditing');

    expect(onAdd).toHaveBeenCalledWith('Lavar louça');
    expect(screen.getByLabelText('Adicionar tarefa')).toHaveDisplayValue('');
  });

  it('gives the text back and explains when saving fails', async () => {
    const onAdd = jest.fn(() =>
      Promise.reject(new ValidationError('Use no máximo 300 caracteres.')),
    );
    await renderWithTheme(<AddTaskField onAdd={onAdd} />);
    const input = screen.getByLabelText('Adicionar tarefa');

    await fireEvent.changeText(input, 'Muito longo');
    await fireEvent(input, 'submitEditing');

    expect(await screen.findByText('Use no máximo 300 caracteres.')).toBeOnTheScreen();
    expect(screen.getByLabelText('Adicionar tarefa')).toHaveDisplayValue('Muito longo');
  });

  it('ignores empty submissions', async () => {
    const onAdd = jest.fn(() => Promise.resolve());
    await renderWithTheme(<AddTaskField onAdd={onAdd} />);
    await fireEvent(screen.getByLabelText('Adicionar tarefa'), 'submitEditing');
    expect(onAdd).not.toHaveBeenCalled();
  });
});
