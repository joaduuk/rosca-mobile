import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Pressable, Text, View } from "react-native";
import GroupsListScreen from "../screens/groups/GroupsListScreen";
import GroupDetailScreen from "../screens/groups/GroupDetailScreen";
import CreateGroupScreen from "../screens/groups/CreateGroupScreen";
import AddMemberScreen from "../screens/groups/AddMemberScreen";
import RecordPaymentScreen from "../screens/groups/RecordPaymentScreen";
import CycleManagementScreen from "../screens/groups/CycleManagementScreen";
import ReportsScreen from "../screens/groups/ReportsScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";
import NotificationsScreen from "../screens/notifications/NotificationsScreen";
import { useNotifications } from "../notifications/NotificationContext";

const Stack = createNativeStackNavigator();

function BellButton({ navigation }: any) {
  const { unreadCount } = useNotifications();
  return (
    <Pressable onPress={() => navigation.navigate("Notifications")} style={{ marginRight: 4 }}>
      <View>
        <Text style={{ fontSize: 18 }}>🔔</Text>
        {unreadCount > 0 ? (
          <View
            style={{
              position: "absolute",
              top: -4,
              right: -6,
              backgroundColor: "#ef4444",
              borderRadius: 8,
              minWidth: 16,
              height: 16,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 2,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 9, fontWeight: "700" }}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function AppStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Groups"
        component={GroupsListScreen}
        options={({ navigation }: any) => ({
          title: "My Groups",
          headerRight: () => (
            <View style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
              <BellButton navigation={navigation} />
              <Pressable onPress={() => navigation.navigate("CreateGroup")}>
                <Text style={{ color: "#1a6b4a", fontWeight: "700", fontSize: 20 }}>+</Text>
              </Pressable>
              <Pressable onPress={() => navigation.navigate("Profile")}>
                <Text style={{ color: "#f0a500", fontWeight: "600" }}>Profile</Text>
              </Pressable>
            </View>
          ),
        })}
      />
      <Stack.Screen
        name="GroupDetail"
        component={GroupDetailScreen}
        options={({ route }: any) => ({ title: route.params?.groupName || "Group" })}
      />
      <Stack.Screen name="CreateGroup" component={CreateGroupScreen} options={{ title: "New Group" }} />
      <Stack.Screen name="AddMember" component={AddMemberScreen} options={{ title: "Add Member" }} />
      <Stack.Screen name="RecordPayment" component={RecordPaymentScreen} options={{ title: "Record Payment" }} />
      <Stack.Screen name="CycleManagement" component={CycleManagementScreen} options={{ title: "Manage Cycle" }} />
      <Stack.Screen name="Reports" component={ReportsScreen} options={{ title: "Reports" }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: "Notifications" }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: "My Profile" }} />
    </Stack.Navigator>
  );
}