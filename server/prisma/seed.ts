import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial database data...');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // Create demo user
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@ailearningbuddy.com' },
    update: {},
    create: {
      email: 'demo@ailearningbuddy.com',
      name: 'Alex Rivera',
      passwordHash,
      role: 'USER',
    },
  });

  console.log('Created demo user:', demoUser.email);

  // Check if course already exists
  const existingCourse = await prisma.course.findFirst({
    where: { userId: demoUser.id },
  });

  if (!existingCourse) {
    const course = await prisma.course.create({
      data: {
        userId: demoUser.id,
        title: 'Full-Stack Modern Web Architecture with React & Node.js',
        description: 'A comprehensive, end-to-end curriculum guiding you from architectural design patterns to production-grade deployment with React, TypeScript, Express, and PostgreSQL.',
        topic: 'Full-Stack Web Architecture',
        skillLevel: 'Intermediate',
        durationDays: 14,
        dailyStudyMinutes: 45,
        learningGoal: 'Master full-stack enterprise web development and pass senior portfolio reviews',
        learningObjectives: JSON.stringify([
          'Architect robust TypeScript web applications with clean separation of concerns',
          'Build and validate secure REST APIs with JWT authentication and rate limiting',
          'Implement relational databases and optimized schema queries using Prisma ORM',
          'Deploy performant, accessible React frontends with modern UI design systems',
        ]),
        prerequisites: JSON.stringify([
          'Basic understanding of JavaScript ES6+ syntax',
          'Foundational knowledge of HTML and CSS',
        ]),
        finalProject: JSON.stringify({
          title: 'Production SaaS Learning Management Platform',
          description: 'Design and deploy a full-stack SaaS platform complete with user authentication, database persistence, and external API integration.',
          requirements: [
            'Secure JWT session management with HTTP-only cookies',
            'Full CRUD operations backed by relational PostgreSQL/Prisma models',
            'Responsive client interface with modern glassmorphism aesthetics and loading skeletons',
          ],
        }),
        status: 'completed',
        modules: {
          create: [
            {
              order: 1,
              title: 'Foundations of Modern Full-Stack Systems',
              description: 'Understand client-server architecture, HTTP lifecycle, and modular software design.',
              lessons: {
                create: [
                  {
                    order: 1,
                    title: 'Client-Server Architecture & REST Principles',
                    learningObjectives: JSON.stringify([
                      'Understand the HTTP request-response cycle and statelessness',
                      'Design clean RESTful resource URIs and proper status codes',
                      'Configure CORS and security headers for API integrity',
                    ]),
                    estimatedMinutes: 30,
                    isGenerated: true,
                    content: JSON.stringify({
                      introduction: 'Every modern web application relies on a solid architectural dialogue between client and server. In this lesson, we explore the core principles that dictate how distributed web clients communicate with backend servers over HTTP.',
                      sections: [
                        {
                          heading: 'The HTTP Request-Response Lifecycle',
                          content: 'When a user interacts with a web interface, the client issues structured HTTP requests (GET, POST, PUT, DELETE) across TCP/IP sockets. Servers parse headers, validate authorization payloads, execute business logic, and serialize responses.',
                          codeSnippet: {
                            language: 'typescript',
                            code: '// Express route example with typed response\napp.get("/api/v1/courses", async (req: Request, res: Response) => {\n  const courses = await prisma.course.findMany();\n  return res.json({ success: true, data: courses });\n});',
                            explanation: 'A clean route handler demonstrating explicit HTTP verbs and standardized JSON response payloads.',
                          },
                        },
                        {
                          heading: 'Statelessness and JWT Authentication',
                          content: 'RESTful architectures require every request to contain all information needed to process it. By using signed JSON Web Tokens (JWT), servers can verify user identity cryptographically without maintaining server-side session tables.',
                        },
                      ],
                      practicalApplications: [
                        'Designing high-scale API gateways that handle thousands of concurrent client requests',
                        'Decoupling frontend single-page applications from backend microservices or modular monoliths',
                      ],
                      summary: 'Mastering HTTP lifecycles and RESTful boundaries forms the bedrock of scalable software engineering.',
                      keyTakeaways: [
                        'Always select the semantically correct HTTP method and status code',
                        'Never trust client input—validate payloads strictly on the server',
                        'Use signed JWTs for stateless, horizontal scalability',
                        'Configure CORS explicitly rather than using wildcard origins in production',
                      ],
                    }),
                  },
                  {
                    order: 2,
                    title: 'TypeScript for Full-Stack Type Safety',
                    learningObjectives: JSON.stringify([
                      'Share DTO interfaces between frontend and backend codebases',
                      'Enforce strict null checks and avoid type assertions',
                      'Leverage generics for reusable API utilities',
                    ]),
                    estimatedMinutes: 35,
                    isGenerated: false,
                  },
                ],
              },
            },
            {
              order: 2,
              title: 'Database Modeling & Relational ORMs',
              description: 'Design normalized relational schemas, manage database migrations, and optimize queries with Prisma.',
              lessons: {
                create: [
                  {
                    order: 1,
                    title: 'Relational Schema Design & Normalization',
                    learningObjectives: JSON.stringify([
                      'Construct 3NF relational schemas with primary and foreign keys',
                      'Establish one-to-many and many-to-many relationship constraints',
                      'Implement cascade deletes safely',
                    ]),
                    estimatedMinutes: 40,
                    isGenerated: false,
                  },
                ],
              },
            },
          ],
        },
      },
      include: {
        modules: {
          include: {
            lessons: true,
          },
        },
      },
    });

    // Mark lesson 1 as completed for demo user
    const firstLesson = course.modules[0].lessons[0];
    await prisma.lessonProgress.create({
      data: {
        userId: demoUser.id,
        lessonId: firstLesson.id,
        isCompleted: true,
        completedAt: new Date(),
      },
    });

    console.log('Seeded sample course and progress successfully!');
  }
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
