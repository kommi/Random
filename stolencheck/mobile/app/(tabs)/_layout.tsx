import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/theme';

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    home: '🏠',
    'register-item': '📝',
    'my-items': '📦',
    scan: '📷',
    search: '🔍',
    alerts: '🚨',
    map: '🗺️',
    profile: '👤',
  };
  return (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>
      {icons[name] || '📱'}
    </Text>
  );
}

export default function TabsLayout() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role || 'BUYER';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '600' },
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}
    >
      {/* Shared home tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerTitle: 'StoleCheck',
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />

      {/* Victim tabs */}
      <Tabs.Screen
        name="victim/register-item"
        options={{
          title: 'Report',
          headerTitle: 'Report Stolen Item',
          tabBarIcon: ({ focused }) => <TabIcon name="register-item" focused={focused} />,
          href: role === 'VICTIM' ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="victim/my-items"
        options={{
          title: 'My Items',
          headerTitle: 'My Stolen Items',
          tabBarIcon: ({ focused }) => <TabIcon name="my-items" focused={focused} />,
          href: role === 'VICTIM' ? undefined : null,
        }}
      />

      {/* Buyer tabs */}
      <Tabs.Screen
        name="buyer/scan"
        options={{
          title: 'Scan',
          headerTitle: 'Scan Item',
          tabBarIcon: ({ focused }) => <TabIcon name="scan" focused={focused} />,
          href: role === 'BUYER' ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="buyer/search"
        options={{
          title: 'Search',
          headerTitle: 'Search Database',
          tabBarIcon: ({ focused }) => <TabIcon name="search" focused={focused} />,
          href: role === 'BUYER' ? undefined : null,
        }}
      />

      {/* Officer tabs */}
      <Tabs.Screen
        name="officer/alerts"
        options={{
          title: 'Alerts',
          headerTitle: 'Alerts',
          tabBarIcon: ({ focused }) => <TabIcon name="alerts" focused={focused} />,
          href: role === 'OFFICER' ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="officer/map"
        options={{
          title: 'Map',
          headerTitle: 'Alert Map',
          tabBarIcon: ({ focused }) => <TabIcon name="map" focused={focused} />,
          href: role === 'OFFICER' ? undefined : null,
        }}
      />

      {/* Shared profile tab */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerTitle: 'My Profile',
          tabBarIcon: ({ focused }) => <TabIcon name="profile" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
