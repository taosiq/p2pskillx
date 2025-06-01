import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const SkillVerificationInputScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { category } = route.params || {};
  const [skills, setSkills] = useState(['']); // Start with one empty skill
  const [error, setError] = useState(false);
  
  // Pre-populate with skills from the selected category if available
  useEffect(() => {
    if (!category || !category.skills) {
      setError(true);
      return;
    }
    if (category.skills.length > 0) {
      setSkills([category.skills[0]]);
    }
  }, [category]);

  const addSkillBox = () => {
    setSkills([...skills, '']);
  };

  const updateSkill = (text, index) => {
    const newSkills = [...skills];
    newSkills[index] = text;
    setSkills(newSkills);
  };

  const startVerification = () => {
    // Filter out empty skills
    const validSkills = skills.filter(skill => skill.trim() !== '');
    
    if (validSkills.length === 0) {
      Alert.alert('Error', 'Please add at least one skill to verify');
      return;
    }

    // Navigate to MCQ screen with the skills
    navigation.navigate('SkillVerificationMCQ', {
      skills: validSkills,
      category: category
    });
  };

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#3B82F6" barStyle="light-content" />
        <View style={styles.content}>
          <Text style={styles.title}>Error</Text>
          <Text style={styles.subtitle}>No skill category was provided. Please go back and select a category.</Text>
          <TouchableOpacity style={styles.verifyButton} onPress={() => navigation.goBack()}>
            <Text style={styles.verifyButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#3B82F6" barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient
        colors={['#3B82F6', '#2563EB']}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Skill Verification</Text>
        <View style={styles.rightPlaceholder} />
      </LinearGradient>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>Verify Your Skills</Text>
          
          {category && (
            <View style={[styles.categoryBadge, { backgroundColor: category.background }]}>
              <Ionicons name={category.icon} size={20} color={category.color} />
              <Text style={[styles.categoryText, { color: category.color }]}>
                {category.name}
              </Text>
            </View>
          )}
          
          <Text style={styles.subtitle}>
            Add the skills you want to verify and teach others
          </Text>

          {skills.map((skill, index) => (
            <View key={index} style={styles.skillBox}>
              <TextInput
                style={styles.input}
                placeholder={`Skill ${index + 1}`}
                value={skill}
                onChangeText={(text) => updateSkill(text, index)}
              />
              
              {category && index === 0 && (
                <View style={styles.suggestionContainer}>
                  <Text style={styles.suggestionTitle}>Suggested skills in this category:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionScroll}>
                    {category.skills.map((suggestion, idx) => (
                      <TouchableOpacity 
                        key={idx} 
                        style={styles.suggestionBadge}
                        onPress={() => updateSkill(suggestion, index)}
                      >
                        <Text style={styles.suggestionText}>{suggestion}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          ))}

          <TouchableOpacity style={styles.addButton} onPress={addSkillBox}>
            <Text style={styles.addButtonText}>+ Add Another Skill</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.verifyButton} onPress={startVerification}>
          <Text style={styles.verifyButtonText}>Verify My Skills</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  rightPlaceholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1E293B',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 20,
  },
  skillBox: {
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  suggestionContainer: {
    marginTop: 12,
  },
  suggestionTitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  suggestionScroll: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  suggestionBadge: {
    backgroundColor: 'rgba(203, 213, 225, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: '#334155',
  },
  addButton: {
    padding: 16,
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 12,
    marginBottom: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  addButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  verifyButton: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SkillVerificationInputScreen; 