import { useRef, useState } from 'react';
import { Platform } from 'react-native';

type FocusEventLike = { target?: unknown };

function isFocusVisible(event: FocusEventLike | undefined): boolean {
  const target = event?.target as { matches?: (selector: string) => boolean } | undefined;
  return target?.matches?.(':focus-visible') ?? false;
}

/**
 * Tracks focus that came from the keyboard only, so focus rings show for Tab navigation
 * but not after a tap or mouse click. On web this uses the browser's `:focus-visible`.
 */
export function useKeyboardFocus() {
  const [focused, setFocused] = useState(false);
  const pointerDown = useRef(false);

  return {
    focused,
    handlers: {
      onPressIn: () => {
        pointerDown.current = true;
      },
      onPressOut: () => {
        pointerDown.current = false;
      },
      onFocus: (event?: FocusEventLike) => {
        if (Platform.OS === 'web') setFocused(isFocusVisible(event));
        else if (!pointerDown.current) setFocused(true);
      },
      onBlur: () => setFocused(false),
    },
  };
}
