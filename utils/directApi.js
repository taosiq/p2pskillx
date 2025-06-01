import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiKey } from './apiKeyManager';

// Direct API implementation using fetch for more reliable network connections
export const generateQuestionsViaOpenRouter = async (skill) => {
  console.log(`Generating questions for ${skill} via direct API`);
  
  // Set a shorter global timeout - we'll fail faster and use local questions instead
  const globalTimeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('Global API timeout - switching to offline mode'));
    }, 20000);
  });
  
  // Wrap all the logic in a Promise.race
  return Promise.race([
    (async () => {
      try {
        // Get API key from apiKeyManager instead of hardcoding
        const apiKey = await getApiKey();
        
        if (!apiKey) {
          throw new Error('No API key configured. Using offline questions.');
        }
        
        console.log('Using API key:', apiKey.substring(0, 8) + '...');
        
        // Single endpoint to try - the secondary one is often problematic
        const endpoint = 'https://openrouter.ai/api/v1/chat/completions';
        
        // Reduced request size for better reliability
        const requestBody = {
          model: "deepseek/deepseek-chat",
          messages: [{
            role: "user",
            content: `Create 8 multiple-choice questions about ${skill}. Each question should have 4 options and mark the correct answer with index 0-3.

JSON format:
{
  "questions": [
    {
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Brief explanation"
    }
  ]
}`
          }],
          temperature: 0.1,
          max_tokens: 800
        };
        
        // No retries - just try once and fail gracefully to local questions
        console.log(`Trying API endpoint: ${endpoint}`);
        
        // Very short timeout to fail quickly if the API isn't responsive
        const timeoutDuration = 15000;
        const controller = new AbortController();
        
        const timeoutId = setTimeout(() => {
          console.log(`Aborting request to ${endpoint} due to timeout`);
          controller.abort();
        }, timeoutDuration);
        
        try {
          // Make the request with optimized settings
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
              'HTTP-Referer': 'https://p2pskillx.app',
              'X-Title': 'P2PSkillX',
              'User-Agent': 'P2PSkillXMobileApp/1.0 Mobile',
              'Accept': 'application/json',
              'Connection': 'close'
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal,
            cache: 'no-store'
          });
          
          // Clear the timeout
          clearTimeout(timeoutId);
          
          if (response.ok) {
            console.log(`Success with endpoint: ${endpoint}`);
            
            // Parse the JSON response
            const responseData = await response.json();
            console.log('Received response from API');
            
            // Extract the content
            const resultContent = responseData.choices[0].message.content;
            
            // Get JSON data - handle failures gracefully
            let jsonData;
            try {
              jsonData = JSON.parse(resultContent);
            } catch (e) {
              // Try to extract JSON if direct parsing fails
              const jsonMatch = resultContent.match(/\{[\s\S]*\}/);
              if (!jsonMatch) {
                throw new Error('Could not extract JSON from response');
              }
              jsonData = JSON.parse(jsonMatch[0]);
            }
            
            // Validate structure
            if (!jsonData.questions || !Array.isArray(jsonData.questions) || jsonData.questions.length === 0) {
              throw new Error('Invalid response format from API');
            }
            
            // Add IDs to questions
            const questionsWithIds = jsonData.questions.map((q, index) => ({
              ...q,
              id: index
            }));
            
            // Cache the questions
            const cachedKey = `mcqs-${skill.toLowerCase().replace(/\s+/g, '-')}`;
            await AsyncStorage.setItem(cachedKey, JSON.stringify(questionsWithIds));
            
            console.log(`Successfully generated ${questionsWithIds.length} questions for ${skill} via API`);
            return questionsWithIds;
          } else {
            // Log details for non-OK responses
            const statusText = response.statusText || 'No status text';
            console.error(`Error with endpoint ${endpoint}: ${response.status} - ${statusText}`);
            throw new Error('API responded with an error. Using offline questions.');
          }
        } catch (fetchError) {
          // Clear the timeout if not already cleared
          clearTimeout(timeoutId);
          
          if (fetchError.name === 'AbortError') {
            console.error(`Request to ${endpoint} timed out`);
          } else {
            console.error(`Failed to connect to endpoint ${endpoint}:`, fetchError);
          }
          
          throw new Error('API connection failed. Using offline questions.');
        }
      } catch (error) {
        console.error('Direct API Error:', error.message || error);
        throw error; // Pass the original error up
      }
    })(),
    globalTimeoutPromise
  ]);
}; 