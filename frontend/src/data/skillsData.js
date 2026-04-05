// Centralized skill categories and skills data for the platform

export const CATEGORIES = [
  { value: 'Programming', icon: '💻', color: 'from-blue-50 to-indigo-50 text-blue-700 border-blue-200' },
  { value: 'Web Development', icon: '🌐', color: 'from-cyan-50 to-sky-50 text-cyan-700 border-cyan-200' },
  { value: 'Mobile Development', icon: '📱', color: 'from-violet-50 to-purple-50 text-violet-700 border-violet-200' },
  { value: 'Data Science', icon: '📊', color: 'from-emerald-50 to-teal-50 text-emerald-700 border-teal-200' },
  { value: 'Design', icon: '🎨', color: 'from-pink-50 to-rose-50 text-pink-700 border-pink-200' },
  { value: 'Music', icon: '🎵', color: 'from-amber-50 to-yellow-50 text-amber-700 border-amber-200' },
  { value: 'Languages', icon: '🗣️', color: 'from-green-50 to-lime-50 text-green-700 border-green-200' },
  { value: 'Fitness', icon: '🏋️', color: 'from-orange-50 to-red-50 text-orange-700 border-orange-200' },
  { value: 'Business', icon: '💼', color: 'from-slate-50 to-gray-50 text-slate-700 border-slate-200' },
  { value: 'Marketing', icon: '📈', color: 'from-fuchsia-50 to-pink-50 text-fuchsia-700 border-fuchsia-200' },
  { value: 'Art', icon: '🖌️', color: 'from-rose-50 to-red-50 text-rose-700 border-rose-200' },
  { value: 'Photography', icon: '📸', color: 'from-indigo-50 to-blue-50 text-indigo-700 border-indigo-200' },
  { value: 'Video & Film', icon: '🎬', color: 'from-red-50 to-orange-50 text-red-700 border-red-200' },
  { value: 'Writing', icon: '✍️', color: 'from-teal-50 to-green-50 text-teal-700 border-teal-200' },
  { value: 'Science', icon: '🔬', color: 'from-sky-50 to-cyan-50 text-sky-700 border-sky-200' },
  { value: 'Cooking', icon: '🍳', color: 'from-yellow-50 to-amber-50 text-yellow-700 border-yellow-200' },
  { value: 'Finance', icon: '💰', color: 'from-emerald-50 to-green-50 text-emerald-700 border-emerald-200' },
  { value: 'Personal Development', icon: '🧠', color: 'from-purple-50 to-violet-50 text-purple-700 border-purple-200' },
  { value: 'Other', icon: '📦', color: 'from-gray-50 to-slate-50 text-gray-700 border-gray-200' },
];

export const SKILLS_BY_CATEGORY = {
  'Programming': [
    'Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C#', 'Go', 'Rust',
    'Ruby', 'PHP', 'Swift', 'Kotlin', 'Scala', 'R', 'MATLAB', 'Dart',
    'SQL', 'Shell Scripting', 'Assembly', 'Lua',
  ],
  'Web Development': [
    'React', 'Angular', 'Vue.js', 'Next.js', 'Node.js', 'Express.js',
    'Django', 'Flask', 'Spring Boot', 'Ruby on Rails', 'Laravel',
    'HTML/CSS', 'Tailwind CSS', 'Bootstrap', 'SASS/SCSS',
    'WordPress', 'Shopify', 'GraphQL', 'REST APIs', 'WebSockets',
  ],
  'Mobile Development': [
    'React Native', 'Flutter', 'Swift (iOS)', 'Kotlin (Android)',
    'Ionic', 'Xamarin', 'SwiftUI', 'Jetpack Compose',
  ],
  'Data Science': [
    'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch',
    'Pandas', 'NumPy', 'Data Visualization', 'Tableau', 'Power BI',
    'NLP', 'Computer Vision', 'Statistics', 'Big Data', 'Apache Spark',
  ],
  'Design': [
    'UI/UX Design', 'Figma', 'Adobe XD', 'Sketch', 'Photoshop',
    'Illustrator', 'After Effects', 'Blender (3D)', 'Motion Graphics',
    'Logo Design', 'Brand Identity', 'Typography', 'Wireframing',
    'Design Systems', 'Prototyping',
  ],
  'Music': [
    'Guitar', 'Piano', 'Drums', 'Violin', 'Bass Guitar', 'Ukulele',
    'Singing', 'Music Theory', 'Music Production', 'Ableton Live',
    'FL Studio', 'Logic Pro', 'DJ/Mixing', 'Songwriting',
    'Sound Design', 'Audio Engineering',
  ],
  'Languages': [
    'English', 'Spanish', 'French', 'German', 'Mandarin Chinese',
    'Japanese', 'Korean', 'Hindi', 'Arabic', 'Portuguese',
    'Italian', 'Russian', 'Dutch', 'Turkish', 'Sign Language',
  ],
  'Fitness': [
    'Weight Training', 'Yoga', 'HIIT', 'CrossFit', 'Calisthenics',
    'Running', 'Swimming', 'Martial Arts', 'Boxing', 'Basketball',
    'Soccer', 'Dance', 'Pilates', 'Nutrition Planning',
    'Personal Training', 'Meditation',
  ],
  'Business': [
    'Entrepreneurship', 'Startup Strategy', 'Product Management',
    'Project Management', 'Agile/Scrum', 'Business Analytics',
    'Consulting', 'Leadership', 'Negotiation', 'Public Speaking',
    'Sales', 'Customer Success', 'Operations Management',
  ],
  'Marketing': [
    'Digital Marketing', 'SEO', 'SEM/PPC', 'Social Media Marketing',
    'Content Marketing', 'Email Marketing', 'Copywriting',
    'Growth Hacking', 'Google Analytics', 'Facebook Ads',
    'Influencer Marketing', 'Brand Strategy', 'Market Research',
  ],
  'Art': [
    'Drawing', 'Painting', 'Watercolor', 'Sketching', 'Digital Art',
    'Calligraphy', 'Sculpture', 'Ceramics', 'Printmaking',
    'Comic/Manga Art', 'Character Design', 'Pixel Art',
  ],
  'Photography': [
    'Portrait Photography', 'Landscape Photography', 'Street Photography',
    'Product Photography', 'Photo Editing', 'Lightroom', 'Drone Photography',
    'Astrophotography', 'Wedding Photography', 'Studio Lighting',
  ],
  'Video & Film': [
    'Video Editing', 'Premiere Pro', 'Final Cut Pro', 'DaVinci Resolve',
    'Cinematography', 'Screenwriting', 'Animation', 'VFX',
    'YouTube Content', 'Vlogging', 'Storyboarding',
  ],
  'Writing': [
    'Creative Writing', 'Technical Writing', 'Blog Writing',
    'Academic Writing', 'Journalism', 'Poetry', 'Screenwriting',
    'Content Strategy', 'Editing/Proofreading', 'Grant Writing',
  ],
  'Science': [
    'Physics', 'Chemistry', 'Biology', 'Mathematics', 'Astronomy',
    'Environmental Science', 'Robotics', 'Electronics', 'Arduino',
    'Raspberry Pi', '3D Printing', 'Lab Techniques',
  ],
  'Cooking': [
    'Baking', 'Italian Cuisine', 'Asian Cuisine', 'French Cooking',
    'Vegan/Vegetarian', 'Meal Prep', 'Sushi Making', 'BBQ/Grilling',
    'Pastry', 'Cocktail Making', 'Food Plating', 'Fermentation',
  ],
  'Finance': [
    'Investing', 'Stock Trading', 'Cryptocurrency', 'Financial Planning',
    'Accounting', 'Excel for Finance', 'Tax Planning', 'Real Estate',
    'Budgeting', 'Options Trading',
  ],
  'Personal Development': [
    'Time Management', 'Productivity', 'Mindfulness', 'Habit Building',
    'Communication Skills', 'Critical Thinking', 'Memory Techniques',
    'Speed Reading', 'Goal Setting', 'Stress Management',
  ],
  'Other': [],
};

// Get all skills as a flat list
export const ALL_SKILLS = Object.values(SKILLS_BY_CATEGORY).flat();

// Get category by value
export const getCategoryMeta = (value) => {
  return CATEGORIES.find((c) => c.value === value) || CATEGORIES[CATEGORIES.length - 1];
};
