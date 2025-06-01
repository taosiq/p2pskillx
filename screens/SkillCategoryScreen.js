import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const CATEGORIES = [
  {
    id: '1',
    name: 'Information Technology & AI',
    icon: 'laptop',
    color: '#4F8EF7',
    background: 'rgba(79, 142, 247, 0.1)',
    description: 'Web development, data science, AI, software engineering, and more',
    skills: ['Web Development', 'Data Science', 'Machine Learning', 'Software Engineering', 'Cybersecurity']
  },
  {
    id: '2',
    name: 'Leadership & Management',
    icon: 'people',
    color: '#FF9500',
    background: 'rgba(255, 149, 0, 0.1)',
    description: 'Team leadership, project management, strategic planning, and more',
    skills: ['Team Leadership', 'Project Management', 'Strategic Planning', 'Business Development', 'Conflict Resolution']
  },
  {
    id: '3',
    name: 'Culinary Arts & Food Services',
    icon: 'restaurant',
    color: '#FF3B30',
    background: 'rgba(255, 59, 48, 0.1)',
    description: 'Cooking techniques, baking, food presentation, menu planning, and more',
    skills: ['Cooking Techniques', 'Baking', 'Food Presentation', 'Menu Planning', 'Food Safety']
  },
  {
    id: '4',
    name: 'Design & Creative Arts',
    icon: 'brush',
    color: '#5856D6',
    background: 'rgba(88, 86, 214, 0.1)',
    description: 'Graphic design, UI/UX, photography, animation, and more',
    skills: ['Graphic Design', 'UI/UX Design', 'Photography', 'Animation', 'Illustration']
  },
  {
    id: '5',
    name: 'Health & Fitness',
    icon: 'fitness',
    color: '#30D158',
    background: 'rgba(48, 209, 88, 0.1)',
    description: 'Nutrition, workout routines, personal training, yoga, and more',
    skills: ['Nutrition', 'Workout Planning', 'Yoga Instruction', 'Personal Training', 'Fitness Assessment']
  },
  {
    id: '6',
    name: 'Video Editing',
    icon: 'videocam',
    color: '#FF2D55',
    background: 'rgba(255, 45, 85, 0.1)',
    description: 'Video production, editing techniques, special effects, color grading, and more',
    skills: ['Adobe Premiere Pro', 'Final Cut Pro', 'Video Production', 'Motion Graphics', 'Color Grading']
  },
  {
    id: '7',
    name: 'Photo Editing',
    icon: 'image',
    color: '#AF52DE',
    background: 'rgba(175, 82, 222, 0.1)',
    description: 'Photo manipulation, retouching, color correction, composition, and more',
    skills: ['Adobe Photoshop', 'Lightroom', 'Portrait Retouching', 'Color Correction', 'Photo Composition']
  },
  {
    id: '8',
    name: 'Marketing',
    icon: 'megaphone',
    color: '#FF9F0A',
    background: 'rgba(255, 159, 10, 0.1)',
    description: 'Digital marketing, social media, SEO, content strategy, and more',
    skills: ['Social Media Marketing', 'SEO', 'Content Strategy', 'Email Marketing', 'Brand Development']
  },
];

const SkillCategoryScreen = () => {
  const navigation = useNavigation();
  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category.id);
    
    // After a short delay, navigate to the skill input screen with the selected category
    setTimeout(() => {
      navigation.navigate('SkillVerificationInput', {
        category: category
      });
    }, 300);
  };

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
        <Text style={styles.headerTitle}>Select Skill Category</Text>
        <View style={styles.rightPlaceholder} />
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>Choose a Category</Text>
          <Text style={styles.subtitle}>
            Select the category that best describes your skill
          </Text>

          <View style={styles.categoriesContainer}>
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryCard,
                  selectedCategory === category.id && styles.selectedCard
                ]}
                onPress={() => handleCategorySelect(category)}
                activeOpacity={0.7}
              >
                <View style={[styles.categoryHeader, {backgroundColor: category.background}]}>
                  <View style={[styles.iconContainer, {backgroundColor: category.color}]}>
                    <Ionicons name={category.icon} size={24} color="white" />
                  </View>
                  <Text style={styles.categoryName}>{category.name}</Text>
                </View>
                
                <View style={styles.categoryContent}>
                  <Text style={styles.categoryDescription} numberOfLines={2}>
                    {category.description}
                  </Text>
                  
                  <View style={styles.skillsContainer}>
                    {category.skills.slice(0, 3).map((skill, index) => (
                      <View key={index} style={[styles.skillBadge, {backgroundColor: `${category.color}15`}]}>
                        <Text style={[styles.skillText, {color: category.color}]}>{skill}</Text>
                      </View>
                    ))}
                    {category.skills.length > 3 && (
                      <View style={[styles.moreBadge, {backgroundColor: `${category.color}10`}]}>
                        <Text style={[styles.moreText, {color: category.color}]}>+{category.skills.length - 3}</Text>
                      </View>
                    )}
                  </View>
                </View>
                
                <View style={styles.selectionIndicator}>
                  <View style={[
                    styles.radioOuter,
                    selectedCategory === category.id && { borderColor: category.color }
                  ]}>
                    {selectedCategory === category.id && (
                      <View style={[styles.radioInner, { backgroundColor: category.color }]} />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 24,
  },
  categoriesContainer: {
    gap: 20,
  },
  categoryCard: {
    borderRadius: 16,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.5)',
    overflow: 'hidden',
  },
  selectedCard: {
    borderColor: '#3B82F6',
    borderWidth: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.5)',
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  categoryContent: {
    padding: 16,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    flex: 1,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 20,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 30,
  },
  skillText: {
    fontSize: 12,
    fontWeight: '500',
  },
  moreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 30,
  },
  moreText: {
    fontSize: 12,
    fontWeight: '500',
  },
  selectionIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3B82F6',
  },
});

export default SkillCategoryScreen; 