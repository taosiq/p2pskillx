export const webDevelopmentQuestions = [
  // Easy Questions
  {
    id: "web_easy_1",
    question: "What does HTML stand for?",
    options: ["Hyper Text Markup Language", "High Tech Modern Language", "Hyper Technical Meta Language", "Hyperlink Text Management Language"],
    correctAnswer: 0,
    difficulty: "easy",
    explanation: "HTML stands for Hyper Text Markup Language, which is the standard markup language for documents designed to be displayed in a web browser."
  },
  {
    id: "web_easy_2",
    question: "Which CSS property is used to change the text color of an element?",
    options: ["color", "text-color", "font-color", "text-style"],
    correctAnswer: 0,
    difficulty: "easy",
    explanation: "The 'color' property is used to set the color of text in CSS."
  },
  {
    id: "web_easy_3",
    question: "What is the correct HTML element for inserting a line break?",
    options: ["<br>", "<break>", "<lb>", "<newline>"],
    correctAnswer: 0,
    difficulty: "easy",
    explanation: "The <br> tag inserts a single line break in HTML."
  },
  {
    id: "web_easy_4",
    question: "Which of the following is used to add JavaScript to an HTML page?",
    options: ["<script>", "<javascript>", "<js>", "<scripting>"],
    correctAnswer: 0,
    difficulty: "easy",
    explanation: "The <script> tag is used to embed or reference JavaScript code in an HTML document."
  },
  {
    id: "web_easy_5",
    question: "Which HTML tag is used to define an unordered list?",
    options: ["<ul>", "<ol>", "<list>", "<unlist>"],
    correctAnswer: 0,
    difficulty: "easy",
    explanation: "The <ul> tag defines an unordered (bulleted) list in HTML."
  },
  
  // Hard Questions
  {
    id: "web_hard_1",
    question: "What is the purpose of the 'Content-Security-Policy' HTTP header?",
    options: [
      "To prevent Cross-Site Scripting (XSS) attacks by specifying valid content sources", 
      "To encrypt data transmitted between client and server", 
      "To compress HTTP responses for faster transmission", 
      "To authenticate users accessing protected resources"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "Content-Security-Policy (CSP) is an HTTP header that helps prevent XSS attacks by specifying which dynamic resources are allowed to load based on source domain."
  },
  {
    id: "web_hard_2",
    question: "Which of the following is TRUE about React Server Components?",
    options: [
      "They allow rendering components on the server with zero JavaScript sent to the client", 
      "They require WebSockets for client-server communication", 
      "They can only be used with Redux for state management", 
      "They render slower than client components but use less memory"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "React Server Components can render on the server without sending JavaScript to the client, reducing bundle size and enabling direct access to server-only resources."
  },
  {
    id: "web_hard_3",
    question: "What is HSTS (HTTP Strict Transport Security)?",
    options: [
      "A security policy that forces browsers to use HTTPS instead of HTTP for a domain", 
      "A protocol that replaces HTTP/2 for faster web communication", 
      "A server technology that automatically compresses HTTP responses", 
      "A web standard that enables offline web application functionality"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "HSTS is a web security policy mechanism that helps protect websites against protocol downgrade attacks and cookie hijacking by enforcing secure connections."
  },
  {
    id: "web_hard_4",
    question: "In modern CSS architecture, what is the purpose of the 'container queries' feature?",
    options: [
      "To apply styles based on the size of a parent container rather than the viewport", 
      "To query backend containers for dynamic styling data", 
      "To optimize CSS loading for containerized applications", 
      "To apply styles based on device container preferences"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "Container queries allow developers to apply styles based on the size of a parent container rather than the viewport, enabling more modular and reusable component styling."
  },
  {
    id: "web_hard_5",
    question: "What is the significance of the 'SameSite' attribute in cookies?",
    options: [
      "It restricts how cookies are sent with cross-site requests to prevent CSRF attacks", 
      "It ensures cookies have the same value across different websites", 
      "It validates that cookies originated from the same IP address", 
      "It synchronizes cookies between different browser sessions"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "The SameSite attribute restricts when cookies are sent with cross-site requests, helping prevent cross-site request forgery (CSRF) attacks."
  },
  {
    id: "web_hard_6",
    question: "Which statement is TRUE about WebAssembly (WASM)?",
    options: [
      "It allows running high-performance binary code in web browsers", 
      "It is a JavaScript library for accelerated DOM manipulation", 
      "It replaces HTML as the primary markup language for modern browsers", 
      "It is a server-side technology for processing web requests"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "WebAssembly is a binary instruction format that provides a way to run code written in languages like C, C++, and Rust at near-native speed in web browsers."
  },
  {
    id: "web_hard_7",
    question: "What is the significance of the 'prefers-reduced-motion' media query in CSS?",
    options: [
      "It detects when users have requested minimized animations for accessibility",

      "It optimizes animation performance on low-end devices", 
      "It reduces motion blur in CSS transitions", 
      "It slows down animations for better visual perception"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "The 'prefers-reduced-motion' media query detects if the user has requested the system minimize non-essential motion, helping developers build more accessible websites for users with vestibular disorders."
  },
  {
    id: "web_hard_8",
    question: "Which JavaScript API enables real-time, bidirectional communication between web clients and servers?",
    options: [
      "WebSockets API", 
      "XMLHttpRequest", 
      "Fetch API", 
      "Server-Sent Events"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "WebSockets provide a persistent connection between client and server for real-time, bidirectional communication, unlike HTTP which is stateless and primarily client-initiated."
  },
  {
    id: "web_hard_9",
    question: "What is the purpose of the 'shadow DOM' in web components?",
    options: [
      "To encapsulate DOM and CSS to prevent style and structure leaking", 
      "To create lightweight virtual DOM copies for performance optimization", 
      "To render DOM elements only visible in dark mode interfaces", 
      "To pre-render components for search engine optimization"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "Shadow DOM allows hidden DOM trees to be attached to elements in the regular DOM tree, keeping element features private and preventing style/structure conflicts."
  },
  {
    id: "web_hard_10",
    question: "Which HTTP status code indicates that the server is refusing to process a request because entity is too large?",
    options: [
      "413 Payload Too Large", 
      "431 Request Header Fields Too Large", 
      "507 Insufficient Storage", 
      "503 Service Unavailable"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "HTTP 413 (Payload Too Large) is returned when the request entity is larger than limits defined by the server, such as when uploading a file that exceeds maximum size limits."
  },
  {
    id: "web_hard_11",
    question: "What is the purpose of the HTTP/2 PUSH feature?",
    options: [
      "To allow servers to send resources to clients before they are explicitly requested", 
      "To enable clients to push data directly to other clients", 
      "To force clients to refresh their cached content", 
      "To prioritize certain HTTP requests over others"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "HTTP/2 PUSH allows servers to proactively send resources to the client's cache before they're explicitly requested, reducing latency by eliminating additional round-trips."
  },
  {
    id: "web_hard_12",
    question: "What is the correct implementation of a CSS Grid container that creates 3 equal columns with a 1rem gap?",
    options: [
      "display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;", 
      "display: grid; grid-columns: 3; column-gap: 1rem;", 
      "display: grid; grid-template: repeat(3, 1fr); gap: 1rem;", 
      "display: flex; grid-columns: repeat(3, 1fr); column-gap: 1rem;"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "The correct CSS Grid syntax uses 'grid-template-columns' with the 'repeat()' function and '1fr' unit to create equal flexible columns, with the 'gap' property for spacing."
  },
  {
    id: "web_hard_13",
    question: "Which statement about the 'Intersection Observer API' is correct?",
    options: [
      "It asynchronously observes changes in the intersection of elements with the viewport", 
      "It detects when DOM elements are modified by JavaScript", 
      "It monitors network interactions between the browser and server", 
      "It observes intersections between multiple pointer devices"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "The Intersection Observer API provides a way to asynchronously observe changes in the intersection of a target element with an ancestor element or the viewport."
  },
  {
    id: "web_hard_14",
    question: "In the context of web performance, what is 'Tree Shaking'?",
    options: [
      "A technique to eliminate unused code from JavaScript bundles", 
      "A DOM manipulation strategy to reduce render tree complexity", 
      "A CSS optimization that removes unused selectors", 
      "A method to reorganize the DOM tree for faster painting"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "Tree shaking is a dead code elimination technique used by modern JavaScript bundlers to remove unused code from the final bundle, reducing file size."
  },
  {
    id: "web_hard_15",
    question: "What is the purpose of the 'srcset' attribute in the HTML <img> element?",
    options: [
      "To specify multiple image sources for different screen resolutions and sizes", 
      "To provide fallback sources if the primary image fails to load", 
      "To set multiple source filters for image processing", 
      "To synchronize image loading with other page resources"
    ],
    correctAnswer: 0,
    difficulty: "hard",
    explanation: "The 'srcset' attribute allows developers to specify multiple image sources with different resolutions or sizes, enabling browsers to choose the most appropriate version for the user's device."
  }
]; 