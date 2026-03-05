// ALFRED Orchestrator — Module 1
// Following ai-agents-architect skill: ReAct loop with iteration limits

import { CONVERSATION_PROMPT } from '../prompts/system-prompts';
import type { Session, ChatMessage, Plan, Feasibility, EventType } from '../../lib/types';

// ─── Types ───────────────────────────────────────────────────────
interface OrchestratorInput {
    session: Session;
    userMessage: string;
    chatHistory: ChatMessage[];
}

interface OrchestratorAction {
    tool: string;
    input: Record<string, any>;
    reasoning: string;
}

interface OrchestratorOutput {
    textStream: string;            // Streamed text for the user
    structuredPayload: any | null; // Final JSON (plans, profile, etc.)
    actions: OrchestratorAction[]; // Actions taken during ReAct
    events: { type: EventType; payload: Record<string, any> }[];
}

// ─── Memory Guard ────────────────────────────────────────────────
function memoryGuard(session: Session, toolName: string): { allowed: boolean; event?: { type: EventType; payload: any } } {
    const memoryTools = ['retrieveMemories', 'storeMemoryFact', 'getRoutines'];
    if (memoryTools.includes(toolName) && !session.consent_memory) {
        return {
            allowed: false,
            event: {
                type: 'memory_access_denied',
                payload: { tool: toolName, session_id: session.id, reason: 'consent_memory=false' },
            },
        };
    }
    return { allowed: true };
}

// ─── ReAct Loop ──────────────────────────────────────────────────
const MAX_ITERATIONS = 5;

export async function orchestrate(input: OrchestratorInput): Promise<OrchestratorOutput> {
    const { session, userMessage, chatHistory } = input;
    const actions: OrchestratorAction[] = [];
    const events: { type: EventType; payload: any }[] = [];
    let iteration = 0;
    let shouldContinue = true;
    let textStream = '';
    let structuredPayload: any = null;

    while (shouldContinue && iteration < MAX_ITERATIONS) {
        iteration++;

        // ─── THOUGHT: Reason about what to do next ─────────────────
        const thought = await reason(session, userMessage, chatHistory, actions);

        if (thought.action === 'respond') {
            // Direct response — no tool needed
            textStream = thought.response || '';
            shouldContinue = false;
            continue;
        }

        // ─── MEMORY GUARD CHECK ────────────────────────────────────
        const guard = memoryGuard(session, thought.tool);
        if (!guard.allowed) {
            if (guard.event) events.push(guard.event);
            actions.push({
                tool: thought.tool,
                input: thought.toolInput,
                reasoning: `BLOCKED: ${thought.tool} — memory consent not given`,
            });
            continue;
        }

        // ─── ACTION: Execute tool ──────────────────────────────────
        const result = await executeTool(thought.tool, thought.toolInput);
        actions.push({
            tool: thought.tool,
            input: thought.toolInput,
            reasoning: thought.reasoning,
        });

        // ─── OBSERVATION: Process result ───────────────────────────
        if (thought.tool === 'generatePlans') {
            structuredPayload = result;
            shouldContinue = false;
        }
    }

    if (iteration >= MAX_ITERATIONS) {
        textStream += '\n\n⚠️ J\'ai atteint ma limite de réflexion. Voici ce que j\'ai pour l\'instant.';
    }

    return { textStream, structuredPayload, actions, events };
}

// ─── Reasoning (placeholder — would call LLM) ───────────────────
async function reason(
    session: Session,
    userMessage: string,
    history: ChatMessage[],
    previousActions: OrchestratorAction[],
): Promise<{
    action: 'tool' | 'respond';
    tool: string;
    toolInput: Record<string, any>;
    reasoning: string;
    response?: string;
}> {
    // In production: call Gemini/GPT with CONVERSATION_PROMPT + history + available tools
    // For now: simple routing logic

    const msg = userMessage.toLowerCase();

    if (msg.includes('visa') || msg.includes('nationalité')) {
        return {
            action: 'tool',
            tool: 'checkVisaRequirements',
            toolInput: { destination: extractDestination(msg) },
            reasoning: 'User asking about visa/nationality → check requirements',
        };
    }

    if (msg.includes('partir') || msg.includes('voyager') || msg.includes('weekend')) {
        return {
            action: 'tool',
            tool: 'generatePlans',
            toolInput: { user_id: session.user_id, constraints: parseConstraints(msg), mood: session.mood },
            reasoning: 'User wants to travel → trigger solver',
        };
    }

    return {
        action: 'respond',
        tool: '',
        toolInput: {},
        reasoning: 'General conversation — respond directly',
        response: 'Dis-moi en plus ! Où tu veux aller, quand, et avec quel budget ?',
    };
}

// ─── Tool Execution (placeholder) ────────────────────────────────
async function executeTool(toolName: string, input: Record<string, any>): Promise<any> {
    // In production: route to actual implementations
    // For now: return mock data
    console.log(`[Orchestrator] Executing tool: ${toolName}`, input);
    return { mock: true, tool: toolName };
}

// ─── Helpers ─────────────────────────────────────────────────────
function extractDestination(msg: string): string {
    const destinations = ['espagne', 'hollande', 'madrid', 'amsterdam', 'portugal', 'france', 'italie'];
    return destinations.find(d => msg.includes(d)) || 'unknown';
}

function parseConstraints(msg: string): Record<string, any> {
    return {
        origin: 'Casablanca',
        destinations: ['Madrid'],
        raw_query: msg,
    };
}
