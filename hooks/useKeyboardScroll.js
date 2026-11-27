import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, TextInput } from 'react-native';

const IOS = Platform.OS === 'ios';

/** Height of the on-screen keyboard (0 when hidden). Updates early on iOS so layouts move with it. */
export function useKeyboardHeight() {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const show = Keyboard.addListener(IOS ? 'keyboardWillShow' : 'keyboardDidShow', (e) => setHeight(e?.endCoordinates?.height || 0));
    const hide = Keyboard.addListener(IOS ? 'keyboardWillHide' : 'keyboardDidHide', () => setHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return height;
}

/**
 * Keeps the text field being typed in visible above the keyboard, for a
 * ScrollView or FlatList. Spread `listProps` onto the list and add
 * `keyboardPadding` to its bottom padding (so there's room to scroll the last
 * field up). On Android the window already resizes, so no padding is added.
 */
export default function useKeyboardScroll({ enabled = true, padding = true } = {}) {
  const ref = useRef(null);
  const offset = useRef(0);
  const keyboardHeight = useKeyboardHeight();

  useEffect(() => {
    if (!enabled) return undefined;
    const sub = Keyboard.addListener('keyboardDidShow', (e) => {
      const input = TextInput.State.currentlyFocusedInput?.();
      const keyboardTop = e?.endCoordinates?.screenY;
      const list = ref.current;
      if (!input?.measureInWindow || !list || !keyboardTop) return;
      // Let the extra bottom padding render before measuring.
      setTimeout(() => {
        input.measureInWindow((x, y, w, h) => {
          const overlap = y + h + 24 - keyboardTop; // 24pt of breathing room above the keys
          if (overlap <= 0) return;
          const to = offset.current + overlap;
          if (list.scrollToOffset) list.scrollToOffset({ offset: to, animated: true });
          else list.scrollTo?.({ y: to, animated: true });
        });
      }, 60);
    });
    return () => sub.remove();
  }, [enabled]);

  const onScroll = useCallback((e) => {
    offset.current = e.nativeEvent.contentOffset.y;
  }, []);

  return {
    ref,
    listProps: { onScroll, scrollEventThrottle: 32, keyboardShouldPersistTaps: 'handled' },
    keyboardPadding: enabled && padding && IOS ? keyboardHeight : 0,
  };
}
