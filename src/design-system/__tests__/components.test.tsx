import { fireEvent, screen } from '@testing-library/react-native';
import { House } from 'lucide-react-native';
import { useState } from 'react';

import {
  Button,
  Checkbox,
  IconButton,
  ListItem,
  Sheet,
  Text,
  TextInput,
  WaterLevel,
  useTheme,
} from '..';
import { clampProgress } from '../components/WaterLevel';
import { darkColors, lightColors } from '../tokens';
import { renderWithTheme } from '../test-utils/render';

describe('ThemeProvider', () => {
  function SchemeProbe() {
    const { scheme, colors } = useTheme();
    return <Text testID="probe">{`${scheme}:${colors.surfaceBase}`}</Text>;
  }

  it('applies the light and dark token sets', async () => {
    await renderWithTheme(<SchemeProbe />, 'dark');
    expect(screen.getByTestId('probe')).toHaveTextContent(`dark:${darkColors.surfaceBase}`);
  });

  it('defaults a forced light preference to light tokens', async () => {
    await renderWithTheme(<SchemeProbe />, 'light');
    expect(screen.getByTestId('probe')).toHaveTextContent(`light:${lightColors.surfaceBase}`);
  });
});

describe('Text', () => {
  it('marks titles as headers for screen readers', async () => {
    await renderWithTheme(<Text variant="largeTitle">Hoje</Text>);
    expect(screen.getByRole('header', { name: 'Hoje' })).toBeOnTheScreen();
  });
});

describe('Button', () => {
  it('calls onPress', async () => {
    const onPress = jest.fn();
    await renderWithTheme(<Button label="Salvar" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Salvar' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire when disabled', async () => {
    const onPress = jest.fn();
    await renderWithTheme(<Button label="Salvar" onPress={onPress} disabled />);
    const button = screen.getByRole('button', { name: 'Salvar' });
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
    expect(button).toBeDisabled();
  });

  it('is busy and blocked while loading', async () => {
    const onPress = jest.fn();
    await renderWithTheme(<Button label="Salvar" onPress={onPress} loading />);
    const button = screen.getByRole('button', { name: 'Salvar' });
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
    expect(button).toBeBusy();
  });
});

describe('IconButton', () => {
  it('exposes its label and selected state', async () => {
    await renderWithTheme(<IconButton icon={House} label="Início" selected />);
    expect(screen.getByRole('button', { name: 'Início' })).toBeSelected();
  });
});

describe('Checkbox', () => {
  function Controlled() {
    const [checked, setChecked] = useState(false);
    return <Checkbox checked={checked} onChange={setChecked} label="Ir para academia" />;
  }

  it('toggles and announces its state', async () => {
    await renderWithTheme(<Controlled />);
    const checkbox = screen.getByRole('checkbox', { name: 'Ir para academia' });
    expect(checkbox).not.toBeChecked();
    await fireEvent.press(checkbox);
    expect(screen.getByRole('checkbox', { name: 'Ir para academia' })).toBeChecked();
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Ir para academia' }));
    expect(screen.getByRole('checkbox', { name: 'Ir para academia' })).not.toBeChecked();
  });

  it('does not change when disabled', async () => {
    const onChange = jest.fn();
    await renderWithTheme(<Checkbox checked={false} onChange={onChange} label="Tarefa" disabled />);
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Tarefa' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('TextInput', () => {
  it('shows the error message', async () => {
    await renderWithTheme(<TextInput label="Nome da lista" error="Dê um nome para a lista." />);
    expect(screen.getByText('Dê um nome para a lista.')).toBeOnTheScreen();
  });

  it('is not editable when disabled', async () => {
    await renderWithTheme(<TextInput label="Nome" value="Casa" disabled />);
    expect(screen.getByLabelText('Nome')).toBeDisabled();
  });
});

describe('ListItem', () => {
  it('opens on press and keeps the leading control independent', async () => {
    const onPress = jest.fn();
    const onChange = jest.fn();
    await renderWithTheme(
      <ListItem
        title="Beber água"
        onPress={onPress}
        leading={<Checkbox checked={false} onChange={onChange} label="Beber água" />}
      />,
    );
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Beber água' }));
    expect(onChange).toHaveBeenCalledWith(true);
    expect(onPress).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByRole('button', { name: 'Beber água' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('WaterLevel', () => {
  it('reports progress to assistive technologies', async () => {
    await renderWithTheme(<WaterLevel value={3} total={5} accessibilityLabel="Tarefas de hoje" />);
    const bar = screen.getByRole('progressbar', { name: 'Tarefas de hoje' });
    expect(bar).toHaveAccessibilityValue({ min: 0, max: 5, now: 3 });
    expect(screen.getByText('3 de 5')).toBeOnTheScreen();
  });

  it('clamps progress between 0 and 1', () => {
    expect(clampProgress(3, 5)).toBe(0.6);
    expect(clampProgress(7, 5)).toBe(1);
    expect(clampProgress(-1, 5)).toBe(0);
    expect(clampProgress(0, 0)).toBe(0);
  });
});

describe('Sheet', () => {
  function SheetDemo({ onClose }: { onClose: () => void }) {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button label="Abrir" onPress={() => setOpen(true)} />
        <Sheet
          visible={open}
          onClose={() => {
            onClose();
            setOpen(false);
          }}
          title="Nova tarefa"
        >
          <Text>Conteúdo</Text>
        </Sheet>
      </>
    );
  }

  it('renders its content only when visible and closes from the backdrop', async () => {
    const onClose = jest.fn();
    await renderWithTheme(<SheetDemo onClose={onClose} />);
    expect(screen.queryByText('Conteúdo')).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: 'Abrir' }));
    expect(screen.getByText('Conteúdo')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Fechar' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
