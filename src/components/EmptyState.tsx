// src/components/EmptyState.tsx
import React from "react";
import {
    CheckCircleIcon,
    InformationCircleIcon,
} from "@heroicons/react/24/outline";

type EmptyStateVariant = "success" | "info";

interface EmptyStateProps {
    title: string;
    description?: string;
    variant?: EmptyStateVariant;
}

const iconStyle: React.CSSProperties = {
    width: 24,
    height: 24,
};

export const EmptyState: React.FC<EmptyStateProps> = ({
    title,
    description,
    variant = "info",
}) => {
    const isSuccess = variant === "success";

    return (
        <div
            style={{
                borderRadius: "10px",
                border: "1px dashed #d1d5db",
                padding: "12px 14px",
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                backgroundColor: isSuccess ? "rgba(22, 163, 74, 0.04)" : "#f9fafb",
            }}
        >
            <div
                style={{
                    color: isSuccess ? "#16a34a" : "#6b7280",
                    marginTop: "2px",
                }}
            >
                {isSuccess ? (
                    <CheckCircleIcon style={iconStyle} />
                ) : (
                    <InformationCircleIcon style={iconStyle} />
                )}
            </div>

            <div>
                <div
                    style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#374151",
                    }}
                >
                    {title}
                </div>
                {description && (
                    <p
                        style={{
                            marginTop: "2px",
                            fontSize: "13px",
                            color: "#6b7280",
                        }}
                    >
                        {description}
                    </p>
                )}
            </div>
        </div>
    );
};