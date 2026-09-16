"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";
import { getMyWorkspaceId } from "@/lib/workspace";
import BrandLogo from "@/components/brand-logo";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

type SavedChat = {
  id: string;
  title: string;
  preview: string;
  updatedAt: string;
  messages: Message[];
};

type QuickAction = {
  icon: string;
  title: string;
  description: string;
  prompt: string;
};

const CHAT_STORAGE_KEY = "businesspilot-chat-history";

const quickActions: QuickAction[] = [
  {
    icon: "◎",
    title: "Review my leads",
    description: "Find follow-ups and sales opportunities",
    prompt:
      "Summarize my pending leads and tell me what needs attention.",
  },
  {
    icon: "✓",
    title: "Create a task",
    description: "Add important work to your workspace",
    prompt: "Create a new business task for me.",
  },
  {
    icon: "▥",
    title: "Daily report",
    description: "Understand today's business performance",
    prompt: "Generate my daily business report.",
  },
  {
    icon: "$",
    title: "Review invoices",
    description: "Check unpaid and overdue invoices",
    prompt: "Show me my unpaid and overdue invoices.",
  },
];

export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatHistory, setChatHistory] = useState<SavedChat[]>([]);
  const [activeChatId, setActiveChatId] = useState("");
  const [input, setInput] = useState("");
  const [userName, setUserName] = useState("there");
  const [isThinking, setIsThinking] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadChats();
    loadUserName();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isThinking]);

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(
      textarea.scrollHeight,
      150,
    )}px`;
  }, [input]);

  function createId(prefix: string) {
    return `${prefix}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
  }

  function createWelcomeMessage(): Message {
    return {
      id: createId("message"),
      role: "assistant",
      content:
        "Welcome to BusinessPilot AI. I can help you manage leads, customers, tasks, invoices, appointments, reports, and daily business operations.",
      createdAt: new Date().toISOString(),
    };
  }

  async function loadUserName() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const fullName =
        user?.user_metadata?.full_name ||
        user?.user_metadata?.name;

      if (typeof fullName === "string" && fullName.trim()) {
        setUserName(fullName.trim().split(" ")[0]);
      }
    } catch {
      setUserName("there");
    }
  }

  function loadChats() {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);

      if (!saved) {
        createFirstChat();
        return;
      }

      const parsed = JSON.parse(saved) as SavedChat[];

      if (!Array.isArray(parsed) || parsed.length === 0) {
        createFirstChat();
        return;
      }

      setChatHistory(parsed);
      setActiveChatId(parsed[0].id);
      setMessages(parsed[0].messages);
    } catch {
      createFirstChat();
    }
  }

  function createFirstChat() {
    const chatId = createId("chat");
    const welcome = createWelcomeMessage();

    const firstChat: SavedChat = {
      id: chatId,
      title: "New conversation",
      preview: welcome.content,
      updatedAt: new Date().toLocaleString(),
      messages: [welcome],
    };

    setActiveChatId(chatId);
    setMessages([welcome]);
    setChatHistory([firstChat]);

    localStorage.setItem(
      CHAT_STORAGE_KEY,
      JSON.stringify([firstChat]),
    );
  }

  function startNewChat() {
    const chatId = createId("chat");
    const welcome = createWelcomeMessage();

    const newChat: SavedChat = {
      id: chatId,
      title: "New conversation",
      preview: welcome.content,
      updatedAt: new Date().toLocaleString(),
      messages: [welcome],
    };

    setActiveChatId(chatId);
    setMessages([welcome]);
    setInput("");
    setHistoryOpen(false);

    setChatHistory((current) => {
      const next = [newChat, ...current];

      localStorage.setItem(
        CHAT_STORAGE_KEY,
        JSON.stringify(next),
      );

      return next;
    });
  }

  function selectChat(chatId: string) {
    const selected = chatHistory.find(
      (chat) => chat.id === chatId,
    );

    if (!selected) {
      return;
    }

    setActiveChatId(selected.id);
    setMessages(selected.messages);
    setInput("");
    setHistoryOpen(false);
  }

  function saveCurrentChat(nextMessages: Message[]) {
    if (!activeChatId || nextMessages.length === 0) {
      return;
    }

    const firstUserMessage = nextMessages.find(
      (message) => message.role === "user",
    );

    const lastMessage = nextMessages[nextMessages.length - 1];

    const updatedChat: SavedChat = {
      id: activeChatId,
      title: firstUserMessage
        ? firstUserMessage.content.slice(0, 38)
        : "New conversation",
      preview: lastMessage.content.slice(0, 100),
      updatedAt: new Date().toLocaleString(),
      messages: nextMessages,
    };

    setChatHistory((current) => {
      const withoutCurrent = current.filter(
        (chat) => chat.id !== activeChatId,
      );

      const next = [updatedChat, ...withoutCurrent];

      localStorage.setItem(
        CHAT_STORAGE_KEY,
        JSON.stringify(next),
      );

      return next;
    });
  }

  async function saveToSheets(
    resource: string,
    record: Record<string, unknown>,
  ) {
    try {
      const response = await fetch("/api/sheets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "save",
          resource,
          record,
        }),
      });

      const data = await response.json();

      return response.ok && data.success === true;
    } catch {
      return false;
    }
  }

  async function handleSecureCommand(
    messageText: string,
  ): Promise<string | null> {
    const leadCommand =
      /^add lead:\s*(.+?)\s*\|\s*(\S+@\S+)\s*\|\s*(.*?)\s*\|\s*(.+)$/i.exec(
        messageText,
      );

    if (leadCommand) {
      const workspaceId = await getMyWorkspaceId();
      const [, name, email, phone, interest] = leadCommand;

      const { data, error } = await supabase
        .from("leads")
        .insert({
          workspace_id: workspaceId,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          interest: interest.trim(),
          status: "New",
          stage: "New",
          deal_value: 0,
        })
        .select()
        .single();

      if (error || !data) {
        throw new Error(
          error?.message || "Could not save the lead.",
        );
      }

      const backup = await saveToSheets("Leads", {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone || "",
        interest: data.interest || "",
        status: data.status,
        stage: data.stage,
        createdAt: data.created_at,
      });

      return backup
        ? `### Lead created successfully

**Name:** ${data.name}
**Stage:** New

The lead was saved securely in Supabase and backed up to Google Sheets.`
        : `### Lead saved

**Name:** ${data.name}

The lead was saved in Supabase, but the Google Sheets backup failed.`;
    }

    const taskCommand =
      /^create task:\s*(.+?)\s*\|\s*(low|medium|high)\s*\|\s*(\d{4}-\d{2}-\d{2})\s*\|\s*(.+)$/i.exec(
        messageText,
      );

    if (taskCommand) {
      const workspaceId = await getMyWorkspaceId();
      const [, title, priorityText, dueDate, description] =
        taskCommand;

      const priority =
        priorityText.charAt(0).toUpperCase() +
        priorityText.slice(1).toLowerCase();

      const { data, error } = await supabase
        .from("tasks")
        .insert({
          workspace_id: workspaceId,
          title: title.trim(),
          description: description.trim(),
          priority,
          due_date: dueDate.trim(),
          completed: false,
        })
        .select()
        .single();

      if (error || !data) {
        throw new Error(
          error?.message || "Could not save the task.",
        );
      }

      const backup = await saveToSheets("Tasks", {
        id: data.id,
        title: data.title,
        description: data.description || "",
        priority: data.priority,
        dueDate: data.due_date,
        completed: data.completed,
        createdAt: data.created_at,
      });

      return backup
        ? `### Task created successfully

**Task:** ${data.title}
**Priority:** ${data.priority}
**Due date:** ${data.due_date}

The task is now in your workspace.`
        : `### Task saved

**Task:** ${data.title}

The task was saved in Supabase, but the Google Sheets backup failed.`;
    }

    const appointmentCommand =
      /^book appointment:\s*(.+?)\s*\|\s*(\d{4}-\d{2}-\d{2})\s*\|\s*(.+?)\s*\|\s*(.+)$/i.exec(
        messageText,
      );

    if (appointmentCommand) {
      const workspaceId = await getMyWorkspaceId();
      const [, customerName, date, time, purpose] =
        appointmentCommand;

      const { data, error } = await supabase
        .from("appointments")
        .insert({
          workspace_id: workspaceId,
          customer_name: customerName.trim(),
          appointment_date: date.trim(),
          appointment_time: time.trim(),
          purpose: purpose.trim(),
          status: "Scheduled",
        })
        .select()
        .single();

      if (error || !data) {
        throw new Error(
          error?.message || "Could not save the appointment.",
        );
      }

      const backup = await saveToSheets("Appointments", {
        id: data.id,
        customerName: data.customer_name,
        date: data.appointment_date,
        time: data.appointment_time,
        purpose: data.purpose,
        status: data.status,
      });

      return backup
        ? `### Appointment booked

**Customer:** ${data.customer_name}
**Date:** ${data.appointment_date}
**Time:** ${data.appointment_time}

The appointment was saved successfully.`
        : `### Appointment saved

The appointment was saved in Supabase, but the Google Sheets backup failed.`;
    }

    const customerCommand =
      /^add customer:\s*(.+?)\s*\|\s*(\S+@\S+)\s*\|\s*(.*?)\s*\|\s*(.+?)\s*\|\s*(active|prospect|inactive)$/i.exec(
        messageText,
      );

    if (customerCommand) {
      const workspaceId = await getMyWorkspaceId();
      const [, name, email, phone, company, statusText] =
        customerCommand;

      const status =
        statusText.charAt(0).toUpperCase() +
        statusText.slice(1).toLowerCase();

      const { data, error } = await supabase
        .from("customers")
        .insert({
          workspace_id: workspaceId,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          company: company.trim(),
          status,
          notes: "",
        })
        .select()
        .single();

      if (error || !data) {
        throw new Error(
          error?.message || "Could not save the customer.",
        );
      }

      const backup = await saveToSheets("Customers", {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone || "",
        company: data.company || "",
        status: data.status,
        createdAt: data.created_at,
      });

      return backup
        ? `### Customer saved successfully

**Name:** ${data.name}
**Company:** ${data.company}
**Status:** ${data.status}`
        : `### Customer saved

The customer was saved in Supabase, but the Google Sheets backup failed.`;
    }

    const invoiceCommand =
      /^create invoice:\s*(.+?)\s*\|\s*(\S+@\S+)\s*\|\s*(.+?)\s*\|\s*(\d+(?:\.\d+)?)\s*\|\s*(\d+(?:\.\d+)?)\s*\|\s*(\d+(?:\.\d+)?)\s*\|\s*(\d+(?:\.\d+)?)$/i.exec(
        messageText,
      );

    if (invoiceCommand) {
      const workspaceId = await getMyWorkspaceId();

      const [
        ,
        customerName,
        customerEmail,
        description,
        quantityText,
        priceText,
        taxText,
        discountText,
      ] = invoiceCommand;

      const quantity = Number(quantityText);
      const price = Number(priceText);
      const tax = Number(taxText);
      const discount = Number(discountText);

      const invoiceNumber = `INV-${Date.now()
        .toString()
        .slice(-8)}`;

      const { data, error } = await supabase
        .from("invoices")
        .insert({
          workspace_id: workspaceId,
          invoice_number: invoiceNumber,
          customer_name: customerName.trim(),
          customer_email: customerEmail.trim(),
          description: description.trim(),
          quantity,
          price,
          tax,
          discount,
          payment_status: "Unpaid",
          paid_amount: 0,
        })
        .select()
        .single();

      if (error || !data) {
        throw new Error(
          error?.message || "Could not save the invoice.",
        );
      }

      const subtotal = quantity * price;
      const total =
        subtotal +
        (subtotal * tax) / 100 -
        (subtotal * discount) / 100;

      const backup = await saveToSheets("Invoices", {
        id: data.id,
        invoiceNumber: data.invoice_number,
        customerName: data.customer_name,
        customerEmail: data.customer_email || "",
        description: data.description,
        quantity: data.quantity,
        price: data.price,
        tax: data.tax,
        discount: data.discount,
        paymentStatus: data.payment_status,
        paidAmount: data.paid_amount,
        total,
        createdAt: data.created_at,
      });

      return backup
        ? `### Invoice created successfully

**Invoice:** ${data.invoice_number}
**Customer:** ${data.customer_name}
**Total:** $${total.toFixed(2)}
**Status:** Unpaid`
        : `### Invoice saved

**Invoice:** ${data.invoice_number}
**Total:** $${total.toFixed(2)}

The invoice was saved in Supabase, but the Google Sheets backup failed.`;
    }

    const expenseCommand =
      /^add expense:\s*(.+?)\s*\|\s*(software|marketing|office|travel|salary|other)\s*\|\s*(\d+(?:\.\d+)?)\s*\|\s*(\d{4}-\d{2}-\d{2})\s*\|\s*(.+)$/i.exec(
        messageText,
      );

    if (expenseCommand) {
      const workspaceId = await getMyWorkspaceId();
      const [, title, categoryText, amountText, date, notes] =
        expenseCommand;

      const category =
        categoryText.charAt(0).toUpperCase() +
        categoryText.slice(1).toLowerCase();

      const amount = Number(amountText);

      const { data, error } = await supabase
        .from("expenses")
        .insert({
          workspace_id: workspaceId,
          title: title.trim(),
          category,
          amount,
          expense_date: date.trim(),
          notes: notes.trim(),
        })
        .select()
        .single();

      if (error || !data) {
        throw new Error(
          error?.message || "Could not save the expense.",
        );
      }

      const backup = await saveToSheets("Expenses", {
        id: data.id,
        title: data.title,
        category: data.category,
        amount: data.amount,
        date: data.expense_date,
        notes: data.notes || "",
        createdAt: data.created_at,
      });

      return backup
        ? `### Expense saved successfully

**Title:** ${data.title}
**Category:** ${data.category}
**Amount:** $${Number(data.amount).toFixed(2)}`
        : `### Expense saved

The expense was saved in Supabase, but the Google Sheets backup failed.`;
    }

    return null;
  }

  async function sendMessage(customText?: string) {
    const text = (customText ?? input).trim();

    if (!text || isThinking) {
      return;
    }

    const userMessage: Message = {
      id: createId("message"),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };

    const messagesWithUser = [...messages, userMessage];

    setMessages(messagesWithUser);
    setInput("");
    setIsThinking(true);
    saveCurrentChat(messagesWithUser);

    try {
      const secureReply = await handleSecureCommand(text);

      if (secureReply) {
        const assistantMessage: Message = {
          id: createId("message"),
          role: "assistant",
          content: secureReply,
          createdAt: new Date().toISOString(),
        };

        const finalMessages = [
          ...messagesWithUser,
          assistantMessage,
        ];

        setMessages(finalMessages);
        saveCurrentChat(finalMessages);
        return;
      }

      // ===================== NEW GROQ AI ENGINE INTEGRATION =====================
      // Purane /api/chat ki jagah ab humara naya Fast & Smart /api/ai use hoga
      const chatContext = messagesWithUser.map((m) => `${m.role === 'user' ? 'User' : 'BusinessPilot'}: ${m.content}`).join('\n');
      const prompt = `You are BusinessPilot AI, an intelligent business assistant. Answer the user based on the conversation history below:\n\n${chatContext}\n\nKeep your response professional and helpful.`;

      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt,
        }),
      });

      const rawText = await response.text();

      let result: {
        text?: string;
        error?: string;
      };

      try {
        result = JSON.parse(rawText);
      } catch {
        throw new Error(
          "AI server returned an invalid response.",
        );
      }

      if (!response.ok) {
        throw new Error(
          result.error || "The AI could not answer.",
        );
      }

      const assistantMessage: Message = {
        id: createId("message"),
        role: "assistant",
        content:
          result.text ||
          "I could not generate a response right now.",
        createdAt: new Date().toISOString(),
      };

      const finalMessages = [
        ...messagesWithUser,
        assistantMessage,
      ];

      setMessages(finalMessages);
      saveCurrentChat(finalMessages);
    } catch (error) {
      const errorMessage: Message = {
        id: createId("message"),
        role: "assistant",
        content:
          error instanceof Error
            ? `### Something went wrong\n\n${error.message}`
            : "The request could not be completed.",
        createdAt: new Date().toISOString(),
      };

      const finalMessages = [
        ...messagesWithUser,
        errorMessage,
      ];

      setMessages(finalMessages);
      saveCurrentChat(finalMessages);
    } finally {
      setIsThinking(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage();
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  const showWelcome = messages.length <= 1;

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <div className="flex min-h-screen">
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-[#08111f]/95 p-4 backdrop-blur-xl transition-transform lg:static lg:translate-x-0 ${
            historyOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold">Conversations</p>

              <p className="mt-1 text-xs text-slate-600">
                Your recent AI chats
              </p>
            </div>

            <button
              type="button"
              onClick={() => setHistoryOpen(false)}
              className="text-xl text-slate-500 hover:text-white lg:hidden"
            >
              ×
            </button>
          </div>

          <button
            type="button"
            onClick={startNewChat}
            className="mt-6 rounded-xl bg-gradient-to-r from-cyan-300 to-blue-500 px-4 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/10 transition hover:from-cyan-200 hover:to-blue-400"
          >
            + New conversation
          </button>

          <div className="mt-6 flex-1 space-y-2 overflow-y-auto">
            {chatHistory.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-slate-600">
                No previous conversations.
              </div>
            ) : (
              chatHistory.map((chat) => (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => selectChat(chat.id)}
                  className={`w-full rounded-xl p-3 text-left transition ${
                    activeChatId === chat.id
                      ? "border border-cyan-400/30 bg-cyan-400/10"
                      : "border border-transparent hover:bg-white/[0.05]"
                  }`}
                >
                  <p className="truncate text-sm font-semibold text-slate-200">
                    {chat.title}
                  </p>

                  <p className="mt-1 truncate text-xs text-slate-600">
                    {chat.preview}
                  </p>

                  <p className="mt-2 text-[10px] text-slate-700">
                    {chat.updatedAt}
                  </p>
                </button>
              ))
            )}
          </div>

          <div className="border-t border-white/10 pt-4">
            <div className="rounded-xl bg-emerald-400/[0.06] p-3">
              <p className="text-xs font-semibold text-emerald-300">
                Private workspace
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-600">
                Chat history is stored locally in this browser.
              </p>
            </div>
          </div>
        </aside>

        {historyOpen && (
          <button
            type="button"
            aria-label="Close chat history"
            onClick={() => setHistoryOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          />
        )}

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-white/10 bg-[#08111f]/80 px-5 py-4 backdrop-blur-xl sm:px-8">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setHistoryOpen(true)}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-lg text-white lg:hidden"
              >
                ☰
              </button>

              <BrandLogo compact />

              <div className="hidden sm:block">
                <div className="flex items-center gap-2">
                  <p className="font-bold">AI Assistant</p>

                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                    ONLINE
                  </span>
                </div>

                <p className="mt-1 text-xs text-slate-500">
                  Your intelligent business operator
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="/landing"
                className="hidden rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-bold text-cyan-300 transition hover:bg-cyan-400/20 sm:block"
              >
                View Website 🌐
              </a>
              <a
                href="/dashboard"
                className="rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
              >
                Dashboard
              </a>
            </div>
          </header>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-8">
              <div className="mx-auto max-w-4xl">
                {showWelcome && (
                  <section className="mb-10">
                    <div className="relative overflow-hidden rounded-[2rem] border border-cyan-400/20 bg-gradient-to-br from-cyan-400/[0.12] via-blue-500/[0.08] to-violet-500/[0.12] p-6 shadow-2xl shadow-cyan-950/20 sm:p-8">
                      <div className="mb-5">
                        <BrandLogo />
                      </div>

                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
                        Your intelligent operator
                      </p>

                      <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                        Good morning, {userName}.
                          


                        <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                          What can we get done today?
                        </span>
                      </h1>

                      <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300">
                        Manage leads, customers, tasks, invoices,
                        reports, appointments, and daily business
                        operations from one intelligent workspace.
                      </p>

                      <div className="mt-8 grid gap-3 sm:grid-cols-2">
                        {quickActions.map((action) => (
                          <button
                            key={action.title}
                            type="button"
                            onClick={() => sendMessage(action.prompt)}
                            className="group flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-left transition hover:-translate-y-0.5 hover:border-cyan-300/40 hover:bg-cyan-400/[0.08]"
                          >
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-lg text-cyan-300 group-hover:bg-cyan-300 group-hover:text-slate-950">
                              {action.icon}
                            </span>

                            <span>
                              <span className="block text-sm font-bold text-slate-100">
                                {action.title}
                              </span>

                              <span className="mt-1 block text-xs leading-5 text-slate-500">
                                {action.description}
                              </span>
                            </span>

                            <span className="ml-auto text-slate-600 group-hover:text-cyan-300">
                              →
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-5 px-2 text-xs text-slate-600">
                      <span>
                        <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        Private workspace
                      </span>

                      <span>AI-powered operations</span>
                      <span>Press Enter to send</span>
                    </div>
                  </section>
                )}

                {!showWelcome && (
                  <div className="mb-8">
                    <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">
                      BusinessPilot AI
                    </p>

                    <h1 className="mt-3 text-3xl font-black tracking-tight">
                      Let&apos;s move your business forward.
                    </h1>
                  </div>
                )}

                <div className="space-y-6">
                  {messages.map((message) => (
                    <MessageView
                      key={message.id}
                      message={message}
                    />
                  ))}

                  {isThinking && <TypingIndicator />}

                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 bg-[#050816]/90 p-4 backdrop-blur-xl sm:p-6">
              <form
                onSubmit={handleSubmit}
                className="mx-auto max-w-4xl"
              >
                <div className="rounded-2xl border border-white/10 bg-slate-950/90 p-2 shadow-2xl transition focus-within:border-cyan-400/50 focus-within:ring-4 focus-within:ring-cyan-400/10">
                  <div className="flex items-end gap-2">
                    <button
                      type="button"
                      disabled
                      className="mb-1 hidden h-10 w-10 items-center justify-center rounded-xl text-xl text-slate-700 sm:flex"
                    >
                      +
                    </button>

                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(event) =>
                        setInput(event.target.value)
                      }
                      onKeyDown={handleKeyDown}
                      rows={1}
                      disabled={isThinking}
                      placeholder="Ask about leads, tasks, invoices, reports, or customers..."
                      className="max-h-[150px] min-h-12 flex-1 resize-none bg-transparent px-3 py-3 text-sm leading-6 text-white outline-none placeholder:text-slate-600 disabled:opacity-50"
                    />

                    <button
                      type="submit"
                      disabled={!input.trim() || isThinking}
                      className="mb-1 flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-300 to-blue-500 px-4 font-bold text-slate-950 transition hover:from-cyan-200 hover:to-blue-400 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <span className="hidden sm:inline">
                        {isThinking ? "Thinking..." : "Send"}
                      </span>

                      <span className="text-lg">↑</span>
                    </button>
                  </div>

                  <div className="flex justify-between px-3 pb-1 pt-2 text-[10px] text-slate-600">
                    <span>BusinessPilot AI</span>
                    <span>
                      Enter to send · Shift + Enter for new line
                    </span>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function MessageView({
  message,
}: {
  message: Message;
}) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  async function copyMessage() {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 1500);
  }

  return (
    <div
      className={`group flex items-start gap-3 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      {!isUser && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-300 to-blue-600 font-bold text-slate-950 shadow-lg shadow-cyan-500/20">
          ✦
        </div>
      )}

      <div
        className={`max-w-[88%] rounded-2xl px-5 py-4 text-sm leading-7 ${
          isUser
            ? "rounded-br-md bg-gradient-to-br from-cyan-300 to-blue-500 font-medium text-slate-950 shadow-lg shadow-cyan-500/10"
            : "rounded-bl-md border border-white/10 bg-white/[0.06] text-slate-300 shadow-xl shadow-black/10"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">
            {message.content}
          </p>
        ) : (
          <FormattedAIResponse content={message.content} />
        )}

        {!isUser && (
          <button
            type="button"
            onClick={copyMessage}
            className="mt-3 text-[11px] text-slate-600 transition hover:text-cyan-300"
          >
            {copied ? "Copied" : "Copy response"}
          </button>
        )}
      </div>

      {isUser && (
        <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-xs font-semibold text-slate-400 sm:flex">
          You
        </div>
      )}
    </div>
  );
}

function FormattedAIResponse({
  content,
}: {
  content: string;
}) {
  const lines = content.split("\n");

  return (
    <div className="space-y-2">
      {lines.map((line, index) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={index} className="h-2" />;
        }

        if (trimmed.startsWith("### ")) {
          return (
            <h3
              key={index}
              className="pt-2 text-base font-bold text-white"
            >
              {formatInline(trimmed.slice(4))}
            </h3>
          );
        }

        if (trimmed.startsWith("## ")) {
          return (
            <h2
              key={index}
              className="pt-2 text-lg font-bold text-white"
            >
              {formatInline(trimmed.slice(3))}
            </h2>
          );
        }

        if (
          trimmed.startsWith("- ") ||
          trimmed.startsWith("* ")
        ) {
          return (
            <div key={index} className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" />
              <p>{formatInline(trimmed.slice(2))}</p>
            </div>
          );
        }

        const numbered = /^(\d+)\.\s(.+)$/.exec(trimmed);

        if (numbered) {
          return (
            <div key={index} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-xs font-bold text-cyan-300">
                {numbered[1]}
              </span>

              <p>{formatInline(numbered[2])}</p>
            </div>
          );
        }

        return <p key={index}>{formatInline(trimmed)}</p>;
      })}
    </div>
  );
}

function formatInline(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);

  return parts.map((part, index) => {
    if (
      part.startsWith("**") &&
      part.endsWith("**")
    ) {
      return (
        <strong
          key={index}
          className="font-bold text-cyan-200"
        >
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          className="rounded bg-slate-950 px-1.5 py-0.5 text-cyan-300"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return <span key={index}>{part}</span>;
  });
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-300 to-blue-600 font-bold text-slate-950">
        ✦
      </div>

      <div className="rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.06] px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">
            BusinessPilot is thinking
          </span>

          <span className="flex gap-1">
            <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300" />
            <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300 [animation-delay:150ms]" />
            <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300 [animation-delay:300ms]" />
          </span>
        </div>
      </div>
    </div>
  );
}