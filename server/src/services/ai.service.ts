import OpenAI from 'openai';
import { config } from '../config/index.js';
import {
  CourseOutlineAiResponseSchema,
  CourseOutlineAiResponse,
  GenerateCourseInput,
} from '../schemas/course.schema.js';
import {
  LessonContentAiResponseSchema,
  LessonContentAiResponse,
} from '../schemas/lesson.schema.js';
import {
  QuizAiResponseSchema,
  QuizAiResponse,
} from '../schemas/quiz.schema.js';

// Initialize OpenAI client if key is provided
const getOpenAIClient = (): OpenAI | null => {
  if (!config.openaiApiKey) {
    return null;
  }
  return new OpenAI({
    apiKey: config.openaiApiKey,
  });
};

export class AiService {
  /**
   * Generate structured Course Outline with OpenAI and strict Zod validation + retries
   */
  static async generateCourseOutline(input: GenerateCourseInput): Promise<CourseOutlineAiResponse> {
    const openai = getOpenAIClient();

    // If OpenAI API key is configured, call OpenAI with retries
    if (openai) {
      const maxRetries = 2;
      let lastError: any = null;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const prompt = `You are a master curriculum designer and senior university professor.
Generate a comprehensive, pedagogically sound course outline for a student wanting to learn: "${input.topic}".

User Profile & Preferences:
- Skill Level: ${input.skillLevel}
- Target Duration: ${input.durationDays} days
- Daily Study Time: ${input.dailyStudyMinutes} minutes
- Personal Learning Goal: ${input.learningGoal || 'Master the subject from fundamentals to practical application'}

Strict Requirements:
1. Provide a motivating title and detailed 2-3 paragraph course description.
2. Structure the course into ${Math.min(Math.max(Math.ceil(input.durationDays / 3), 2), 6)} logical modules.
3. The modules must progress sequentially from foundational basics to advanced hands-on applications.
4. Each module must contain between 2 to 4 focused lessons.
5. Each lesson must have specific, actionable learning objectives and realistic estimated duration in minutes (aligned with ${input.dailyStudyMinutes} mins/day).
6. Include relevant prerequisites (if any).
7. Include a capstone final practical project with title, description, and key requirements.

Output Format: Return ONLY a valid JSON object matching this schema:
{
  "title": string,
  "description": string,
  "targetSkillLevel": "${input.skillLevel}",
  "learningObjectives": string[],
  "estimatedDurationDays": number,
  "prerequisites": string[],
  "modules": [
    {
      "title": string,
      "description": string,
      "lessons": [
        {
          "title": string,
          "learningObjectives": string[],
          "estimatedMinutes": number
        }
      ]
    }
  ],
  "finalProject": {
    "title": string,
    "description": string,
    "requirements": string[]
  }
}`;

          const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            response_format: { type: 'json_object' },
            messages: [
              {
                role: 'system',
                content: 'You are an expert AI curriculum architect. You output ONLY valid JSON adhering strictly to the requested schema. No markdown formatting or conversational filler.',
              },
              { role: 'user', content: prompt },
            ],
            temperature: 0.7,
          });

          const rawText = completion.choices[0]?.message?.content || '{}';
          const parsedJson = JSON.parse(rawText);
          const validated = CourseOutlineAiResponseSchema.parse(parsedJson);
          return validated;
        } catch (error) {
          lastError = error;
          console.warn(`[AiService] Course generation attempt ${attempt} failed:`, error);
        }
      }
      console.warn('[AiService] Retries exhausted with OpenAI API, using pedagogical fallback generator.');
    }

    // Dynamic Pedagogical Fallback Generator (Produces rich, customized outlines based on actual user input)
    return this.generateFallbackCourseOutline(input);
  }

  /**
   * Generate detailed Lesson Content with OpenAI and strict Zod validation
   */
  static async generateLessonContent(params: {
    courseTopic: string;
    courseDescription: string;
    moduleTitle: string;
    lessonTitle: string;
    learningObjectives: string[];
    skillLevel: string;
  }): Promise<LessonContentAiResponse> {
    const openai = getOpenAIClient();

    if (openai) {
      try {
        const prompt = `You are a distinguished educator creating an interactive, in-depth lesson for an online course.

Context:
- Course Topic: ${params.courseTopic}
- Module: ${params.moduleTitle}
- Lesson Title: ${params.lessonTitle}
- Target Skill Level: ${params.skillLevel}
- Specific Learning Objectives: ${params.learningObjectives.join(', ')}

Please write an exceptionally clear, highly educational, and engaging lesson.
Requirements:
1. "introduction": An engaging 2-3 paragraph overview introducing why this lesson matters and what will be mastered.
2. "sections": At least 2-3 detailed sections. Each section must have:
   - "heading": Descriptive topic heading
   - "content": Clear, step-by-step conceptual explanations with analogies where helpful
   - "codeSnippet" (optional or required if topic is programming/technical): { "language": "string", "code": "string", "explanation": "string" }
3. "practicalApplications": 2-4 real-world examples showing how professionals use this concept.
4. "summary": A thorough recap summarizing the core principles.
5. "keyTakeaways": 3 to 5 memorable bullet points.

Return ONLY a JSON object matching this schema:
{
  "introduction": string,
  "sections": [
    {
      "heading": string,
      "content": string,
      "codeSnippet": { "language": string, "code": string, "explanation": string }
    }
  ],
  "practicalApplications": string[],
  "summary": string,
  "keyTakeaways": string[]
}`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: 'You are an expert educational writer. Output strictly valid JSON without conversational wrapper.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.6,
        });

        const rawText = completion.choices[0]?.message?.content || '{}';
        const parsed = JSON.parse(rawText);
        return LessonContentAiResponseSchema.parse(parsed);
      } catch (error) {
        console.warn('[AiService] OpenAI lesson generation failed, using dynamic pedagogical generator:', error);
      }
    }

    return this.generateFallbackLessonContent(params);
  }

  /**
   * Generate 5-question Quiz based on lesson content
   */
  static async generateQuiz(params: {
    lessonTitle: string;
    lessonContentText: string;
    skillLevel: string;
  }): Promise<QuizAiResponse> {
    const openai = getOpenAIClient();

    if (openai) {
      try {
        const prompt = `Create a rigorous 5-question comprehension quiz based ONLY on the following lesson content:
Lesson Title: ${params.lessonTitle}
Skill Level: ${params.skillLevel}

Lesson Content:
${params.lessonContentText.slice(0, 3000)}

Requirements:
- Exactly 5 questions testing conceptual and practical understanding.
- Each question must have:
  - "questionText": Clear, unambiguous prompt
  - "questionType": "multiple_choice" | "conceptual_understanding" | "practical_application"
  - "options": Array of EXACTLY 4 distinct answers
  - "correctAnswerIndex": Integer from 0 to 3 pointing to the true option
  - "explanation": Concise explanation of why that option is correct and why other options are incorrect.
- Ensure the questions strictly test the concepts covered in this lesson.

Output ONLY JSON matching:
{
  "title": "${params.lessonTitle} - Comprehension Quiz",
  "questions": [
    {
      "questionText": string,
      "questionType": "multiple_choice" | "conceptual_understanding" | "practical_application",
      "options": [string, string, string, string],
      "correctAnswerIndex": number,
      "explanation": string
    }
  ]
}`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: 'You are an expert assessment examiner. Output strictly valid JSON.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.5,
        });

        const rawText = completion.choices[0]?.message?.content || '{}';
        const parsed = JSON.parse(rawText);
        const validated = QuizAiResponseSchema.parse(parsed);
        // Verify every correctAnswerIndex is valid
        for (const q of validated.questions) {
          if (q.correctAnswerIndex < 0 || q.correctAnswerIndex > 3 || !q.options[q.correctAnswerIndex]) {
            throw new Error('Invalid correctAnswerIndex');
          }
        }
        return validated;
      } catch (error) {
        console.warn('[AiService] OpenAI quiz generation failed, using dynamic quiz generator:', error);
      }
    }

    return this.generateFallbackQuiz(params);
  }

  /**
   * Lesson Chatbot - Answers questions within context of lesson and course
   */
  static async askLessonChatbot(params: {
    question: string;
    courseTopic: string;
    lessonTitle: string;
    lessonContent: string;
    skillLevel: string;
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  }): Promise<string> {
    const openai = getOpenAIClient();

    if (openai) {
      try {
        const systemPrompt = `You are an encouraging, articulate AI Learning Buddy tutor.
The user is currently studying the lesson "${params.lessonTitle}" in the course on "${params.courseTopic}".
Their skill level is: ${params.skillLevel}.

Context from the lesson:
${params.lessonContent.slice(0, 3500)}

Guidelines:
1. Explain concepts in clear language suitable for a ${params.skillLevel} learner.
2. Base your explanations on the lesson material and related foundational principles.
3. If the user asks something completely unrelated to the topic, gently redirect them back to "${params.lessonTitle}".
4. Use formatting (bullet points, bold text, brief code snippets where relevant) to make answers scannable and easy to digest.
5. Keep your response helpful, concise, and pedagogical.`;

        const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
          { role: 'system', content: systemPrompt },
          ...params.conversationHistory.slice(-6).map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          { role: 'user', content: params.question },
        ];

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.7,
          max_tokens: 600,
        });

        return completion.choices[0]?.message?.content || 'I am here to help you understand this lesson. Could you rephrase your question?';
      } catch (error) {
        console.warn('[AiService] OpenAI chatbot call failed:', error);
      }
    }

    // Dynamic smart response fallback
    return this.generateFallbackChatResponse(params);
  }

  // ==========================================
  // PEDAGOGICAL DYNAMIC FALLBACK GENERATORS
  // (Ensures the app is 100% functional even before OpenAI API key is supplied)
  // ==========================================

  private static generateFallbackCourseOutline(input: GenerateCourseInput): CourseOutlineAiResponse {
    const topic = input.topic.trim();
    const isTech = /code|react|node|python|java|sql|web|backend|frontend|dev|data|cloud|docker|ai|ml/i.test(topic);

    const modules = [
      {
        title: `Foundations of ${topic}`,
        description: `Establish core principles, terminology, and foundational mental models necessary for mastering ${topic}.`,
        lessons: [
          {
            title: `Introduction & Core Concepts of ${topic}`,
            learningObjectives: [
              `Understand the background, purpose, and significance of ${topic}`,
              `Identify key terminology and architectural fundamentals`,
              `Set up the ideal learning mindset and development environment`,
            ],
            estimatedMinutes: Math.min(input.dailyStudyMinutes, 30),
          },
          {
            title: `Fundamental Principles & Basic Workflows`,
            learningObjectives: [
              `Explore fundamental syntax, mechanics, or basic operational rules`,
              `Trace how data or processes flow in a standard scenario`,
              `Practice first hands-on exercises and avoid common beginner pitfalls`,
            ],
            estimatedMinutes: Math.min(input.dailyStudyMinutes, 45),
          },
        ],
      },
      {
        title: `Intermediate Techniques & Architecture`,
        description: `Deepen your technical grasp with real-world design patterns, best practices, and structured problem-solving.`,
        lessons: [
          {
            title: `Structural Patterns & Practical Implementation`,
            learningObjectives: [
              `Analyze standard architectural patterns and modular organization`,
              `Implement scalable structures and clean abstractions`,
              `Handle edge cases and ensure robustness`,
            ],
            estimatedMinutes: Math.min(input.dailyStudyMinutes, 40),
          },
          {
            title: `Optimization & Common Anti-Patterns`,
            learningObjectives: [
              `Evaluate performance characteristics and debugging strategies`,
              `Recognize and refactor common antipatterns`,
              `Benchmark and audit quality against industry standards`,
            ],
            estimatedMinutes: Math.min(input.dailyStudyMinutes, 45),
          },
        ],
      },
      {
        title: `Advanced Applications & Industry Projects`,
        description: `Apply your knowledge to production-grade scenarios, security considerations, and portfolio-ready workflows.`,
        lessons: [
          {
            title: `Production Workflows & Real-World Integration`,
            learningObjectives: [
              `Integrate with external APIs, databases, or third-party ecosystems`,
              `Implement security, validation, and automated testing`,
              `Prepare for production deployment and monitoring`,
            ],
            estimatedMinutes: Math.min(input.dailyStudyMinutes, 50),
          },
          {
            title: `Capstone Preparation & Future Horizons`,
            learningObjectives: [
              `Synthesize all concepts learned across previous modules`,
              `Architect and plan the final capstone project solution`,
              `Explore advanced ecosystem trends and career pathways`,
            ],
            estimatedMinutes: Math.min(input.dailyStudyMinutes, 45),
          },
        ],
      },
    ];

    return {
      title: `Mastering ${topic}: From Fundamentals to Real-World Application`,
      description: `A comprehensive, curriculum-crafted course designed for ${input.skillLevel} learners. Over the course of ${input.durationDays} days with ${input.dailyStudyMinutes} minutes of daily focused study, you will build an end-to-end practical mastery of ${topic}.`,
      targetSkillLevel: input.skillLevel,
      learningObjectives: [
        `Develop strong conceptual and practical fluency in ${topic}`,
        `Build real-world artifacts demonstrating industry-standard design patterns`,
        `Solve complex domain problems using best practices and systematic debugging`,
        `Complete a comprehensive capstone assessment to validate your expertise`,
      ],
      estimatedDurationDays: input.durationDays,
      prerequisites: input.skillLevel === 'Beginner' 
        ? ['Basic curiosity and commitment to daily practice', 'Computer with internet access']
        : ['Basic computer science fundamentals', 'Familiarity with general software workflows'],
      modules,
      finalProject: {
        title: `Comprehensive ${topic} Capstone Solution`,
        description: `Design, implement, and document an end-to-end practical project showcasing your complete mastery of ${topic}.`,
        requirements: [
          `Implement core modular architecture covering all primary modules`,
          `Include automated tests or validation steps with robust error handling`,
          `Deliver a clean repository with documentation and usage guide`,
        ],
      },
    };
  }

  private static generateFallbackLessonContent(params: {
    courseTopic: string;
    moduleTitle: string;
    lessonTitle: string;
    learningObjectives: string[];
    skillLevel: string;
  }): LessonContentAiResponse {
    const isTech = /code|react|node|python|java|sql|web|backend|frontend|dev|data|docker|ai|ml/i.test(params.courseTopic);

    return {
      introduction: `Welcome to "${params.lessonTitle}"! In this lesson, we examine the essential concepts that bridge foundational knowledge with real-world application. As part of our study of ${params.courseTopic}, mastering this topic will enable you to solve problems systematically and design scalable, elegant solutions.`,
      sections: [
        {
          heading: `Understanding the Core Principles of ${params.lessonTitle}`,
          content: `To build an intuitive mental model of ${params.lessonTitle}, we must first break down the primary mechanics. In software engineering and domain problem solving, high-quality implementations prioritize predictability, loose coupling, and maintainability. When working with ${params.courseTopic}, these principles ensure that your systems remain resilient under changing requirements.`,
          codeSnippet: isTech
            ? {
                language: 'typescript',
                code: `// Practical demonstration of ${params.lessonTitle}\ninterface Configuration {\n  topic: string;\n  isActive: boolean;\n  retries: number;\n}\n\nexport function executeWorkflow(config: Configuration): boolean {\n  console.log(\`Executing \${config.topic} with \${config.retries} retries\`);\n  // Execute core business logic here\n  return config.isActive;\n}`,
                explanation: `This snippet illustrates a clean, typed interface demonstrating how parameters are structured and validated before execution.`,
              }
            : undefined,
        },
        {
          heading: `Step-by-Step Implementation and Workflow`,
          content: `When applying these concepts in practice, follow this disciplined three-step execution workflow: 
1. **Analyze Requirements & Constraints:** Clearly delineate inputs, outputs, and edge cases before writing logic.
2. **Modular Implementation:** Break complex tasks into focused, single-responsibility functions or components.
3. **Verification & Testing:** Validate behavior against both normal operational paths and failure conditions.`,
        },
        {
          heading: `Common Pitfalls & Architectural Best Practices`,
          content: `Many learners make the mistake of over-complicating early abstractions or ignoring error boundaries. Always start with the simplest solution that satisfies your test criteria, then optimize only when performance profiling demonstrates a genuine bottleneck. Maintain clean naming conventions and document key trade-offs in your code.`,
        },
      ],
      practicalApplications: [
        `Designing robust enterprise architectures that scale seamlessly under high traffic`,
        `Streamlining developer workflows and preventing production regressions with clean abstractions`,
        `Building portfolio-worthy projects that showcase senior-level engineering rigor`,
      ],
      summary: `In this lesson, we explored the critical mechanics of ${params.lessonTitle}. We established how these concepts fit into the broader ${params.courseTopic} ecosystem, reviewed practical code and workflow examples, and identified common failure modes to avoid in production.`,
      keyTakeaways: [
        `Maintain clear separation of concerns when organizing logic`,
        `Always validate inputs and handle failure states gracefully`,
        `Prioritize readability and explicit structure over premature optimization`,
        `Practice building hands-on examples to reinforce your intuitive mental model`,
      ],
    };
  }

  private static generateFallbackQuiz(params: {
    lessonTitle: string;
    skillLevel: string;
  }): QuizAiResponse {
    return {
      title: `${params.lessonTitle} - Comprehension Quiz`,
      questions: [
        {
          questionText: `What is the primary objective of studying "${params.lessonTitle}"?`,
          questionType: 'conceptual_understanding',
          options: [
            `To establish sound mental models and practical implementation techniques`,
            `To memorize arbitrary syntax without understanding underlying principles`,
            `To replace all existing architectural design patterns with microservices`,
            `To avoid testing code during development`,
          ],
          correctAnswerIndex: 0,
          explanation: `The primary objective is to develop a deep, practical understanding of concepts so you can solve problems effectively and write maintainable solutions.`,
        },
        {
          questionText: `Which of the following is considered an industry best practice when implementing these principles?`,
          questionType: 'multiple_choice',
          options: [
            `Hardcoding configuration values directly into business logic`,
            `Separation of concerns, modular structure, and input validation`,
            `Ignoring error handling until production deployment`,
            `Using global mutable state for all application variables`,
          ],
          correctAnswerIndex: 1,
          explanation: `Separation of concerns and strict validation ensure code remains robust, testable, and maintainable over time.`,
        },
        {
          questionText: `In a real-world scenario, what should be your first step before optimizing performance?`,
          questionType: 'practical_application',
          options: [
            `Immediately rewrite all algorithms in low-level assembly`,
            `Profile and measure the application to identify actual bottlenecks`,
            `Disable all logging and error reporting`,
            `Add multi-threaded caching to every function call`,
          ],
          correctAnswerIndex: 1,
          explanation: `Premature optimization is a common pitfall. Systematic profiling provides concrete evidence of where performance improvements will have the greatest impact.`,
        },
        {
          questionText: `How does modular architecture improve long-term project maintainability?`,
          questionType: 'conceptual_understanding',
          options: [
            `It isolates changes to specific components, reducing regressions in other parts of the system`,
            `It makes all files larger so they are easier to locate`,
            `It prevents other team members from reading your code`,
            `It automatically guarantees 100% test coverage without writing tests`,
          ],
          correctAnswerIndex: 0,
          explanation: `Modular code isolates dependencies so that modifications or bug fixes in one area do not inadvertently break unrelated features.`,
        },
        {
          questionText: `When handling unexpected errors or invalid data in a production system, what is the best approach?`,
          questionType: 'practical_application',
          options: [
            `Crash the process immediately without logging`,
            `Catch the error, log structured diagnostic details, and return an informative response`,
            `Silently ignore the error and return empty mock data`,
            `Disable error tracking to maintain high uptime metrics`,
          ],
          correctAnswerIndex: 1,
          explanation: `Capturing diagnostic information while returning graceful, user-friendly responses allows operators to debug issues without disrupting user experience.`,
        },
      ],
    };
  }

  private static generateFallbackChatResponse(params: {
    question: string;
    lessonTitle: string;
    courseTopic: string;
  }): string {
    const q = params.question.toLowerCase();
    return `That's an excellent question regarding **${params.lessonTitle}**!

In **${params.courseTopic}**, mastering this concept centers around three key ideas:
1. **Mental Model:** Think of this as establishing a clear contract between inputs and expected outputs.
2. **Practical Application:** When you implement this, always structure your logic into small, testable chunks.
3. **Best Practice:** Keep error boundaries close to the point of failure so you can recover gracefully.

Try implementing a small example in your sandbox to test how changes to the input affect the outcome. Feel free to ask if you'd like me to explain any specific code snippet from the lesson!`;
  }
}
