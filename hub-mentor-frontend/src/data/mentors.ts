
export interface Mentor {
  id: string;
  name: string;
  title: string;
  subjects: string[];
  levels: string[];
  rating: number;
  hourlyRate: number;
  image: string;
  availability: string;
  bio: string;
  experience: string;
  education: string;
  reviews: Review[];
}

interface Review {
  id: string;
  user: string;
  rating: number;
  date: string;
  text: string;
}

export const mentors: Mentor[] = [
  {
    id: '1',
    name: 'Dr. Sarah Johnson',
    title: 'Mathematics Expert',
    subjects: ['Mathematics', 'Calculus', 'Algebra', 'Statistics'],
    levels: ['High School', 'College'],
    rating: 4.9,
    hourlyRate: 60,
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=688&q=80',
    availability: 'Weekdays & Weekends',
    bio: 'Mathematics professor with over 10 years of teaching experience. Specializing in calculus, algebra, and statistics for high school and college students.',
    experience: '10+ years teaching at university level. 5 years of private tutoring experience with 100+ students.',
    education: 'Ph.D. in Mathematics from MIT, M.S. in Applied Mathematics from Stanford University',
    reviews: [
      {
        id: 'r1',
        user: 'Michael T.',
        rating: 5,
        date: '2023-05-15',
        text: 'Dr. Johnson helped me ace my calculus final. She explains concepts so clearly and provides excellent practice problems.'
      },
      {
        id: 'r2',
        user: 'Emma L.',
        rating: 5,
        date: '2023-04-22',
        text: 'I struggled with math for years until I started working with Dr. Johnson. She makes everything seem so simple and builds your confidence gradually.'
      }
    ]
  },
  {
    id: '2',
    name: 'Prof. James Wilson',
    title: 'Physics & Engineering Mentor',
    subjects: ['Physics', 'Engineering', 'Mathematics'],
    levels: ['High School', 'College', 'Graduate School'],
    rating: 4.8,
    hourlyRate: 75,
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80',
    availability: 'Weekday Evenings',
    bio: 'Engineering professor and researcher with expertise in physics and applied mathematics. I love breaking down complex concepts into understandable pieces.',
    experience: '15 years teaching engineering at MIT. Published researcher with 30+ papers in top journals.',
    education: 'Ph.D. in Mechanical Engineering from Stanford, B.S. in Physics from CalTech',
    reviews: [
      {
        id: 'r3',
        user: 'David K.',
        rating: 5,
        date: '2023-06-01',
        text: 'Professor Wilson is incredibly knowledgeable and patient. He helped me through my entire engineering thesis project.'
      }
    ]
  },
  {
    id: '3',
    name: 'Maria Gonzalez',
    title: 'Spanish & Literature Teacher',
    subjects: ['Spanish', 'Literature', 'Writing', 'Language Arts'],
    levels: ['Elementary School', 'Middle School', 'High School', 'College'],
    rating: 5.0,
    hourlyRate: 45,
    image: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
    availability: 'Flexible Schedule',
    bio: 'Native Spanish speaker with a passion for literature and language teaching. I create customized lesson plans based on your interests and learning style.',
    experience: '8 years as a high school Spanish teacher. 5 years teaching online language courses.',
    education: 'M.A. in Spanish Literature from Columbia University, B.A. in Education from University of Barcelona',
    reviews: [
      {
        id: 'r4',
        user: 'Sophia R.',
        rating: 5,
        date: '2023-05-30',
        text: 'Maria is an amazing Spanish teacher! She makes learning fun and adapts to my pace perfectly.'
      },
      {
        id: 'r5',
        user: 'Alex T.',
        rating: 5,
        date: '2023-05-12',
        text: 'I needed to improve my Spanish for a job opportunity, and Maria helped me become conversational in just 3 months!'
      }
    ]
  },
  {
    id: '4',
    name: 'Dr. Robert Chen',
    title: 'Computer Science Specialist',
    subjects: ['Computer Science', 'Programming', 'Data Structures', 'Algorithms'],
    levels: ['High School', 'College', 'Graduate School'],
    rating: 4.7,
    hourlyRate: 80,
    image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=880&q=80',
    availability: 'Weekends Only',
    bio: 'Former Google engineer turned educator. I specialize in teaching programming fundamentals, data structures, and algorithms in a practical, project-based way.',
    experience: '12 years in software engineering at top tech companies. 6 years teaching CS courses and bootcamps.',
    education: 'Ph.D. in Computer Science from UC Berkeley, B.S. in Computer Engineering from Carnegie Mellon',
    reviews: [
      {
        id: 'r6',
        user: 'Jennifer W.',
        rating: 5,
        date: '2023-06-10',
        text: 'Dr. Chen is an exceptional teacher. His industry experience brings real-world context to academic concepts.'
      }
    ]
  },
  {
    id: '5',
    name: 'Emily Parker',
    title: 'Biology & Chemistry Expert',
    subjects: ['Biology', 'Chemistry', 'Science'],
    levels: ['Middle School', 'High School', 'College'],
    rating: 4.8,
    hourlyRate: 55,
    image: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80',
    availability: 'Weekday Afternoons',
    bio: 'Research scientist with a passion for teaching biology and chemistry. I focus on building strong foundations and critical thinking skills.',
    experience: '7 years teaching at high school and college levels. Research experience in molecular biology.',
    education: 'M.S. in Molecular Biology from Johns Hopkins, B.S. in Chemistry from UCLA',
    reviews: [
      {
        id: 'r7',
        user: 'Tyler M.',
        rating: 5,
        date: '2023-04-18',
        text: 'Emily helped me go from a C to an A in AP Chemistry. Her explanations make even the hardest concepts clear.'
      },
      {
        id: 'r8',
        user: 'Hannah J.',
        rating: 4,
        date: '2023-05-05',
        text: 'Great biology tutor who provides excellent study materials and practice tests.'
      }
    ]
  },
  {
    id: '6',
    name: 'Thomas Wright',
    title: 'History & Social Studies Teacher',
    subjects: ['History', 'Social Studies', 'Government', 'Politics'],
    levels: ['Middle School', 'High School', 'College'],
    rating: 4.9,
    hourlyRate: 50,
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
    availability: 'Mornings & Evenings',
    bio: 'History teacher who believes in making the past relevant and exciting. I connect historical events to current issues and focus on critical analysis.',
    experience: '15 years teaching history at high school level. Published author of historical articles and textbook contributor.',
    education: 'M.A. in History from Yale University, B.A. in Political Science from Georgetown',
    reviews: [
      {
        id: 'r9',
        user: 'Olivia P.',
        rating: 5,
        date: '2023-05-22',
        text: 'Thomas makes history come alive! His sessions are engaging and he asks thought-provoking questions.'
      }
    ]
  },
  {
    id: '7',
    name: 'Dr. Michelle Kim',
    title: 'Test Prep Specialist',
    subjects: ['Test Preparation', 'SAT', 'ACT', 'GRE'],
    levels: ['High School', 'College'],
    rating: 4.9,
    hourlyRate: 70,
    image: 'https://images.unsplash.com/photo-1619895862022-09114b41f16f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
    availability: 'After School & Weekends',
    bio: 'Specialized in standardized test preparation with proven methods to improve scores. I teach content knowledge, test-taking strategies, and stress management.',
    experience: '10 years as test prep specialist. Helped over 500 students improve their scores by an average of 20%.',
    education: 'Ph.D. in Educational Psychology from Columbia, B.A. in Mathematics from Princeton',
    reviews: [
      {
        id: 'r10',
        user: 'Jordan T.',
        rating: 5,
        date: '2023-06-05',
        text: 'Dr. Kim helped me raise my SAT score by 300 points! Her strategies were game-changers.'
      },
      {
        id: 'r11',
        user: 'Rebecca L.',
        rating: 5,
        date: '2023-05-19',
        text: 'The best test prep tutor out there. She identified my weak areas immediately and created a targeted plan.'
      }
    ]
  },
  {
    id: '8',
    name: 'Professor David Thompson',
    title: 'Economics & Finance Mentor',
    subjects: ['Economics', 'Finance', 'Business', 'Mathematics'],
    levels: ['High School', 'College', 'Graduate School'],
    rating: 4.8,
    hourlyRate: 85,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80',
    availability: 'Evenings Only',
    bio: 'Former investment banker with a PhD in Economics. I bridge academic theory with real-world applications in economics and finance.',
    experience: '8 years as economics professor. 12 years in investment banking and financial consulting.',
    education: 'Ph.D. in Economics from Harvard, MBA from Wharton, B.A. in Mathematics from Dartmouth',
    reviews: [
      {
        id: 'r12',
        user: 'Maya S.',
        rating: 5,
        date: '2023-05-08',
        text: "Professor Thompson's expertise in both academic theory and real-world finance is invaluable. He helped me understand complex economic models and their practical applications."
      }
    ]
  }
];
