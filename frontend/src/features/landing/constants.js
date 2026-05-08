export const features = [
    {
        title: 'Schema-driven builder',
        description: 'Define questions and sections once, then reuse structure across versions.',
        icon: 'Schema',
    },
    {
        title: 'Versioned publishing',
        description: 'Publish immutable snapshots so responses always match the exact form version.',
        icon: 'Version',
    },
    {
        title: 'Draft autosave',
        description: 'Authenticated responders can pause and resume without losing progress.',
        icon: 'Drafts',
    },
    {
        title: 'Multi-section flow',
        description: 'Guide respondents linearly through sections with clear progress.',
        icon: 'Flow',
    },
    {
        title: 'Role-based access',
        description: 'Owners, editors, and responders each get the right level of control.',
        icon: 'Roles',
    },
    {
        title: 'Session signals',
        description: 'Log tab switches and focus loss for lightweight review insights.',
        icon: 'Signals',
    },
];

export const steps = [
    {
        title: 'Create',
        description: 'Build multi-section forms with clear questions and required rules.',
    },
    {
        title: 'Publish',
        description: 'Lock a versioned snapshot and share the responder link.',
    },
    {
        title: 'Collect & review',
        description: 'Track drafts, submissions, and behavioral signals in one place.',
    },
];

export const testimonials = [
    {
        quote: 'Assessly keeps our quizzes consistent and cuts prep time every week.',
        name: 'Maya Patel',
        role: 'School Admin',
    },
    {
        quote: 'We finally have a form workflow that respects versioning and audit needs.',
        name: 'Jonas Wright',
        role: 'Training Lead',
    },
    {
        quote: 'The draft recovery flow has reduced incomplete submissions across cohorts.',
        name: 'Elena Ruiz',
        role: 'Program Coordinator',
    },
];

export const faqs = [
    {
        question: 'Can I edit a form after publishing?',
        answer: 'Publishing creates an immutable version. Edits generate a new version without affecting past responses.',
    },
    {
        question: 'Do responders need accounts?',
        answer: 'Accounts are required for cross-device drafts, but you can also share secure links for anonymous access.',
    },
    {
        question: 'How are anti-cheat signals handled?',
        answer: 'Tab switches and focus loss are logged per session and reviewed after submission.',
    },
    {
        question: 'Can I limit who edits a form?',
        answer: 'Yes. Owners can invite editors and responders with role-based access controls.',
    },
    {
        question: 'Is there real-time collaboration?',
        answer: 'Not in the MVP. Assessly focuses on a clean, structured single-editor workflow.',
    },
];
