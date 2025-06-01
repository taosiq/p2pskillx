export const aiQuestions = [
  // Easy Questions
  {
    id: "ai_easy_1",
    question: "What does AI stand for?",
    options: [
      "Artificial Intelligence", 
      "Automated Information", 
      "Advanced Integration", 
      "Algorithmic Interface"
    ],
    correctAnswer: 0,
    difficulty: "easy",
    explanation: "AI stands for Artificial Intelligence, which refers to the simulation of human intelligence in machines programmed to think and learn like humans."
  },
  {
    id: "ai_easy_2",
    question: "Which of the following is an example of a virtual assistant powered by AI?",
    options: [
      "Siri", 
      "Photoshop", 
      "Excel", 
      "Firefox"
    ],
    correctAnswer: 0,
    difficulty: "easy",
    explanation: "Siri is a virtual assistant powered by AI technology, developed by Apple and integrated into their iOS devices to perform tasks and answer questions based on voice commands."
  },
  {
    id: "ai_easy_3",
    question: "What is machine learning?",
    options: [
      "A subset of AI that enables systems to learn from data without explicit programming", 
      "The physical maintenance of computer hardware", 
      "The process of manually inputting code into machines", 
      "A technique for improving processor speed"
    ],
    correctAnswer: 0,
    difficulty: "easy",
    explanation: "Machine learning is a subset of artificial intelligence that enables systems to learn patterns from data and improve from experience without being explicitly programmed."
  },
  {
    id: "ai_easy_4",
    question: "What is the main goal of natural language processing (NLP)?",
    options: [
      "To enable computers to understand and process human language", 
      "To create new human languages", 
      "To translate programming languages into binary code", 
      "To develop new programming languages"
    ],
    correctAnswer: 0,
    difficulty: "easy",
    explanation: "Natural Language Processing (NLP) aims to enable computers to understand, interpret, and generate human language in a way that is both meaningful and useful."
  },
  {
    id: "ai_easy_5",
    question: "What is the basic concept of a neural network in AI?",
    options: [
      "A computing system inspired by the structure of the human brain", 
      "A physical network of computers working together", 
      "A network of servers hosting AI applications", 
      "A type of internet connection for AI systems"
    ],
    correctAnswer: 0,
    difficulty: "easy",
    explanation: "Neural networks are computing systems inspired by the biological neural networks in human brains, consisting of artificial neurons that can learn to perform tasks by analyzing examples."
  },
  
  // Hard Questions
  {
    id: "ai_hard_1",
    question: "What is the 'catastrophic forgetting' problem in neural networks?",
    options: [
      "The tendency of neural networks to abruptly forget previously learned information when learning new information", 
      "A hardware failure causing all trained models to be lost", 
      "The inability of neural networks to store more than a limited amount of information", 
      "A theoretical limit on how much a neural network can learn"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "Catastrophic forgetting occurs when neural networks lose previously acquired knowledge after learning new information, essentially 'overwriting' old patterns with new ones instead of integrating them."
  },
  {
    id: "ai_hard_2",
    question: "What is a Generative Adversarial Network (GAN)?",
    options: [
      "A system where two neural networks compete: one generates content and one discriminates between real and generated content", 
      "A network that generates adversarial examples to test security systems", 
      "A networking protocol that generates secure connections between AI systems", 
      "A generative model that adversarially competes with human content creators"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "GANs consist of two neural networks (generator and discriminator) that compete in a game-theoretic scenario, where the generator creates content and the discriminator evaluates it, with the generator improving to fool the discriminator."
  },
  {
    id: "ai_hard_3",
    question: "What is the 'explainability problem' in modern AI systems?",
    options: [
      "The difficulty in understanding and explaining how complex AI systems arrive at their decisions", 
      "The challenge of explaining AI concepts to non-technical stakeholders", 
      "The inability of AI systems to explain their reasoning in human language", 
      "The gap between theoretical explanations and practical implementations of AI"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "The explainability problem refers to the black box nature of many complex AI systems (particularly deep learning models), making it difficult to understand or explain the rationale behind their decisions."
  },
  {
    id: "ai_hard_4",
    question: "What is 'transfer learning' in the context of AI?",
    options: [
      "A technique where a model developed for one task is reused as the starting point for a model on a second task", 
      "The process of transferring AI systems between different computing platforms", 
      "Moving trained models from one machine to another", 
      "Transferring human knowledge directly into AI systems"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "Transfer learning is a machine learning technique where a pre-trained model is adapted or fine-tuned for a different but related problem, leveraging knowledge gained from solving the original task."
  },
  {
    id: "ai_hard_5",
    question: "Which component enables transformers to handle long-range dependencies in text?",
    options: [
      "Self-attention mechanism", 
      "Feed-forward layers", 
      "Layer normalization", 
      "Positional encoding"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "The self-attention mechanism allows transformer models to weigh the importance of different words in relation to each other regardless of their distance in the sequence, enabling effective handling of long-range dependencies."
  },
  {
    id: "ai_hard_6",
    question: "What is 'few-shot learning' in AI?",
    options: [
      "The ability of a model to generalize from very few examples of a new task", 
      "Training a model with a small amount of computational resources", 
      "Learning that occurs in a few short training iterations", 
      "An approach that uses multiple small neural networks instead of one large one"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "Few-shot learning is the capability of a machine learning system to learn new tasks or concepts from only a few examples, contrary to traditional systems that require large amounts of training data."
  },
  {
    id: "ai_hard_7",
    question: "What is a 'Boltzmann Machine' in AI?",
    options: [
      "A type of stochastic recurrent neural network that can learn probability distributions", 
      "A thermodynamic model used to optimize neural networks", 
      "A machine learning algorithm inspired by the laws of thermodynamics", 
      "A hardware device that maintains optimal temperature for AI processors"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "A Boltzmann Machine is a type of stochastic recurrent neural network that can learn probability distributions from its inputs, consisting of symmetrically connected neurons that make stochastic decisions about whether to be on or off."
  },
  {
    id: "ai_hard_8",
    question: "What distinguishes causal inference from traditional predictive modeling?",
    options: [
      "Causal inference aims to understand the effects of interventions rather than just make predictions based on correlations", 
      "Causal inference only works with time-series data while predictive modeling works with any data type", 
      "Causal inference requires less data than predictive modeling", 
      "Causal inference always uses deep learning while predictive modeling uses simpler algorithms"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "Causal inference focuses on understanding the effects of interventions and estimating counterfactuals (what would happen if conditions changed), while predictive modeling focuses on forecasting outcomes based on observed patterns and correlations."
  },
  {
    id: "ai_hard_9",
    question: "What is a key limitation of reinforcement learning?",
    options: [
      "The exploration-exploitation dilemma, where the agent must balance exploring new actions with exploiting known good actions", 
      "Reinforcement learning can only be applied to video games and simulations", 
      "Reinforcement learning cannot handle continuous action spaces", 
      "Reinforcement learning requires human supervision at all times"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "The exploration-exploitation dilemma is a fundamental challenge in reinforcement learning, where agents must balance trying new actions to discover better strategies (exploration) with choosing actions known to yield good rewards (exploitation)."
  },
  {
    id: "ai_hard_10",
    question: "What is 'prompt engineering' in the context of large language models?",
    options: [
      "The practice of designing inputs to generate desired outputs from language models", 
      "Creating hardware prompts for accelerating language model inference", 
      "Engineering the initial training prompts for language model development", 
      "Restructuring language model architecture to respond to prompts faster"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "Prompt engineering involves designing and refining the input prompts given to language models to elicit more accurate, relevant, or useful outputs, essentially 'programming' the model through its input."
  },
  {
    id: "ai_hard_11",
    question: "Which of the following best describes the 'attention mechanism' in transformer models?",
    options: [
      "A way to dynamically focus on different parts of the input sequence when generating each part of the output", 
      "A mechanism that alerts the model when user attention is focused on specific outputs", 
      "A filtering system that removes unimportant parts of the input", 
      "A component that tracks which model parameters require the most attention during training"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "The attention mechanism allows transformer models to dynamically weight the importance of different tokens in the input sequence when generating each token in the output, enabling more effective capture of contextual relationships."
  },
  {
    id: "ai_hard_12",
    question: "What is a 'diffusion model' in AI?",
    options: [
      "A generative model that gradually adds and then removes noise from data to learn its distribution", 
      "A model that simulates how ideas diffuse through social networks", 
      "A network architecture where information diffuses between layers instead of using direct connections", 
      "A model that spreads computational load across multiple processing units"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "Diffusion models are generative models that learn by gradually adding noise to training data and then learning to reverse this process, effectively learning to denoise data, which enables high-quality image generation."
  },
  {
    id: "ai_hard_13",
    question: "What is 'model distillation' in deep learning?",
    options: [
      "A technique where knowledge from a large, complex model is transferred to a smaller, simpler model",
      "The process of extracting the most essential features from a neural network", 
      "Reducing model complexity through automated pruning algorithms", 
      "Condensing multiple specialized models into one general-purpose model"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "Model distillation (or knowledge distillation) is a compression technique where a smaller model (student) is trained to mimic a larger pre-trained model (teacher), transferring knowledge while reducing computational requirements."
  },
  {
    id: "ai_hard_14",
    question: "What is a key difference between LSTM (Long Short-Term Memory) and Transformer architectures?",
    options: [
      "LSTMs process sequences sequentially while Transformers can process entire sequences in parallel", 
      "LSTMs use attention mechanisms while Transformers don't", 
      "LSTMs are designed for text data while Transformers work only with numerical data", 
      "LSTMs require less computational resources than Transformers"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "LSTMs process data sequentially (element by element), while Transformers can process entire sequences in parallel through self-attention mechanisms, allowing for more efficient computation and better handling of long-range dependencies."
  },
  {
    id: "ai_hard_15",
    question: "What is 'federated learning'?",
    options: [
      "A machine learning approach where models are trained across multiple devices while keeping the data local", 
      "A learning technique that combines multiple AI disciplines (vision, NLP, etc.)", 
      "The practice of sharing pre-trained models between organizations", 
      "Training models using data from different countries or federal agencies"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "Federated learning is an approach where models are trained across multiple decentralized devices holding local data samples, without exchanging the data itself, enhancing privacy while allowing model improvements from diverse data sources."
  }
]; 