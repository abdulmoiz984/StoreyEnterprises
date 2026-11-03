import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LIGHT as c } from '../globalStyle/tokens';
import TabBar from './TabBar';

import { ForgotScreen, LoginScreen, OnboardingScreen, RegisterScreen, SetupScreen, SplashScreen } from '../screens/auth';
import { HomeScreen, ServiceDetailScreen, ServicesScreen } from '../screens/home';
import { ShipmentDetailScreen, ShipmentsScreen } from '../screens/shipments';
import { ChatScreen, MessagesScreen, NotificationSettingsScreen, NotificationsScreen } from '../screens/inbox';
import { PaymentScreen, QuoteScreen } from '../screens/money';
import { BookingScreen } from '../screens/booking';
import {
  AboutScreen,
  AddressesScreen,
  BillingScreen,
  ContactScreen,
  DeleteAccountScreen,
  EditProfileScreen,
  GalleryScreen,
  HelpScreen,
  LegalScreen,
  PaymentMethodsScreen,
  ProfileScreen,
  SettingsScreen,
} from '../screens/account';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/**
 * The web's four tab roots. The centre "Book" control is NOT a tab there — it is
 * a button that calls `startBooking()` and pushes `/book` — so it is drawn by
 * `TabBar` and pushes onto the parent stack instead of being registered here.
 */
function Tabs() {
  return (
    <Tab.Navigator
      // `tabBar` is a RENDER FUNCTION in React Navigation, not a component
      // slot. Passing the component itself (`tabBar={TabBar}`) makes the
      // navigator invoke it as a plain function, and its hooks —
      // useSafeAreaInsets and useApp — then run outside a component render,
      // which crashes the whole tab navigator with "Invalid hook call". The
      // react/no-unstable-nested-components lint rule flags the arrow, but the
      // arrow is the documented API here.
      // eslint-disable-next-line react/no-unstable-nested-components
      tabBar={props => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: c.surface } }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Shipments" component={ShipmentsScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

/**
 * One stack over the tabs, mirroring the web's 34 file routes.
 *
 * `headerShown` is off throughout: every screen draws its own `StackHeader`,
 * `LargeTitle` or dark `ProfilePage` header, exactly as the web does, so a
 * native header would be a second title bar above the real one.
 *
 * Splash → Onboarding → Login is the web's own entry sequence (`/` redirects
 * after 2.5s, and `/welcome` redirects straight to `/login`), and each of those
 * steps uses `navigation.reset` rather than `navigate`, so the back gesture
 * cannot return to the splash.
 */
export function StackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.background } }}>
      {/* Entry */}
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Forgot" component={ForgotScreen} />
      <Stack.Screen name="Setup" component={SetupScreen} />

      {/* The four tab roots */}
      <Stack.Screen name="Tabs" component={Tabs} />

      {/* Booking — the centre tab-bar button pushes this */}
      <Stack.Screen name="Book" component={BookingScreen} />

      {/* Catalog */}
      <Stack.Screen name="Services" component={ServicesScreen} />
      <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} />

      {/* Shipments, quotes and payment */}
      <Stack.Screen name="ShipmentDetail" component={ShipmentDetailScreen} />
      <Stack.Screen name="Quote" component={QuoteScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />

      {/* Inbox */}
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />

      {/* Account */}
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Billing" component={BillingScreen} />
      <Stack.Screen name="Addresses" component={AddressesScreen} />
      <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
      <Stack.Screen name="Gallery" component={GalleryScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} />

      {/* Support and legal — `Legal` carries `kind`, as /terms and /privacy do */}
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="Contact" component={ContactScreen} />
      <Stack.Screen name="Help" component={HelpScreen} />
      <Stack.Screen name="Legal" component={LegalScreen} />
    </Stack.Navigator>
  );
}

export default StackNavigator;
