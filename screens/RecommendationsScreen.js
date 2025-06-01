import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { getPersonalizedRecommendations } from '../utils/recommendationEngine';

const RecommendationsScreen = ({ navigation }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [filteredRecommendations, setFilteredRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    setIsLoading(true);
    try {
      const userRecommendations = await getPersonalizedRecommendations();
      setRecommendations(userRecommendations);
      setFilteredRecommendations(userRecommendations);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterRecommendations = (filter) => {
    setActiveFilter(filter);
    if (filter === 'all') {
      setFilteredRecommendations(recommendations);
    } else {
      setFilteredRecommendations(
        recommendations.filter(item => item.source === filter)
      );
    }
  };

  const getSourceIcon = (source) => {
    switch(source) {
      case 'skill':
        return <Ionicons name="school-outline" size={14} color="#10B981" />;
      case 'social':
        return <Ionicons name="people-outline" size={14} color="#3B82F6" />;
      case 'interest':
        return <Ionicons name="heart-outline" size={14} color="#EC4899" />;
      case 'popular':
        return <Ionicons name="trending-up-outline" size={14} color="#F59E0B" />;
      default:
        return <Ionicons name="star-outline" size={14} color="#6B7280" />;
    }
  };

  const getSourceColor = (source) => {
    switch(source) {
      case 'skill':
        return '#10B981';
      case 'social':
        return '#3B82F6';
      case 'interest':
        return '#EC4899';
      case 'popular':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const handleCoursePress = (course) => {
    navigation.navigate('CourseDetails', { courseId: course.id });
  };

  const renderRecommendationItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.recommendationCard}
      onPress={() => handleCoursePress(item)}
    >
      <View 
        style={[
          styles.recommendColorBar, 
          { backgroundColor: getSourceColor(item.source) }
        ]} 
      />
      <View style={styles.recommendContent}>
        <View style={styles.recommendHeader}>
          <View style={[styles.sourceBadge, { backgroundColor: `${getSourceColor(item.source)}20` }]}>
            {getSourceIcon(item.source)}
            <Text style={[styles.sourceText, { color: getSourceColor(item.source) }]}>
              {item.source === 'skill' ? 'SKILL' : 
              item.source === 'social' ? 'SOCIAL' : 
              item.source === 'interest' ? 'INTEREST' : 'POPULAR'}
            </Text>
          </View>
          <Text style={styles.recommendTitle}>{item.title || item.category}</Text>
        </View>
        <Text style={styles.recommendDetails}>
          {item.reason || `Recommended for you • ${item.credits || 5} credits`}
        </Text>
        <View style={styles.courseMetaData}>
          <View style={styles.metaDataItem}>
            <Ionicons name="person-outline" size={14} color="#6B7280" />
            <Text style={styles.metaDataText}>{item.creatorName || 'Unknown Instructor'}</Text>
          </View>
          <View style={styles.metaDataItem}>
            <Ionicons name="time-outline" size={14} color="#6B7280" />
            <Text style={styles.metaDataText}>{item.duration || '2 hours'}</Text>
          </View>
          <View style={styles.metaDataItem}>
            <Ionicons name="star-outline" size={14} color="#6B7280" />
            <Text style={styles.metaDataText}>{item.rating || '4.5'} ★</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recommendations</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={loadRecommendations}
        >
          <Ionicons name="refresh" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              activeFilter === 'all' && styles.activeFilterButton
            ]}
            onPress={() => filterRecommendations('all')}
          >
            <Text style={[
              styles.filterText, 
              activeFilter === 'all' && styles.activeFilterText
            ]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              activeFilter === 'skill' && styles.activeFilterButton,
              { borderColor: '#10B981' }
            ]}
            onPress={() => filterRecommendations('skill')}
          >
            <Ionicons 
              name="school-outline" 
              size={14} 
              color={activeFilter === 'skill' ? 'white' : '#10B981'} 
              style={styles.filterIcon}
            />
            <Text style={[
              styles.filterText, 
              { color: activeFilter === 'skill' ? 'white' : '#10B981' }
            ]}>Skills</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              activeFilter === 'social' && styles.activeFilterButton,
              { borderColor: '#3B82F6' }
            ]}
            onPress={() => filterRecommendations('social')}
          >
            <Ionicons 
              name="people-outline" 
              size={14} 
              color={activeFilter === 'social' ? 'white' : '#3B82F6'} 
              style={styles.filterIcon}
            />
            <Text style={[
              styles.filterText, 
              { color: activeFilter === 'social' ? 'white' : '#3B82F6' }
            ]}>Following</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              activeFilter === 'interest' && styles.activeFilterButton,
              { borderColor: '#EC4899' }
            ]}
            onPress={() => filterRecommendations('interest')}
          >
            <Ionicons 
              name="heart-outline" 
              size={14} 
              color={activeFilter === 'interest' ? 'white' : '#EC4899'} 
              style={styles.filterIcon}
            />
            <Text style={[
              styles.filterText, 
              { color: activeFilter === 'interest' ? 'white' : '#EC4899' }
            ]}>Interests</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              activeFilter === 'popular' && styles.activeFilterButton,
              { borderColor: '#F59E0B' }
            ]}
            onPress={() => filterRecommendations('popular')}
          >
            <Ionicons 
              name="trending-up-outline" 
              size={14} 
              color={activeFilter === 'popular' ? 'white' : '#F59E0B'} 
              style={styles.filterIcon}
            />
            <Text style={[
              styles.filterText, 
              { color: activeFilter === 'popular' ? 'white' : '#F59E0B' }
            ]}>Popular</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Finding the best courses for you...</Text>
        </View>
      ) : filteredRecommendations.length > 0 ? (
        <FlatList
          data={filteredRecommendations}
          renderItem={renderRecommendationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={60} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No Recommendations Found</Text>
          <Text style={styles.emptyDescription}>
            We couldn't find any recommendations matching your filter.
            Try another filter or refresh to get more recommendations.
          </Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={loadRecommendations}
          >
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  refreshButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterScroll: {
    paddingHorizontal: 16,
  },
  filterButton: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: 'white',
  },
  activeFilterButton: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeFilterText: {
    color: 'white',
  },
  filterIcon: {
    marginRight: 4,
  },
  listContainer: {
    padding: 16,
  },
  recommendationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    flexDirection: 'row',
  },
  recommendColorBar: {
    width: 6,
    height: '100%',
  },
  recommendContent: {
    flex: 1,
    padding: 16,
  },
  recommendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sourceBadge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  sourceText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  recommendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  recommendDetails: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 12,
  },
  courseMetaData: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 4,
  },
  metaDataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaDataText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
});

export default RecommendationsScreen; 