"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Extension } from "@tiptap/core";

// Custom extension to handle Tab key for indentation
const TabHandler = Extension.create({
    name: "tabHandler",
    addKeyboardShortcuts() {
        return {
            Tab: ({ editor }) => {
                // In lists, increase indent
                if (editor.isActive("bulletList") || editor.isActive("orderedList")) {
                    return false; // let default list behavior handle it
                }
                // Otherwise insert a tab (4 spaces)
                editor.chain().focus().insertContent("\u00A0\u00A0\u00A0\u00A0").run();
                return true;
            },
            "Shift-Tab": ({ editor }) => {
                if (editor.isActive("bulletList") || editor.isActive("orderedList")) {
                    return false;
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
            TabHandler,
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
            </div>

            {/* Editor */}
            <EditorContent editor={editor} />
        </div>
    );
}
