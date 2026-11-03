/**
 * Navigating to a tab from a stack screen.
 *
 * `Home`, `Shipments`, `Messages` and `Profile` are screens of the `Tabs`
 * navigator, NOT of the root stack. A stack screen that calls
 * `navigation.navigate('Home')` therefore fails at runtime with
 *
 *     The action 'NAVIGATE' with payload {"name":"Home"} was not handled by
 *     any navigator.
 *
 * and the screen simply does not move — which is exactly what the back button
 * on the service-detail screen did. React Navigation addresses a nested screen
 * as `navigate('Tabs', { screen: 'Home' })`, so everything goes through `goTo`
 * below rather than each call site having to know whether its target happens
 * to be a tab.
 *
 * The nested form also works from INSIDE a tab (it resolves against the parent
 * navigator), so there is one spelling for both cases and no call site has to
 * care where it is being used from.
 */

export const TAB_ROUTES = ['Home', 'Shipments', 'Messages', 'Profile'];

export const isTabRoute = name => TAB_ROUTES.includes(name);

export function goTo(navigation, name, params) {
  if (isTabRoute(name)) {
    navigation.navigate('Tabs', { screen: name, params });
    return;
  }
  navigation.navigate(name, params);
}

export default goTo;
