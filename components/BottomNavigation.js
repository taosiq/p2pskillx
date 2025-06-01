import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../config/firebase';

const BottomNavigation = ({ activeScreen, onNavigate, unreadNotificationCount }) => {
  const [notificationCount, setNotificationCount] = useState(0);

  // If unreadNotificationCount is provided externally, use it
  // Otherwise, listen for unread notifications in Firestore
  useEffect(() => {
    // If the count is explicitly provided, use it
    if (unreadNotificationCount !== undefined) {
      setNotificationCount(unreadNotificationCount);
      return;
    }

    // Otherwise, set up a listener for unread notifications
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', currentUser.uid),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotificationCount(snapshot.size);
    }, (error) => {
      console.error('Error getting unread notifications count:', error);
    });

    return () => unsubscribe();
  }, [unreadNotificationCount]);

  const handlePress = (screenName) => {
    if (onNavigate) {
      onNavigate(screenName);
    }
  };

  return (
    <View style={styles.bottomNavigation}>
      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => handlePress('Dashboard')}
      >
        <MaterialCommunityIcons 
          name="view-dashboard" 
          size={24} 
          color={activeScreen === 'Dashboard' ? '#3B82F6' : '#6B7280'} 
        />
        <Text style={[styles.navText, activeScreen === 'Dashboard' && styles.activeNavText]}>
          Dashboard
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => handlePress('Home')}
      >
        <Ionicons 
          name="home-outline" 
          size={24} 
          color={activeScreen === 'Home' ? '#3B82F6' : '#6B7280'} 
        />
        <Text style={[styles.navText, activeScreen === 'Home' && styles.activeNavText]}>
          Home
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => handlePress('Messages')}
      >
        <Ionicons 
          name={activeScreen === 'Messages' ? "chatbubbles" : "chatbubbles-outline"}
          size={24} 
          color={activeScreen === 'Messages' ? '#3B82F6' : '#6B7280'} 
        />
        <Text style={[styles.navText, activeScreen === 'Messages' && styles.activeNavText]}>
          Messages
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => handlePress('Notifications')}
      >
        <View style={styles.notificationContainer}>
          <Ionicons 
            name={activeScreen === 'Notifications' ? "notifications" : "notifications-outline"}
            size={24} 
            color={activeScreen === 'Notifications' ? '#3B82F6' : '#6B7280'} 
          />
          {notificationCount > 0 && (
          <View style={styles.notificationBadge}>
              <Text style={styles.notificationCount}>
                {notificationCount > 99 ? '99+' : notificationCount}
              </Text>
          </View>
          )}
        </View>
        <Text style={[styles.navText, activeScreen === 'Notifications' && styles.activeNavText]}>
          Notifications
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => handlePress('Profile')}
      >
        <Ionicons 
          name={activeScreen === 'Profile' ? "person" : "person-outline"}
          size={24} 
          color={activeScreen === 'Profile' ? '#3B82F6' : '#6B7280'} 
        />
        <Text style={[styles.navText, activeScreen === 'Profile' && styles.activeNavText]}>
          Profile
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNavigation: {
    height: 60,
    backgroundColor: 'white',
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContainer: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#EF4444',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationCount: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  navText: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  activeNavText: {
    color: '#3B82F6',
  },
});

export default BottomNavigation; 