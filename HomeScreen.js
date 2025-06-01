const handleProfilePress = () => {
  // Navigate to the user's profile with a fresh screen entry
  console.log('Navigating to profile of user:', post.userId);
  navigation.navigate('Profile', { 
    userId: post.userId,
    timestamp: new Date().getTime() // Force React Navigation to treat this as a new screen instance
  });
}; 