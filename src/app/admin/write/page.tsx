"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { generateSlug } from "@/lib/utils";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const Editor = dynamic(() => import("@/components/Editor"), { ssr: false });

export default function WritePage() {
    const router = useRouter();
    const createWriting = useMutation(api.writings.create);
    const updateWriting = useMutation(api.writings.update);

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [slug, setSlug] = useState("");
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [docId, setDocId] = useState<Id<"writings"> | null>(null);

    const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setSlug(title ? generateSlug(title) : "");
    }, [title]);

    const autoSave = useCallback(
        async (t: string, c: string) => {
            if (!t.trim()) return;
            setSaving(true);
            try {
                const s = generateSlug(t);
                if (docId) {
                    await updateWriting({ id: docId, title: t, content: c, slug: s });
                } else {
                    const id = await createWriting({
                        title: t,
                        content: c,
                        slug: s,
                        published: false,
                    });
                    setDocId(id);
                }
                setLastSaved(new Date());
            } catch (err) {
                console.error("Auto-save failed:", err);
            }
            setSaving(false);
        },
        [docId, createWriting, updateWriting]
    );

    const triggerAutoSave = useCallback(
        (t: string, c: string) => {
            if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
            autoSaveTimer.current = setTimeout(() => autoSave(t, c), 1500);
        },
        [autoSave]
    );

    const handlePublish = async () => {
        if (!title.trim()) return;
        setSaving(true);
        try {
            if (docId) {
                await updateWriting({
                    id: docId,
                    title,
                    content,
                    slug,
                    published: true,
                });
            } else {
                await createWriting({ title, content, slug, published: true });
            }
            router.push("/admin");
        } catch (err) {
            console.error("Publish failed:", err);
        }
        setSaving(false);
    };

    return (
        <div>
            <div className="write-header">
                <div className="write-header-left">
                    <h2 className="write-heading">New Writing</h2>
                    {saving && <span className="save-indicator">Saving...</span>}
                    {!saving && lastSaved && (
                        <span className="save-indicator">Saved</span>
                    )}
                </div>
                <button
                    onClick={handlePublish}
                    disabled={!title.trim() || saving}
                    className="btn"
                >
                    Publish
                </button>
            </div>

            {slug && <p className="slug-preview">/{slug}</p>}

            <input
                type="text"
                value={title}
                onChange={(e) => {
                    setTitle(e.target.value);
                    triggerAutoSave(e.target.value, content);
                }}
                placeholder="Title"
                className="title-input"
                autoFocus
            />

            <Editor
                content={content}
                onUpdate={(html) => {
                    setContent(html);
                    triggerAutoSave(title, html);
                }}
            />
        </div>
    );
}
