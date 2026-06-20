"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { parseVoiceTransactionAction, VoiceParseResult } from "@/app/actions/voice-transaction";

type VoiceState = "idle" | "recording" | "processing";

interface VoiceTransactionInputProps {
    onParsed: (data: VoiceParseResult, transcript: string) => void;
}

// Minimal interface for the Web Speech API (not fully typed in all TS DOM lib versions)
interface ISpeechRecognition {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    onstart: (() => void) | null;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
    start: () => void;
    stop: () => void;
}
type SpeechRecognitionCtor = new () => ISpeechRecognition;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | undefined {
    if (typeof window === "undefined") return undefined;
    const w = window as Window & {
        SpeechRecognition?: SpeechRecognitionCtor;
        webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export function VoiceTransactionInput({ onParsed }: VoiceTransactionInputProps) {
    const [voiceState, setVoiceState] = useState<VoiceState>("idle");
    const [transcript, setTranscript] = useState("");
    const recognitionRef = useRef<ISpeechRecognition | null>(null);
    const transcriptRef = useRef("");
    const isSupported = useRef(false);

    useEffect(() => {
        isSupported.current = !!getSpeechRecognitionCtor();
    }, []);

    const stopRecording = useCallback(() => {
        recognitionRef.current?.stop();
    }, []);

    const startRecording = useCallback(() => {
        const Ctor = getSpeechRecognitionCtor();
        if (!Ctor) {
            toast.error("Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.");
            return;
        }

        const recognition = new Ctor();
        recognition.lang = "es";
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setVoiceState("recording");
            setTranscript("");
            transcriptRef.current = "";
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            const current = Array.from(event.results)
                .map((r) => r[0].transcript)
                .join("");
            setTranscript(current);
            transcriptRef.current = current;
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            if (event.error !== "aborted") {
                toast.error(`Error de micrófono: ${event.error}`);
            }
            setVoiceState("idle");
        };

        recognition.onend = async () => {
            const finalText = transcriptRef.current.trim();
            if (!finalText) {
                setVoiceState("idle");
                return;
            }
            setVoiceState("processing");
            const result = await parseVoiceTransactionAction(finalText);
            if (result.success) {
                onParsed(result.data, finalText);
            } else {
                toast.error(result.error);
            }
            setVoiceState("idle");
            setTranscript("");
        };

        recognitionRef.current = recognition;
        recognition.start();
    }, [onParsed]);

    if (voiceState === "processing") {
        return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-1">
                <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                <span>Procesando audio con IA...</span>
            </div>
        );
    }

    if (voiceState === "recording") {
        return (
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                    </span>
                    <span className="text-sm text-red-500 font-medium">Escuchando...</span>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="ml-auto h-7 px-2 border-red-200 text-red-600 hover:bg-red-50"
                        onClick={stopRecording}
                    >
                        <Square className="w-3 h-3 mr-1" />
                        Detener
                    </Button>
                </div>
                {transcript && (
                    <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2 italic line-clamp-2">
                        &ldquo;{transcript}&rdquo;
                    </p>
                )}
            </div>
        );
    }

    return (
        <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2 text-violet-600 border-violet-200 hover:bg-violet-50 hover:text-violet-700"
            onClick={startRecording}
        >
            <Mic className="w-4 h-4" />
            Registrar por voz
        </Button>
    );
}
