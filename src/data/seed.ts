import type {Challenge, Meetup, Member, Project, Submission} from './types';

export interface SeedData {
  members: Member[];
  challenges: Challenge[];
  submissions: Submission[];
  projects: Project[];
  meetups: Meetup[];
}

const DAY = 86_400_000;

/** Seed dates are relative to `now`, so "next meetup" and "open challenges" are always meaningful. */
export function createSeed(now: Date = new Date()): SeedData {
  const base = new Date(now);
  base.setHours(18, 0, 0, 0);
  const at = (days: number) => new Date(base.getTime() + days * DAY).toISOString();

  const members: Member[] = [
    {id: 'mem-1', name: 'Ada Okafor', skillLevel: 'advanced', languages: ['TypeScript', 'Rust'], joinedAt: at(-420), attendanceStreak: 9},
    {id: 'mem-2', name: 'Ben Carter', skillLevel: 'intermediate', languages: ['Python', 'JavaScript'], joinedAt: at(-300), attendanceStreak: 4, mentorId: 'mem-1'},
    {id: 'mem-3', name: 'Chloe Nguyen', skillLevel: 'beginner', languages: ['Python'], joinedAt: at(-90), attendanceStreak: 3, mentorId: 'mem-2'},
    {id: 'mem-4', name: 'Dev Patel', skillLevel: 'advanced', languages: ['Go', 'Python', 'SQL'], joinedAt: at(-380), attendanceStreak: 7},
    {id: 'mem-5', name: 'Elena Rossi', skillLevel: 'intermediate', languages: ['JavaScript', 'TypeScript'], joinedAt: at(-200), attendanceStreak: 5, mentorId: 'mem-1'},
    {id: 'mem-6', name: 'Farid Haddad', skillLevel: 'beginner', languages: ['JavaScript'], joinedAt: at(-60), attendanceStreak: 2, mentorId: 'mem-5'},
    {id: 'mem-7', name: 'Grace Kim', skillLevel: 'intermediate', languages: ['Java', 'Kotlin'], joinedAt: at(-250), attendanceStreak: 0},
    {id: 'mem-8', name: 'Hiro Tanaka', skillLevel: 'advanced', languages: ['C++', 'Rust', 'Python'], joinedAt: at(-500), attendanceStreak: 11},
    {id: 'mem-9', name: 'Isla Murphy', skillLevel: 'beginner', languages: ['Scratch', 'Python'], joinedAt: at(-30), attendanceStreak: 1, mentorId: 'mem-4'},
    {id: 'mem-10', name: 'Jamal Brooks', skillLevel: 'intermediate', languages: ['C#', 'JavaScript'], joinedAt: at(-150), attendanceStreak: 0},
    {id: 'mem-11', name: 'Keiko Sato', skillLevel: 'beginner', languages: ['HTML/CSS', 'JavaScript'], joinedAt: at(-45), attendanceStreak: 2, mentorId: 'mem-5'},
    {id: 'mem-12', name: 'Liam Walsh', skillLevel: 'intermediate', languages: ['Ruby', 'Python'], joinedAt: at(-180), attendanceStreak: 3, mentorId: 'mem-4'},
  ];

  const challenges: Challenge[] = [
    {id: 'chal-1', title: 'FizzBuzz Reloaded', difficulty: 'easy', dueDate: at(-20),
      prompt: 'Write FizzBuzz for 1..100, then make the words and divisors configurable without changing the core loop.',
      hints: ['Start with the plain version first.', 'Pass the rules in as data, e.g. [[3, "Fizz"], [5, "Buzz"]].', 'Concatenate matches instead of nesting if-statements.']},
    {id: 'chal-2', title: 'Palindrome Checker', difficulty: 'easy', dueDate: at(-6),
      prompt: 'Decide whether a phrase is a palindrome, ignoring case, spaces and punctuation.',
      hints: ['Normalise the string before comparing.', 'A regular expression can strip non-alphanumerics.']},
    {id: 'chal-3', title: 'Word Frequency Counter', difficulty: 'medium', dueDate: at(5),
      prompt: 'Read a text file and print the ten most common words with their counts.',
      hints: ['A map or dictionary keyed by lowercase word works well.', 'Decide how to treat punctuation up front.', 'Sort by count, then alphabetically to break ties.']},
    {id: 'chal-4', title: 'Tic-Tac-Toe AI', difficulty: 'medium', dueDate: at(12),
      prompt: 'Build a command-line Tic-Tac-Toe where the computer never loses.',
      hints: ['Model the board as a 9-item array.', 'Try minimax; the game tree is small.']},
    {id: 'chal-5', title: 'Rate Limiter', difficulty: 'hard', dueDate: at(19),
      prompt: 'Implement a token-bucket rate limiter that is safe to call from multiple threads or async tasks.',
      hints: ['Refill lazily from timestamps rather than with a timer.', 'Think about what must be atomic.', 'Inject the clock so you can test it.']},
    {id: 'chal-6', title: 'Mini Regex Engine', difficulty: 'hard', dueDate: at(33),
      prompt: 'Support literals, `.`, `*` and `^`/`$` anchors in a regex matcher written from scratch.',
      hints: ['Recursion makes `*` surprisingly small to write.', 'Match at every starting position unless anchored.']},
  ];

  const sub = (n: number, challengeId: string, memberId: string, daysAgo: number): Submission => ({
    id: `sub-${n}`, challengeId, memberId,
    repoUrl: `https://github.com/code-club/${challengeId}-${memberId}`,
    submittedAt: at(-daysAgo),
  });
  const submissions: Submission[] = [
    sub(1, 'chal-1', 'mem-1', 28), sub(2, 'chal-1', 'mem-2', 27), sub(3, 'chal-1', 'mem-3', 25),
    sub(4, 'chal-1', 'mem-5', 26), sub(5, 'chal-1', 'mem-6', 22), sub(6, 'chal-1', 'mem-9', 21),
    sub(7, 'chal-2', 'mem-1', 12), sub(8, 'chal-2', 'mem-2', 10), sub(9, 'chal-2', 'mem-4', 11),
    sub(10, 'chal-2', 'mem-5', 9), sub(11, 'chal-2', 'mem-7', 8), sub(12, 'chal-2', 'mem-11', 7),
    sub(13, 'chal-3', 'mem-4', 3), sub(14, 'chal-3', 'mem-8', 2), sub(15, 'chal-3', 'mem-12', 2),
    sub(16, 'chal-3', 'mem-5', 1), sub(17, 'chal-4', 'mem-8', 1), sub(18, 'chal-4', 'mem-1', 1),
    sub(19, 'chal-5', 'mem-8', 0), sub(20, 'chal-3', 'mem-10', 0),
  ];

  const gh = (slug: string) => `https://github.com/code-club/${slug}`;
  const projects: Project[] = [
    {id: 'proj-1', memberId: 'mem-1', title: 'Astral Notes', status: 'shipped', techStack: ['TypeScript', 'React', 'SQLite'],
      description: 'A local-first markdown notes app with fast full-text search.', repoUrl: gh('astral-notes'), demoUrl: 'https://astral-notes.example.com'},
    {id: 'proj-2', memberId: 'mem-2', title: 'Budget Buddy', status: 'building', techStack: ['Python', 'Flask'],
      description: 'Tracks club expenses and splits costs for trips.', repoUrl: gh('budget-buddy')},
    {id: 'proj-3', memberId: 'mem-3', title: 'Plant Pal', status: 'idea', techStack: ['Python'],
      description: 'A reminder bot that tells you when to water each plant.', repoUrl: gh('plant-pal')},
    {id: 'proj-4', memberId: 'mem-4', title: 'GoStatus', status: 'shipped', techStack: ['Go', 'PostgreSQL'],
      description: 'Lightweight uptime monitor with a public status page.', repoUrl: gh('gostatus'), demoUrl: 'https://gostatus.example.com'},
    {id: 'proj-5', memberId: 'mem-5', title: 'Recipe Remix', status: 'building', techStack: ['TypeScript', 'Next.js'],
      description: 'Swap ingredients and see how a recipe changes.', repoUrl: gh('recipe-remix')},
    {id: 'proj-6', memberId: 'mem-8', title: 'RayTracer RS', status: 'shipped', techStack: ['Rust'],
      description: 'A path tracer that renders scenes to PNG.', repoUrl: gh('raytracer-rs'), demoUrl: 'https://raytracer.example.com'},
    {id: 'proj-7', memberId: 'mem-9', title: 'Pixel Pets', status: 'idea', techStack: ['Scratch', 'Python'],
      description: 'A tiny virtual pet game with pixel art.', repoUrl: gh('pixel-pets')},
    {id: 'proj-8', memberId: 'mem-12', title: 'Gem Quiz', status: 'building', techStack: ['Ruby', 'Sinatra'],
      description: 'Multiplayer trivia for club nights.', repoUrl: gh('gem-quiz')},
  ];

  const meetups: Meetup[] = [
    {id: 'meet-1', date: at(-28), topic: 'Intro to Git and GitHub', hostId: 'mem-4',
      agenda: ['Welcome', 'Git basics', 'Pair exercise: first pull request'],
      attendeeIds: ['mem-1', 'mem-2', 'mem-3', 'mem-4', 'mem-5', 'mem-6', 'mem-8', 'mem-9']},
    {id: 'meet-2', date: at(-14), topic: 'Debugging Workshop', hostId: 'mem-1',
      agenda: ['Reading stack traces', 'Using a debugger', 'Bug-hunt race'],
      attendeeIds: ['mem-1', 'mem-2', 'mem-3', 'mem-4', 'mem-5', 'mem-8', 'mem-11', 'mem-12']},
    {id: 'meet-3', date: at(4), topic: 'Building a REST API', hostId: 'mem-8',
      agenda: ['HTTP refresher', 'Live-code an API', 'Q&A'], attendeeIds: []},
    {id: 'meet-4', date: at(18), topic: 'Demo Night', hostId: 'mem-5',
      agenda: ['Lightning demos', 'Feedback round', 'Pizza'], attendeeIds: []},
  ];

  return {members, challenges, submissions, projects, meetups};
}
