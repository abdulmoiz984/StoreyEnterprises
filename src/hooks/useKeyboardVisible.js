import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * True while the software keyboard is on screen.
 *
 * Needed wherever a view pins content to the bottom AND adds `insets.bottom`:
 * once the keyboard is up it already covers the home indicator, so keeping that
 * inset leaves a second empty strip between the content and the keys.
 */
export default function useKeyboardVisible() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // The Will* events fire with the animation on iOS; Android only has Did*.
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, () => setVisible(true));
    const hide = Keyboard.addListener(hideEvent, () => setVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return visible;
}
