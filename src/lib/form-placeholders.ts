// Dynamic form placeholder generation based on job context
export interface JobContext {
  title?: string;
  company?: string;
  industry?: string;
  level?: 'entry' | 'mid' | 'senior' | 'executive';
}

export const generatePlaceholders = (context: JobContext = {}) => {
  const { title = '', company = '', industry = '', level = 'mid' } = context;
  
  // Determine job category from title
  const jobCategory = determineJobCategory(title);
  
  return {
    achievements: generateAchievements(jobCategory, level),
    responsibilities: generateResponsibilities(jobCategory, level),
    keywords: generateKeywords(jobCategory, industry),
    description: generateDescription(jobCategory, level),
    skills: generateSkills(jobCategory, level)
  };
};

const determineJobCategory = (title: string): string => {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('engineer') || lowerTitle.includes('developer') || lowerTitle.includes('programmer')) {
    return 'engineering';
  }
  if (lowerTitle.includes('manager') || lowerTitle.includes('director') || lowerTitle.includes('lead')) {
    return 'management';
  }
  if (lowerTitle.includes('designer') || lowerTitle.includes('ux') || lowerTitle.includes('ui')) {
    return 'design';
  }
  if (lowerTitle.includes('sales') || lowerTitle.includes('account')) {
    return 'sales';
  }
  if (lowerTitle.includes('marketing') || lowerTitle.includes('brand')) {
    return 'marketing';
  }
  if (lowerTitle.includes('analyst') || lowerTitle.includes('data')) {
    return 'analytics';
  }
  if (lowerTitle.includes('product')) {
    return 'product';
  }
  
  return 'general';
};

const generateAchievements = (category: string, level: string): string => {
  const achievements = {
    engineering: {
      entry: [
        'Reduced bug count by 30% through comprehensive testing',
        'Implemented new features used by 1000+ daily users',
        'Decreased page load time by 25% through optimization'
      ],
      mid: [
        'Led migration project serving 50K+ users with zero downtime',
        'Reduced system response time by 40% through architecture improvements',
        'Mentored 3 junior developers, improving team productivity by 25%'
      ],
      senior: [
        'Architected scalable system handling 1M+ daily transactions',
        'Led team of 8 engineers to deliver $2M revenue-generating platform',
        'Reduced infrastructure costs by 35% while improving performance'
      ]
    },
    management: {
      entry: [
        'Managed team of 5 members to exceed quarterly goals by 15%',
        'Implemented new process reducing project delivery time by 20%',
        'Coordinated cross-functional initiatives with 3 departments'
      ],
      mid: [
        'Led 15-person team to deliver $5M project 2 months early',
        'Increased team productivity by 40% through process optimization',
        'Managed budget of $2M while reducing costs by 18%'
      ],
      senior: [
        'Scaled organization from 20 to 80 employees over 2 years',
        'Delivered $20M revenue growth through strategic initiatives',
        'Built and managed 5 cross-functional teams across 3 regions'
      ]
    },
    design: {
      entry: [
        'Redesigned user interface increasing engagement by 35%',
        'Created design system used across 10+ product features',
        'Improved user satisfaction score from 3.2 to 4.6 stars'
      ],
      mid: [
        'Led design for product used by 100K+ monthly active users',
        'Increased conversion rate by 45% through UX improvements',
        'Established design guidelines adopted by 3 product teams'
      ],
      senior: [
        'Directed design strategy for $10M product portfolio',
        'Built design team of 12 designers across multiple products',
        'Led rebrand initiative increasing brand recognition by 60%'
      ]
    },
    general: {
      entry: [
        'Exceeded performance targets by 20% in first year',
        'Implemented process improvement saving 10 hours per week',
        'Collaborated with 5 departments to launch new initiative'
      ],
      mid: [
        'Increased operational efficiency by 30% through optimization',
        'Led project resulting in $500K annual cost savings',
        'Managed stakeholder relationships across 8 business units'
      ],
      senior: [
        'Drove strategic initiative generating $2M annual revenue',
        'Built and scaled operations supporting 200% growth',
        'Led organizational transformation affecting 100+ employees'
      ]
    }
  };
  
  const categoryAchievements = achievements[category as keyof typeof achievements] || achievements.general;
  return categoryAchievements[level as keyof typeof categoryAchievements].join('\n');
};

const generateResponsibilities = (category: string, level: string): string => {
  const responsibilities = {
    engineering: {
      entry: [
        'Develop and maintain web applications using modern frameworks',
        'Write clean, testable code following best practices',
        'Participate in code reviews and technical discussions'
      ],
      mid: [
        'Design and implement scalable software solutions',
        'Lead technical architecture decisions for project features',
        'Mentor junior developers and conduct code reviews'
      ],
      senior: [
        'Define technical strategy and architecture for product platform',
        'Lead cross-functional engineering teams and initiatives',
        'Drive technical excellence and engineering best practices'
      ]
    },
    management: {
      entry: [
        'Coordinate project timelines and resource allocation',
        'Facilitate team meetings and stakeholder communications',
        'Monitor project progress and identify potential risks'
      ],
      mid: [
        'Lead strategic planning and execution for multiple projects',
        'Manage team performance and professional development',
        'Drive process improvements and operational efficiency'
      ],
      senior: [
        'Set organizational vision and long-term strategic direction',
        'Build and scale high-performing teams and culture',
        'Drive business growth through strategic initiatives'
      ]
    },
    design: {
      entry: [
        'Create wireframes, mockups, and interactive prototypes',
        'Conduct user research and usability testing sessions',
        'Collaborate with developers to implement design solutions'
      ],
      mid: [
        'Lead end-to-end design process for complex product features',
        'Establish and maintain design systems and guidelines',
        'Drive user-centered design methodology across teams'
      ],
      senior: [
        'Define design vision and strategy for product portfolio',
        'Lead design team and establish creative direction',
        'Drive design thinking methodology across organization'
      ]
    },
    general: {
      entry: [
        'Execute daily operational tasks and project deliverables',
        'Collaborate with team members and cross-functional partners',
        'Support process improvement and efficiency initiatives'
      ],
      mid: [
        'Lead project planning and execution across multiple workstreams',
        'Drive strategic initiatives and process optimization',
        'Manage stakeholder relationships and communication'
      ],
      senior: [
        'Define strategic direction and organizational priorities',
        'Lead transformation initiatives and change management',
        'Build partnerships and drive business development'
      ]
    }
  };
  
  const categoryResponsibilities = responsibilities[category as keyof typeof responsibilities] || responsibilities.general;
  return categoryResponsibilities[level as keyof typeof categoryResponsibilities].join('\n');
};

const generateKeywords = (category: string, industry: string): string => {
  const baseKeywords = {
    engineering: ['JavaScript', 'Python', 'React', 'Node.js', 'AWS', 'Docker', 'Git', 'Agile', 'REST APIs', 'SQL'],
    management: ['Leadership', 'Strategic Planning', 'Team Management', 'Project Management', 'Agile', 'Scrum', 'Budget Management', 'Stakeholder Management'],
    design: ['UI/UX Design', 'Figma', 'Adobe Creative Suite', 'Prototyping', 'User Research', 'Design Systems', 'Wireframing', 'Visual Design'],
    sales: ['CRM', 'Lead Generation', 'Account Management', 'Sales Strategy', 'Negotiation', 'Client Relations', 'Revenue Growth', 'Pipeline Management'],
    marketing: ['Digital Marketing', 'Content Strategy', 'SEO', 'Social Media', 'Analytics', 'Brand Management', 'Campaign Management', 'Marketing Automation'],
    analytics: ['Data Analysis', 'SQL', 'Python', 'Tableau', 'Excel', 'Statistical Analysis', 'Data Visualization', 'Business Intelligence'],
    product: ['Product Strategy', 'Roadmap Planning', 'User Research', 'A/B Testing', 'Agile', 'Stakeholder Management', 'Market Research', 'Feature Development'],
    general: ['Communication', 'Leadership', 'Problem Solving', 'Project Management', 'Team Collaboration', 'Strategic Thinking', 'Process Improvement']
  };
  
  const industryKeywords = {
    technology: ['SaaS', 'Cloud Computing', 'API Development', 'DevOps', 'Machine Learning', 'Cybersecurity'],
    finance: ['Financial Analysis', 'Risk Management', 'Compliance', 'Investment Strategy', 'Financial Modeling'],
    healthcare: ['HIPAA Compliance', 'Healthcare Analytics', 'Patient Care', 'Medical Technology', 'Clinical Research'],
    retail: ['E-commerce', 'Inventory Management', 'Customer Experience', 'Supply Chain', 'Point of Sale'],
    education: ['Curriculum Development', 'Educational Technology', 'Student Engagement', 'Learning Analytics'],
    manufacturing: ['Lean Manufacturing', 'Quality Control', 'Supply Chain', 'Process Optimization', 'Safety Protocols']
  };
  
  const categoryWords = baseKeywords[category as keyof typeof baseKeywords] || baseKeywords.general;
  const industryWords = industryKeywords[industry.toLowerCase() as keyof typeof industryKeywords] || [];
  
  return [...categoryWords.slice(0, 6), ...industryWords.slice(0, 4)].join(', ');
};

const generateDescription = (category: string, level: string): string => {
  const descriptions = {
    engineering: {
      entry: 'Software developer with experience in modern web technologies and agile development practices',
      mid: 'Experienced software engineer with expertise in full-stack development and team collaboration',
      senior: 'Senior engineering leader with proven track record of building scalable systems and leading technical teams'
    },
    management: {
      entry: 'Project coordinator with strong organizational skills and experience in team collaboration',
      mid: 'Experienced manager with proven ability to lead teams and deliver complex projects',
      senior: 'Executive leader with extensive experience in strategic planning and organizational development'
    },
    design: {
      entry: 'Creative designer with experience in user interface design and design thinking methodology',
      mid: 'Experienced UX/UI designer with expertise in user-centered design and product development',
      senior: 'Design leader with proven track record of building design teams and driving product strategy'
    },
    general: {
      entry: 'Motivated professional with strong analytical skills and collaborative work style',
      mid: 'Experienced professional with proven track record of delivering results and leading initiatives',
      senior: 'Strategic leader with extensive experience in driving organizational growth and transformation'
    }
  };
  
  const categoryDescriptions = descriptions[category as keyof typeof descriptions] || descriptions.general;
  return categoryDescriptions[level as keyof typeof categoryDescriptions];
};

const generateSkills = (category: string, level: string): string[] => {
  const skills = {
    engineering: {
      technical: ['JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'Git', 'AWS', 'Docker'],
      soft: ['Problem Solving', 'Team Collaboration', 'Technical Communication', 'Code Review']
    },
    management: {
      technical: ['Project Management', 'Budget Planning', 'Strategic Planning', 'Process Optimization'],
      soft: ['Leadership', 'Communication', 'Conflict Resolution', 'Team Building', 'Decision Making']
    },
    design: {
      technical: ['Figma', 'Adobe Creative Suite', 'Prototyping', 'User Research', 'Design Systems'],
      soft: ['Creative Thinking', 'Empathy', 'Visual Communication', 'Attention to Detail']
    },
    general: {
      technical: ['Microsoft Office', 'Project Management', 'Data Analysis', 'Process Improvement'],
      soft: ['Communication', 'Leadership', 'Problem Solving', 'Team Collaboration', 'Adaptability']
    }
  };
  
  const categorySkills = skills[category as keyof typeof skills] || skills.general;
  
  return level === 'entry' 
    ? [...categorySkills.technical.slice(0, 4), ...categorySkills.soft.slice(0, 3)]
    : [...categorySkills.technical.slice(0, 6), ...categorySkills.soft];
};