"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Tag } from "lucide-react";
import { DeleteTemplateButton } from "./delete-template-button";
import { EditTemplateDialog } from "./edit-template-dialog";
import Link from "next/link";

interface TemplateCardProps {
    template: {
        id: string;
        name: string;
        tags: string[];
    };
}

export function TemplateCard({ template }: TemplateCardProps) {
    return (
        <Link href={`/market/templates/${template.id}`}>
            <Card className="bg-bg-1 border-border hover:bg-bg-2/30 transition-all duration-300 hover:border-accent-violet/30 hover:shadow-lg hover:shadow-accent-violet/5 overflow-hidden group">
                <div className="flex items-center gap-3 px-3 py-2">
                    {/* Icon */}
                    <div className="w-12 h-12 shrink-0 bg-accent-info/10 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-accent-info" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
                        {/* Left: Name and Tags */}
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-text-1 group-hover:text-accent-violet transition-colors truncate text-sm">
                                {template.name}
                            </h3>
                            <div className="flex items-center gap-2">
                                {template.tags.length > 0 ? (
                                    <div className="flex gap-1 flex-wrap">
                                        {template.tags.map(tag => (
                                            <Badge
                                                key={tag}
                                                variant="outline"
                                                className="text-[10px] border-border/50 text-text-3 px-1.5 py-0 h-4"
                                            >
                                                <Tag className="w-2.5 h-2.5 mr-1" />
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-[10px] text-text-3 italic">Sin etiquetas</span>
                                )}
                            </div>
                        </div>

                        {/* Right: Action Buttons */}
                        <div
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                            }}
                            className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <EditTemplateDialog template={template} />
                            <DeleteTemplateButton id={template.id} name={template.name} />
                        </div>
                    </div>
                </div>
            </Card>
        </Link>
    );
}
