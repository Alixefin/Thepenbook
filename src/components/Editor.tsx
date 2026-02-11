"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Extension } from "@tiptap/core";

// Custom extension: Indent/outdent paragraphs with Tab / Shift+Tab
const Indent = Extension.create({
    name: "indent",

    addGlobalAttributes() {
        return [
            {
                types: ["paragraph", "heading"],
                attributes: {
                    indent: {
                        default: 0,
                        parseHTML: (element) => {
                            const ml = element.style.marginLeft;
                            if (ml) {
                                return parseInt(ml, 10) / 32 || 0;
                            }
                            return 0;
                        },
                        renderHTML: (attributes) => {
                            if (!attributes.indent || attributes.indent <= 0) return {};
                            return {
                                style: `margin-left: ${attributes.indent * 32}px`,
                            };
                        },
                    },
                },
            },
        ];
    },

    addKeyboardShortcuts() {
        return {
            Tab: ({ editor }) => {
                // In lists, let default behavior handle it
                if (
                    editor.isActive("bulletList") ||
                    editor.isActive("orderedList")
                ) {
                    return false;
                }
                const { indent = 0 } = editor.getAttributes("paragraph") ||
                    editor.getAttributes("heading") || {};
                if (indent < 10) {
                    editor
                        .chain()
                        .focus()
                        .updateAttributes(
                            editor.isActive("heading") ? "heading" : "paragraph",
                            { indent: indent + 1 }
                        )
                        .run();
                }
                return true;
            },
            "Shift-Tab": ({ editor }) => {
                if (
                    editor.isActive("bulletList") ||
                    editor.isActive("orderedList")
                ) {
                    return false;
                }
                const { indent = 0 } = editor.getAttributes("paragraph") ||
                    editor.getAttributes("heading") || {};
                if (indent > 0) {
                    editor
                        .chain()
                        .focus()
                        .updateAttributes(
                            editor.isActive("heading") ? "heading" : "paragraph",
                            { indent: indent - 1 }
                        )
                        .run();
                }
                return true;
            },
        };
    },
});

interface EditorProps {
    content: string;
    onUpdate: (html: string) => void;
    placeholder?: string;
}

export default function Editor({
    content,
    onUpdate,
    placeholder = "Start writing...",
}: EditorProps) {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2],
                },
            }),
            Placeholder.configure({
                placeholder,
            }),
            Indent,
        ],
        content,
        editorProps: {
            attributes: {
                class: "tiptap-editor tiptap-garamond",
            },
        },
        onUpdate: ({ editor }) => {
            onUpdate(editor.getHTML());
        },
    });

    if (!editor) {
        return (
            <div className="editor-loading">
                <div className="spinner" />
            </div>
        );
    }

    // Indent helpers for toolbar buttons
    const handleIndent = () => {
        const { indent = 0 } =
            editor.getAttributes("paragraph") ||
            editor.getAttributes("heading") ||
            {};
        if (indent < 10) {
            editor
                .chain()
                .focus()
                .updateAttributes(
                    editor.isActive("heading") ? "heading" : "paragraph",
                    { indent: indent + 1 }
                )
                .run();
        }
    };

    const handleOutdent = () => {
        const { indent = 0 } =
            editor.getAttributes("paragraph") ||
            editor.getAttributes("heading") ||
            {};
        if (indent > 0) {
            editor
                .chain()
                .focus()
                .updateAttributes(
                    editor.isActive("heading") ? "heading" : "paragraph",
                    { indent: indent - 1 }
                )
                .run();
        }
    };

    return (
        <div className="editor-wrapper">
            {/* Toolbar */}
            <div className="editor-toolbar">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`toolbar-btn ${editor.isActive("bold") ? "is-active" : ""}`}
                    title="Bold"
                >
                    <strong>B</strong>
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`toolbar-btn ${editor.isActive("italic") ? "is-active" : ""}`}
                    title="Italic"
                >
                    <em>I</em>
                </button>

                <span className="toolbar-divider" />

                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={`toolbar-btn ${editor.isActive("heading", { level: 1 }) ? "is-active" : ""}`}
                    title="Heading 1"
                >
                    H1
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`toolbar-btn ${editor.isActive("heading", { level: 2 }) ? "is-active" : ""}`}
                    title="Heading 2"
                >
                    H2
                </button>

                <span className="toolbar-divider" />

                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`toolbar-btn ${editor.isActive("bulletList") ? "is-active" : ""}`}
                    title="Bullet List"
                >
                    •
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`toolbar-btn ${editor.isActive("orderedList") ? "is-active" : ""}`}
                    title="Ordered List"
                >
                    1.
                </button>

                <span className="toolbar-divider" />

                <button
                    type="button"
                    onClick={handleOutdent}
                    className="toolbar-btn"
                    title="Outdent (Shift+Tab)"
                >
                    ←
                </button>
                <button
                    type="button"
                    onClick={handleIndent}
                    className="toolbar-btn"
                    title="Indent (Tab)"
                >
                    →
                </button>
            </div>

            {/* Editor */}
            <EditorContent editor={editor} />
        </div>
    );
}
