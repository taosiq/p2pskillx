export const dataScienceQuestions = [
  // Easy Questions
  {
    id: "ds_easy_1",
    question: "What does the term 'supervised learning' refer to in machine learning?",
    options: [
      "Training algorithms using labeled data", 
      "Having a human supervise the training process", 
      "Using multiple algorithms together", 
      "Training without any input data"
    ],
    correctAnswer: 0,
    difficulty: "easy",
    explanation: "Supervised learning is a machine learning approach where the model is trained on labeled data, learning to map inputs to the correct outputs."
  },
  {
    id: "ds_easy_2",
    question: "What is the purpose of the pandas library in Python?",
    options: [
      "Data manipulation and analysis", 
      "Creating interactive visualizations", 
      "Building neural networks", 
      "Web scraping"
    ],
    correctAnswer: 0,
    difficulty: "easy",
    explanation: "Pandas is a Python library used for data manipulation and analysis, providing data structures like DataFrame and tools for working with structured data."
  },
  {
    id: "ds_easy_3",
    question: "What type of plot would be best to visualize the distribution of a continuous variable?",
    options: [
      "Histogram", 
      "Pie chart", 
      "Bar chart", 
      "Scatter plot"
    ],
    correctAnswer: 0,
    difficulty: "easy",
    explanation: "A histogram is ideal for visualizing the distribution of a continuous variable, showing the frequency of values falling within specific ranges or bins."
  },
  {
    id: "ds_easy_4",
    question: "What does the acronym 'KNN' stand for in machine learning?",
    options: [
      "K-Nearest Neighbors", 
      "Kernel Neural Network", 
      "Knowledge Network Node", 
      "Key Nodal Network"
    ],
    correctAnswer: 0,
    difficulty: "easy",
    explanation: "KNN stands for K-Nearest Neighbors, a simple machine learning algorithm that classifies new data points based on the majority class of their K nearest neighbors."
  },
  {
    id: "ds_easy_5",
    question: "What is 'overfitting' in machine learning?",
    options: [
      "When a model learns the training data too well and performs poorly on new data", 
      "When a model is unable to learn from the training data", 
      "When a model is too simple to capture patterns", 
      "When training data is not diverse enough"
    ],
    correctAnswer: 0,
    difficulty: "easy",
    explanation: "Overfitting occurs when a model learns the noise and details in the training data too well, capturing random fluctuations rather than the underlying pattern."
  },
  
  // Hard Questions
  {
    id: "ds_hard_1",
    question: "In the context of gradient descent optimization, what is the purpose of momentum?",
    options: [
      "To accelerate convergence and reduce oscillation by accumulating past gradients", 
      "To prevent the learning rate from becoming too large", 
      "To add random noise to avoid local minima", 
      "To normalize gradients across different features"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "Momentum accumulates a moving average of past gradients to smooth optimization, accelerating convergence in consistent directions while dampening oscillations in high-curvature dimensions."
  },
  {
    id: "ds_hard_2",
    question: "Which technique addresses the vanishing gradient problem in deep neural networks?",
    options: [
      "Residual connections (ResNet architecture)", 
      "Increasing the batch size", 
      "Reducing the number of layers", 
      "Using the sigmoid activation throughout"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "Residual connections address the vanishing gradient problem by creating shortcut connections that allow gradients to flow through the network more effectively during backpropagation."
  },
  {
    id: "ds_hard_3",
    question: "What is the Wasserstein distance in the context of GANs (Generative Adversarial Networks)?",
    options: [
      "A metric that represents the minimum cost of transforming one probability distribution to another", 
      "The distance between the discriminator and generator networks", 
      "The maximum error tolerance in synthetic data generation", 
      "The Euclidean distance between real and fake samples"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "The Wasserstein distance (Earth Mover's distance) measures the minimum 'cost' to transform one probability distribution into another, providing a more stable gradient for GAN training."
  },
  {
    id: "ds_hard_4",
    question: "Which statement about the t-SNE (t-Distributed Stochastic Neighbor Embedding) algorithm is correct?",
    options: [
      "It preserves local similarities but not global structure when visualizing high-dimensional data", 
      "It requires specifying the exact number of clusters in advance", 
      "It always produces consistent results regardless of randomization", 
      "It is primarily used for time series analysis"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "t-SNE is a dimensionality reduction technique that emphasizes preserving local similarities in high-dimensional data, often at the expense of global structure."
  },
  {
    id: "ds_hard_5",
    question: "What is the purpose of Dropout in neural networks?",
    options: [
      "To prevent overfitting by randomly disabling neurons during training", 
      "To speed up the training process by reducing computation", 
      "To initialize network weights optimally", 
      "To adjust the learning rate dynamically"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "Dropout is a regularization technique that randomly deactivates a fraction of neurons during each training iteration, forcing the network to learn redundant representations and reduce co-adaptation."
  },
  {
    id: "ds_hard_6",
    question: "In the context of feature selection, what does the LASSO regression do?",
    options: [
      "Performs both feature selection and regularization by forcing some coefficients to zero", 
      "Selects features based solely on their correlation with the target variable", 
      "Uses tree-based methods to identify the most important features", 
      "Applies principal component analysis before regression"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "LASSO (Least Absolute Shrinkage and Selection Operator) regression adds an L1 penalty term that can shrink coefficients exactly to zero, effectively performing feature selection."
  },
  {
    id: "ds_hard_7",
    question: "What is the advantage of using Bayesian optimization for hyperparameter tuning?",
    options: [
      "It builds a probabilistic model of the objective function to make informed choices about which hyperparameters to try next", 
      "It exhaustively searches all possible hyperparameter combinations", 
      "It relies solely on random sampling of the hyperparameter space", 
      "It only requires evaluating the model once to determine optimal parameters"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "Bayesian optimization uses previous evaluations to build a surrogate model of the objective function, balancing exploration and exploitation to efficiently find optimal hyperparameters."
  },
  {
    id: "ds_hard_8",
    question: "Which property of the XGBoost algorithm contributes most to its efficiency with large datasets?",
    options: [
      "Its ability to handle sparse matrices and use approximate split finding algorithms", 
      "Its reliance on deep neural network architectures", 
      "Its implementation of k-means clustering before building trees", 
      "Its use of support vector machines as base learners"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "XGBoost efficiently handles large datasets through sparse matrix awareness, approximate split finding algorithms, and efficient cache utilization, enabling faster training on large-scale data."
  },
  {
    id: "ds_hard_9",
    question: "In the context of anomaly detection, what is the isolation forest algorithm's key innovation?",
    options: [
      "It isolates anomalies using random partitioning, with anomalies requiring fewer splits to isolate", 
      "It builds dense clusters and identifies points furthest from cluster centers", 
      "It uses neural networks to encode normal patterns and detect deviations", 
      "It calculates the statistical distance of each point from a multivariate distribution"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "Isolation Forest isolates observations by randomly selecting features and split values, with anomalies being easier to isolate (requiring fewer splits) due to their nature of being 'few and different'."
  },
  {
    id: "ds_hard_10",
    question: "What is the purpose of the Focal Loss function in object detection models?",
    options: [
      "To address class imbalance by down-weighting well-classified examples", 
      "To minimize the computational cost of training deep networks", 
      "To normalize output probabilities across different object classes", 
      "To handle missing values in the training dataset"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "Focal Loss addresses class imbalance (especially in object detection) by down-weighting well-classified examples, allowing the model to focus more on hard, misclassified examples during training."
  },
  {
    id: "ds_hard_11",
    question: "What does the term 'attention mechanism' refer to in transformer models?",
    options: [
      "A way to weight input tokens differently based on their relevance to other tokens", 
      "A technique to focus only on the beginning and end of sequences", 
      "A method to filter out unnecessary training examples", 
      "A regularization approach to prevent memorization"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "Attention mechanisms in transformers compute weighted connections between all tokens, allowing the model to focus on relevant parts of the input sequence when producing each output element."
  },
  {
    id: "ds_hard_12",
    question: "What distinguishes CatBoost from other gradient boosting frameworks?",
    options: [
      "Its handling of categorical features without requiring pre-processing and its ordered boosting approach", 
      "Its ability to train only on GPU hardware", 
      "Its integration with deep learning frameworks", 
      "Its use of random forests instead of decision trees"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "CatBoost's key innovations include native handling of categorical features without preprocessing and ordered boosting to address prediction shift (target leakage) issues in traditional gradient boosting."
  },
  {
    id: "ds_hard_13",
    question: "What is the purpose of the DeepFM architecture in recommendation systems?",
    options: [
      "To jointly learn explicit and implicit feature interactions through wide and deep components", 
      "To apply deep reinforcement learning to recommendation tasks", 
      "To cluster users based on their feature similarities", 
      "To encrypt user data while maintaining recommendation quality"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "DeepFM combines a factorization machine component to model low-order feature interactions with a deep neural network to capture high-order interactions, improving recommendation accuracy."
  },
  {
    id: "ds_hard_14",
    question: "In time series forecasting, what does a SARIMA model account for that a standard ARIMA model does not?",
    options: [
      "Seasonal patterns in the data", 
      "Spatial coordinates of observations", 
      "Sentiment analysis of textual data", 
      "Socioeconomic factors affecting the time series"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "SARIMA (Seasonal ARIMA) extends ARIMA by incorporating additional terms to handle seasonal components in time series data, capturing recurring patterns at fixed intervals."
  },
  {
    id: "ds_hard_15",
    question: "What is the basic concept behind Variational Autoencoders (VAEs)?",
    options: [
      "Learning a probabilistic mapping between data and a latent space with regularization toward a prior distribution", 
      "Using multiple encoders competing to reconstruct the input data", 
      "Applying variational calculus to traditional neural networks", 
      "Encoding inputs as binary vectors to minimize reconstruction error"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "VAEs learn to encode data as a probability distribution in latent space rather than a fixed vector, with regularization toward a prior distribution (typically Gaussian), enabling generative capabilities."
  }
]; 