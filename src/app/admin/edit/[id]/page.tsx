"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { generateSlug } from "@/lib/utils";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const Editor = dynamic(() => import("@/components/Editor"), { ssr: false });

export default function EditPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const writing = useQuery(api.writings.getById, {
        id: id as Id<"writings">,
    });
    const updateWriting = useMutation(api.writings.update);

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [slug, setSlug] = useState("");
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [initialized, setInitialized] = useState(false);

    const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (writing && !initialized) {
            setTitle(writing.title);
            setContent(writing.content);
            setSlug(writing.slug);
            setInitialized(true);
        }
    }, [writing, initialized]);

    useEffect(() => {
        if (initialized && title) setSlug(generateSlug(title));
    }, [title, initialized]);

    const autoSave = useCallback(
        async (t: string, c: string) => {
            if (!t.trim()) return;
            setSaving(true);
            try {
                await updateWriting({
                    id: id as Id<"writings">,
                    title: t,
                    content: c,
                    slug: generateSlug(t),
                });
                setLastSaved(new Date());
            } catch (err) {
                console.error("Auto-save failed:", err);
            }
            setSaving(false);
        },
        [id, updateWriting]
    );

    const triggerAutoSave = useCallback(
        (t: string, c: string) => {
            if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
            autoSaveTimer.current = setTimeout(() => autoSave(t, c), 1500);
        },
        [autoSave]
    );

    const handleTogglePublish = async () => {
        if (!writing) return;
        setSaving(true);
        try {
            await updateWriting({
                id: id as Id<"writings">,
                published: !writing.published,
            });
            router.push("/admin");
        } catch (err) {
            console.error("Toggle failed:", err);
        }
        setSaving(false);
    };

    if (writing === undefined) {
        return (
            <div className="loading-center">
                <div className="spinner" />
            </div>
        );
    }

    if (writing === null) {
        return (
            <div className="empty-state">
                <h2 className="empty-title">Writing not found.</h2>
                <br />
                <button onClick={() => router.push("/admin")} className="btn">
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div>
            <div className="write-header">
                <div className="write-header-left">
                    <h2 className="write-heading">Editing</h2>
                    {saving && <span className="save-indicator">Saving...</span>}
                    {!saving && lastSaved && (
                        <span className="save-indicator">Saved</span>
                    )}
                </div>
                <button
                    onClick={handleTogglePublish}
                    disabled={saving}
                    className="btn"
                >
                    {writing.published ? "Unpublish" : "Publish"}
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
            />

            {initialized && (
                <Editor
                    content={content}
                    onUpdate={(html) => {
                        setContent(html);
                        triggerAutoSave(title, html);
                    }}
                />
            )}
        </div>
    );
}
