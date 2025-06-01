export const cyberSecurityQuestions = [
  // Easy Questions
  {
    id: "cyber_easy_1",
    question: "What is phishing?",
    options: [
      "An attack that tricks users into revealing sensitive information", 
      "A technique to speed up network connections", 
      "A method for securing wireless networks", 
      "A type of hardware encryption"
    ],
    correctAnswer: 0,
    difficulty: "easy",
    explanation: "Phishing is a type of social engineering attack where attackers disguise themselves as trustworthy entities to trick users into revealing sensitive information like passwords or credit card numbers."
  },
  {
    id: "cyber_easy_2",
    question: "What does the acronym 'VPN' stand for?",
    options: [
      "Virtual Private Network", 
      "Very Powerful Node", 
      "Virtual Protocol Network", 
      "Verified Public Node"
    ],
    correctAnswer: 0,
    difficulty: "easy",
    explanation: "VPN stands for Virtual Private Network, which extends a private network across a public network, enabling users to send and receive data as if their devices were directly connected to the private network."
  },
  {
    id: "cyber_easy_3",
    question: "What is a firewall designed to do?",
    options: [
      "Monitor and control incoming and outgoing network traffic", 
      "Speed up internet connections", 
      "Encrypt all data on a hard drive", 
      "Physically protect servers from overheating"
    ],
    correctAnswer: 0,
    difficulty: "easy",
    explanation: "A firewall is a network security system that monitors and controls incoming and outgoing network traffic based on predetermined security rules, acting as a barrier between a trusted network and untrusted networks."
  },
  {
    id: "cyber_easy_4",
    question: "What is two-factor authentication (2FA)?",
    options: [
      "A security process requiring two different authentication factors to verify identity", 
      "Having two separate firewalls configured in series", 
      "Using two antivirus programs simultaneously", 
      "Encrypting data twice for additional security"
    ],
    correctAnswer: 0,
    difficulty: "easy",
    explanation: "Two-factor authentication is a security method that requires users to provide two different authentication factors to verify their identity, typically something they know (password) and something they have (like a phone)."
  },
  {
    id: "cyber_easy_5",
    question: "What is malware?",
    options: [
      "Software designed to damage or gain unauthorized access to computer systems", 
      "Software used to detect network vulnerabilities", 
      "Hardware components that monitor internet traffic", 
      "Legitimate software that has become outdated"
    ],
    correctAnswer: 0,
    difficulty: "easy",
    explanation: "Malware (malicious software) refers to any software intentionally designed to cause damage to a computer, server, client, or computer network, or to gain unauthorized access to information."
  },
  
  // Hard Questions
  {
    id: "cyber_hard_1",
    question: "What is a 'zero-day vulnerability'?",
    options: [
      "A software vulnerability unknown to those who should be interested in mitigating it", 
      "A vulnerability that exists for zero days before being patched", 
      "A type of malware that only activates at midnight (zero hour)", 
      "An attack that requires zero user interaction to execute"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "A zero-day vulnerability is a software security flaw that is unknown to the software vendor or to antivirus vendors, leaving it open for exploitation before a patch becomes available."
  },
  {
    id: "cyber_hard_2",
    question: "Which of the following best describes a CSRF (Cross-Site Request Forgery) attack?",
    options: [
      "Tricking users into executing unwanted actions on websites where they're authenticated", 
      "Injecting malicious code that executes when a user visits a website", 
      "Overloading a server with numerous requests to cause denial of service", 
      "Capturing authentication credentials as they're transmitted over a network"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "CSRF attacks trick authenticated users into executing unwanted actions on a web application by crafting malicious requests that leverage the user's active session and privileges."
  },
  {
    id: "cyber_hard_3",
    question: "What is a 'side-channel attack' in cryptography?",
    options: [
      "An attack based on information gained from the physical implementation of a system rather than weaknesses in the algorithm", 
      "An attack that targets alternative communication channels like SMS or email", 
      "An attack that bypasses the main firewall by targeting less-protected network segments", 
      "An attack that uses lateral movement within a network"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "Side-channel attacks extract information from physical implementations of crypto systems based on timing information, power consumption, electromagnetic leaks, or even sound, rather than finding weaknesses in the algorithms themselves."
  },
  {
    id: "cyber_hard_4",
    question: "What is the principle of 'least privilege' in information security?",
    options: [
      "Users should be given the minimum levels of access necessary to complete their job functions", 
      "The most junior employees should have the fewest system privileges", 
      "Only privileged users should have access to security settings", 
      "Security measures should be minimally invasive to user experience"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "The principle of least privilege states that users or systems should be given only the minimum access rights necessary to perform their required functions, reducing the attack surface and potential damage from compromised accounts."
  },
  {
    id: "cyber_hard_5",
    question: "What is 'DNS poisoning'?",
    options: [
      "Corrupting DNS server data to redirect traffic to malicious websites", 
      "Flooding DNS servers with too many requests to cause service disruption", 
      "Using DNS servers to distribute malware", 
      "Creating fake DNS entries on a local machine"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "DNS poisoning (or DNS cache poisoning) is an attack where falsified DNS information is introduced into a DNS resolver's cache, causing the resolution of domain names to return incorrect IP addresses, typically directing traffic to malicious sites."
  },
  {
    id: "cyber_hard_6",
    question: "Which of the following is a characteristic of polymorphic malware?",
    options: [
      "It changes its code to avoid detection while maintaining its functionality", 
      "It spreads across multiple systems simultaneously", 
      "It targets multiple operating systems with the same code base", 
      "It contains multiple different types of malware in one package"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "Polymorphic malware continuously changes its code (appearance) while keeping its core functionality intact, making it difficult for signature-based detection methods to identify it."
  },
  {
    id: "cyber_hard_7",
    question: "What is 'post-quantum cryptography'?",
    options: [
      "Cryptographic algorithms designed to be secure against quantum computer attacks", 
      "Encryption that requires quantum computers to implement", 
      "Cryptography implemented after quantum systems have been compromised", 
      "The study of cryptographic technologies after the development of quantum computing"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "Post-quantum cryptography refers to cryptographic algorithms believed to be secure against attacks from quantum computers, which could break many current cryptographic systems using Shor's algorithm."
  },
  {
    id: "cyber_hard_8",
    question: "What is a 'man-in-the-middle' attack?",
    options: [
      "An attack where the attacker secretly relays and possibly alters communication between two parties", 
      "An attack performed by an insider within the organization", 
      "An attack targeting middle management employees", 
      "An attack that occurs midway through a data transfer"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "In a man-in-the-middle attack, the attacker secretly intercepts and possibly alters communications between two parties who believe they are directly communicating with each other, often to steal credentials or sensitive information."
  },
  {
    id: "cyber_hard_9",
    question: "What is 'data exfiltration'?",
    options: [
      "The unauthorized transfer of data from a computer or server", 
      "The process of filtering sensitive data from public records", 
      "Removing unnecessary data to improve system performance", 
      "Converting data between different formats or structures"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "Data exfiltration refers to the unauthorized transfer of sensitive data from a computer or network, typically conducted by malicious actors after gaining access to a system through various attack vectors."
  },
  {
    id: "cyber_hard_10",
    question: "What is a 'supply chain attack' in cybersecurity?",
    options: [
      "An attack that targets less-secure elements in a supply chain to compromise the end target", 
      "Disrupting the physical delivery of computing hardware", 
      "Attacking logistics software to disrupt business operations", 
      "Using multiple attack vectors simultaneously against a target"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "A supply chain attack occurs when attackers compromise a supplier's infrastructure or software to gain access to their customers' systems, as seen in cases like SolarWinds where trusted updates were used to distribute malware."
  }
]; 