"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Volume2, Image as ImageIcon, Upload, X } from "lucide-react";

interface MediaAssetPlayerProps {
    audioUrl?: string;
    imageUrl?: string;
    onImageRemove?: () => void;
    onAudioRemove?: () => void;
}

export function MediaAssetPlayer({
    audioUrl,
    imageUrl,
    onImageRemove,
    onAudioRemove,
}: MediaAssetPlayerProps) {
    const [isPlaying, setIsPlaying] = React.useState(false);
    const audioRef = React.useRef<HTMLAudioElement | null>(null);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <div className="space-y-4">
            {/* Listening Audio Player Section */}
            {audioUrl && (
                <div className="flex items-center justify-between p-3 rounded-xl border bg-secondary/50">
                    <div className="flex items-center gap-3">
                        <Button
                            type="button"
                            variant="default"
                            size="icon"
                            className="h-9 w-9 rounded-full"
                            onClick={togglePlay}
                        >
                            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                        </Button>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold">Listening Audio Track</span>
                                <Badge variant="outline" className="text-[10px] py-0">MP3 / WebM</Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground">English Listening Audio Passage</p>
                        </div>
                        <audio
                            ref={audioRef}
                            src={audioUrl}
                            onEnded={() => setIsPlaying(false)}
                            className="hidden"
                        />
                    </div>
                    {onAudioRemove && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-danger"
                            onClick={onAudioRemove}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            )}

            {/* Image Media Section */}
            {imageUrl && (
                <div className="relative group rounded-xl border overflow-hidden max-w-md bg-card">
                    <img
                        src={imageUrl}
                        alt="Asset Soal"
                        className="w-full h-auto object-cover max-h-56"
                    />
                    {onImageRemove && (
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-7 w-7 opacity-90 group-hover:opacity-100 transition-opacity"
                            onClick={onImageRemove}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
