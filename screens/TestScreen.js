import React, { useState } from 'react';
import {
    ActivityIndicator,
    Button,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import { createTestConversation, testDatabasePermissions } from '../utils/testDatabase';

const TestScreen = () => {
  const [results, setResults] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState('');

  const runTest = async () => {
    setLoading(true);
    try {
      const testResults = await testDatabasePermissions(conversationId || null);
      setResults(testResults);
    } catch (error) {
      setResults(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const createTest = async () => {
    setLoading(true);
    try {
      const newConversationId = await createTestConversation();
      setConversationId(newConversationId);
      setResults(`Created test conversation: ${newConversationId}`);
    } catch (error) {
      setResults(`Error creating test: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Firebase Permissions Test</Text>
        
        <Text style={styles.label}>Conversation ID (optional):</Text>
        <TextInput
          style={styles.input}
          value={conversationId}
          onChangeText={setConversationId}
          placeholder="Enter conversation ID to test"
        />
        
        <View style={styles.buttonContainer}>
          <Button 
            title="Test Permissions" 
            onPress={runTest}
            disabled={loading}
          />
          
          <Button 
            title="Create Test Conversation" 
            onPress={createTest}
            disabled={loading}
          />
        </View>
        
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text>Testing...</Text>
          </View>
        )}
        
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsLabel}>Results:</Text>
          <Text>{results}</Text>
          <Text style={styles.note}>
            Check your console logs for detailed information.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  resultsContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resultsLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  note: {
    marginTop: 20,
    fontStyle: 'italic',
    color: '#6B7280',
  },
});

export default TestScreen; 