import React, { useState } from "react";
import { Plus, Check, Trash2, Edit2, X, Search } from "lucide-react";

type TODO = { id: number; name: string; complete: boolean };

// Centralized data service - replace with actual API calls later
const todoService = {
    fetchAll: async (): Promise<TODO[]> => {
        const response = await fetch("http://localhost:8080/todos");
        const data = await response.json();
        return data;
    },

    fetchById: async (id: number): Promise<TODO | null> => {
        const response = await fetch(`http://localhost:8080/todos/${id}`);
        const data = await response.json();
        return data || null;
    },

    create: async (name: string): Promise<TODO> => {
        const response = await fetch("http://localhost:8080/todos/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ name, complete: false }),
        });
        const data = await response.json();
        return data;
    },

    update: async (id: number, updates: Partial<TODO>): Promise<TODO> => {
        const response = await fetch(`http://localhost:8080/todos/update`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                ...updates,
                id,
            }),
        });
        const data = await response.json();
        return data;
    },

    delete: async (id: number): Promise<void> => {
        await new Promise((resolve) => setTimeout(resolve, 200));
    },
};

export default function TodoApp() {
    const [todos, setTodos] = useState<TODO[]>([]);
    const [loading, setLoading] = useState(false);
    const [newTodo, setNewTodo] = useState("");
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editText, setEditText] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

    React.useEffect(() => {
        loadTodos();
    }, []);

    const loadTodos = async () => {
        setLoading(true);
        try {
            const data = await todoService.fetchAll();
            setTodos(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTodo = async () => {
        if (!newTodo.trim()) return;

        const todo = await todoService.create(newTodo);
        setTodos([...todos, todo]);
        setNewTodo("");
    };

    const handleToggleTodo = async (id: number) => {
        const todo = todos.find((t) => t.id === id);
        if (!todo) return;

        const updated = await todoService.update(id, {
            complete: !todo.complete,
            name: todo.name,
        });
        setTodos(todos.map((t) => (t.id === id ? updated : t)));
    };

    const handleDeleteTodo = async (id: number) => {
        await todoService.delete(id);
        setTodos(todos.filter((t) => t.id !== id));
    };

    const handleStartEdit = (todo: TODO) => {
        setEditingId(todo.id);
        setEditText(todo.name);
    };

    const handleSaveEdit = async (id: number) => {
        if (!editText.trim()) return;

        const updated = await todoService.update(id, {
            name: editText,
            complete: todos.find((t) => t.id === id)?.complete || false,
        });
        setTodos(todos.map((t) => (t.id === id ? updated : t)));
        setEditingId(null);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditText("");
    };

    const filteredTodos = todos.filter((todo) => {
        if (!todo || !todo.name) return false;
        const matchesSearch = todo.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        const matchesFilter =
            filter === "all"
                ? true
                : filter === "active"
                ? !todo.complete
                : todo.complete;
        return matchesSearch && matchesFilter;
    });

    const stats = {
        total: todos.length,
        active: todos.filter((t) => !t.complete).length,
        completed: todos.filter((t) => t.complete).length,
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-bold text-gray-900 mb-2">
                        My Tasks
                    </h1>
                    <p className="text-gray-600">
                        Organize your day, accomplish your goals
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="text-2xl font-bold text-indigo-600">
                            {stats.total}
                        </div>
                        <div className="text-sm text-gray-600">Total Tasks</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="text-2xl font-bold text-amber-600">
                            {stats.active}
                        </div>
                        <div className="text-sm text-gray-600">Active</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="text-2xl font-bold text-green-600">
                            {stats.completed}
                        </div>
                        <div className="text-sm text-gray-600">Completed</div>
                    </div>
                </div>

                {/* Add Todo */}
                <div className="mb-6">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newTodo}
                            onChange={(e) => setNewTodo(e.target.value)}
                            onKeyDown={(e) =>
                                e.key === "Enter" && handleAddTodo()
                            }
                            placeholder="Add a new task..."
                            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        />
                        <button
                            onClick={handleAddTodo}
                            className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 font-medium shadow-sm hover:shadow"
                        >
                            <Plus size={20} />
                            Add
                        </button>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                size={20}
                            />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search tasks..."
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                        <div className="flex gap-2">
                            {(["all", "active", "completed"] as const).map(
                                (f) => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                            filter === f
                                                ? "bg-indigo-600 text-white shadow-sm"
                                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                        }`}
                                    >
                                        {f.charAt(0).toUpperCase() + f.slice(1)}
                                    </button>
                                )
                            )}
                        </div>
                    </div>
                </div>

                {/* Todo List */}
                <div className="space-y-2">
                    {filteredTodos.length === 0 ? (
                        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
                            <div className="text-gray-400 mb-2">
                                <Check size={48} className="mx-auto" />
                            </div>
                            <p className="text-gray-600">No tasks found</p>
                        </div>
                    ) : (
                        filteredTodos.map((todo) => (
                            <div
                                key={todo.id}
                                className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 transition-all hover:shadow-md ${
                                    todo.complete ? "opacity-75" : ""
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() =>
                                            handleToggleTodo(todo.id)
                                        }
                                        className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                            todo.complete
                                                ? "bg-green-500 border-green-500"
                                                : "border-gray-300 hover:border-indigo-500"
                                        }`}
                                    >
                                        {todo.complete && (
                                            <Check
                                                size={16}
                                                className="text-white"
                                            />
                                        )}
                                    </button>

                                    {editingId === todo.id ? (
                                        <div className="flex-1 flex gap-2">
                                            <input
                                                type="text"
                                                value={editText}
                                                onChange={(e) =>
                                                    setEditText(e.target.value)
                                                }
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter")
                                                        handleSaveEdit(todo.id);
                                                    if (e.key === "Escape")
                                                        handleCancelEdit();
                                                }}
                                                className="flex-1 px-3 py-1 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                autoFocus
                                            />
                                            <button
                                                onClick={() =>
                                                    handleSaveEdit(todo.id)
                                                }
                                                className="text-green-600 hover:text-green-700 p-1"
                                            >
                                                <Check size={20} />
                                            </button>
                                            <button
                                                onClick={handleCancelEdit}
                                                className="text-red-600 hover:text-red-700 p-1"
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <span
                                                className={`flex-1 transition-all ${
                                                    todo.complete
                                                        ? "line-through text-gray-500"
                                                        : "text-gray-900"
                                                }`}
                                            >
                                                {todo.name}
                                            </span>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() =>
                                                        handleStartEdit(todo)
                                                    }
                                                    className="text-gray-400 hover:text-indigo-600 p-2 rounded-lg hover:bg-indigo-50 transition-colors"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleDeleteTodo(
                                                            todo.id
                                                        )
                                                    }
                                                    className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
