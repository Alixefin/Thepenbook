"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface AudioPlayerProps {
    audioFileId: string;
}

export default function AudioPlayer({ audioFileId }: AudioPlayerProps) {
    const audioUrl = useQuery(api.writings.getFileUrl, { storageId: audioFileId });
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [mounted, setMounted] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Format time in mm:ss format
    const formatTime = (secs: number) => {
        if (isNaN(secs)) return "0:00";
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m}:${s < 10 ? "0" : ""}${s}`;
    };

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play().catch(err => console.error("Playback failed:", err));
            setIsPlaying(true);
        }
    };

    const handleTimeUpdate = () => {
        if (!audioRef.current) return;
        setCurrentTime(audioRef.current.currentTime);
    };

    const handleLoadedMetadata = () => {
        if (!audioRef.current) return;
        setDuration(audioRef.current.duration);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!audioRef.current) return;
        const targetVal = parseFloat(e.target.value);
        audioRef.current.currentTime = targetVal;
        setCurrentTime(targetVal);
    };

    const toggleMute = () => {
        if (!audioRef.current) return;
        const nextMute = !isMuted;
        audioRef.current.muted = nextMute;
        setIsMuted(nextMute);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!audioRef.current) return;
        const nextVol = parseFloat(e.target.value);
        audioRef.current.volume = nextVol;
        setVolume(nextVol);
        if (nextVol > 0 && isMuted) {
            audioRef.current.muted = false;
            setIsMuted(false);
        }
    };

    // When audio finishes, reset play state
    const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
    };

    if (!mounted || !audioUrl) return null;

    return (
        <div className="custom-audio-player-wrap">
            <audio
                ref={audioRef}
                src={audioUrl}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
            />

            <div className="audio-player-title-row">
                <span className="audio-player-icon">🎙️</span>
                <span className="audio-player-title-text">Listen to Audiobook</span>
            </div>

            <div className="audio-player-controls-row">
                {/* Play/Pause Button */}
                <button
                    className="audio-control-btn play-pause-btn"
                    onClick={togglePlay}
                    aria-label={isPlaying ? "Pause" : "Play"}
                >
                    {isPlaying ? (
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                            <rect x="5" y="4" width="4" height="16" rx="1" />
                            <rect x="15" y="4" width="4" height="16" rx="1" />
                        </svg>
                    ) : (
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                            <path d="M7 4.3v15.4c0 .8.8 1.2 1.5.8l12.3-7.7c.6-.4.6-1.3 0-1.7L8.5 3.5c-.7-.4-1.5 0-1.5.8z" />
                        </svg>
                    )}
                </button>

                {/* Progress Bar & Timers */}
                <span className="audio-player-time">{formatTime(currentTime)}</span>
                <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className="audio-seeker-bar"
                    style={{
                        background: `linear-gradient(to right, var(--color-primary) ${
                            (currentTime / (duration || 1)) * 100
                        }%, var(--color-border-strong) ${(currentTime / (duration || 1)) * 100}%)`
                    }}
                />
                <span className="audio-player-time">{formatTime(duration)}</span>

                {/* Mute/Volume controls */}
                <div className="audio-volume-container">
                    <button
                        className="audio-control-btn mute-btn"
                        onClick={toggleMute}
                        aria-label={isMuted ? "Unmute" : "Mute"}
                    >
                        {isMuted || volume === 0 ? (
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                <path d="M3.6 3.6l16.8 16.8-1.4 1.4-3.1-3.1c-1 .6-2.1.9-3.4.9-3.9 0-7-3.1-7-7 0-1.2.3-2.4.9-3.4L3.6 5 5 3.6zm13.9 8.4c0-2.8-2.2-5-5-5-.4 0-.8.1-1.2.2L9.7 5.6C10.6 5.2 11.5 5 12.5 5c3.9 0 7 3.1 7 7 0 1-.2 1.9-.6 2.8l-1.6-1.6c.1-.4.2-.8.2-1.2z" />
                                <path d="M9 7.5L5.3 11.2c-.2.2-.3.5-.3.8v4c0 .6.4 1 1 1h3c.3 0 .5.1.7.3l3.7 3.7c.6.6 1.6.2 1.6-.6V16.8L9 10.8V7.5zm7 4.5c0-1.1-.9-2-2-2v4c1.1 0 2-.9 2-2z" />
                            </svg>
                        ) : (
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                <path d="M3 9v6c0 .6.4 1 1 1h3l3.7 3.7c.6.6 1.6.2 1.6-.6V4.9c0-.8-1-1.2-1.6-.6L7 8H4c-.6 0-1 .4-1 1zm12.5 3c0-1.7-1-3.2-2.5-4v8c1.5-.8 2.5-2.3 2.5-4zM13 3.3v2.1c2.4.9 4 3.2 4 5.9s-1.6 5-4 5.9v2.1c3.5-1 6-4.1 6-8s-2.5-7-6-8z" />
                            </svg>
                        )}
                    </button>
                    <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="audio-volume-slider"
                        style={{
                            background: `linear-gradient(to right, var(--color-primary) ${
                                (isMuted ? 0 : volume) * 100
                            }%, var(--color-border-strong) ${(isMuted ? 0 : volume) * 100}%)`
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
