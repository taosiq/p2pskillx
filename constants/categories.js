// Skill categories shared by Learn, Verify (skill quiz) and Teach (course creation).
// `gradient` gives each category its own colour identity in cards and chips.

export const CATEGORIES = [
  {
    id: '1',
    name: 'Information Technology & AI',
    icon: 'laptop',
    color: '#4F8EF7',
    description: 'Web development, data science, AI, software engineering, and more',
    skills: ['Web Development', 'Data Science', 'Machine Learning', 'Software Engineering', 'Cybersecurity']
  },
  {
    id: '2',
    name: 'Leadership & Management',
    icon: 'people',
    color: '#FF9500',
    description: 'Team leadership, project management, strategic planning, and more',
    skills: ['Team Leadership', 'Project Management', 'Strategic Planning', 'Business Development', 'Conflict Resolution']
  },
  {
    id: '3',
    name: 'Culinary Arts & Food Services',
    icon: 'restaurant',
    color: '#FF3B30',
    description: 'Cooking techniques, baking, food presentation, menu planning, and more',
    skills: ['Cooking Techniques', 'Baking', 'Food Presentation', 'Menu Planning', 'Food Safety']
  },
  {
    id: '4',
    name: 'Design & Creative Arts',
    icon: 'brush',
    color: '#5856D6',
    description: 'Graphic design, UI/UX, photography, animation, and more',
    skills: ['Graphic Design', 'UI/UX Design', 'Photography', 'Animation', 'Illustration']
  },
  {
    id: '5',
    name: 'Health & Fitness',
    icon: 'fitness',
    color: '#30D158',
    description: 'Nutrition, workout routines, personal training, yoga, and more',
    skills: ['Nutrition', 'Workout Planning', 'Yoga Instruction', 'Personal Training', 'Fitness Assessment']
  },
  {
    id: '6',
    name: 'Video Editing',
    icon: 'videocam',
    color: '#FF2D55',
    description: 'Video production, editing techniques, special effects, color grading, and more',
    skills: ['Adobe Premiere Pro', 'Final Cut Pro', 'Video Production', 'Motion Graphics', 'Color Grading']
  },
  {
    id: '7',
    name: 'Photo Editing',
    icon: 'image',
    color: '#AF52DE',
    description: 'Photo manipulation, retouching, color correction, composition, and more',
    skills: ['Adobe Photoshop', 'Lightroom', 'Portrait Retouching', 'Color Correction', 'Photo Composition']
  },
  {
    id: '8',
    name: 'Marketing',
    icon: 'megaphone',
    color: '#FF9F0A',
    description: 'Digital marketing, social media, SEO, content strategy, and more',
    skills: ['Social Media Marketing', 'SEO', 'Content Strategy', 'Email Marketing', 'Brand Development']
  },
];

const GRADIENTS = {
  '1': ['#12C2FF', '#2F6BFF'],
  '2': ['#FFB547', '#FF7A45'],
  '3': ['#FF7A45', '#FF4F6D'],
  '4': ['#8B6CFF', '#FF4FD8'],
  '5': ['#2EE59D', '#10B981'],
  '6': ['#FF4F9A', '#B04BFF'],
  '7': ['#C084FC', '#6366F1'],
  '8': ['#FFC83D', '#FF8A3D'],
};

CATEGORIES.forEach((c) => {
  c.gradient = GRADIENTS[c.id] || ['#12C2FF', '#2F6BFF'];
});

export const categoryByName = (name) => CATEGORIES.find((c) => c.name === name);
