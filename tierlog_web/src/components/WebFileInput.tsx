import React, { useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { CloudUpload, CheckCircle } from "lucide-react-native";
import { cn } from "@/src/lib/utils";

// ─── Native version ──────────────────────────────────────────────────────────
function WebFileInputNative({
  label,
  accept,
  onFileSelect,
}: {
  label: string;
  accept: string;
  onFileSelect: (file: any | null) => void;
}) {
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const handlePress = async () => {
    try {
      const DocumentPicker = require("expo-document-picker");
      const result = await DocumentPicker.getDocumentAsync({
        type: accept.split(",").map((a) => a.trim()),
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setSelectedFileName(file.name);
        const fileObj = {
          uri: file.uri,
          name: file.name,
          type: file.mimeType || "application/octet-stream",
          size: file.size,
        };
        onFileSelect(fileObj);
      }
    } catch (err) {
      console.warn("Document picker error:", err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <Pressable
        onPress={() => void handlePress()}
        style={({ pressed }) => [
          styles.dropzone,
          selectedFileName ? styles.dropzoneActive : styles.dropzoneInactive,
          { transform: [{ scale: pressed ? 0.98 : 1 }] },
        ]}
        className={cn(
          selectedFileName ? "bg-white/[0.05]" : "bg-white/[0.03]",
          "border border-white/[0.08] rounded-[20px] p-5",
        )}
      >
        {selectedFileName ? (
          <View style={styles.fileSelectedWrap}>
            <View style={styles.successIconWrapper}>
              <CheckCircle color="#10b981" size={24} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fileLabel}>UPLOADED DOCUMENT</Text>
              <Text style={styles.fileName} numberOfLines={1}>
                {selectedFileName}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyWrap}>
            <CloudUpload color="#64748b" size={28} />
            <Text style={styles.instruction}>
              Tap to select document
            </Text>
            <Text style={styles.formatTip}>Supported format: {accept}</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

// ─── Web version ─────────────────────────────────────────────────────────────
export function WebFileInput({
  label,
  accept,
  onFileSelect,
}: {
  label: string;
  accept: string;
  onFileSelect: (file: File | null) => void;
}) {
  if (Platform.OS !== "web") {
    return <WebFileInputNative label={label} accept={accept} onFileSelect={onFileSelect} />;
  }

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  const handlePress = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFileName(file ? file.name : null);
    onFileSelect(file);
  };

  const handleDrag = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (accept.includes("audio") && !file.type.startsWith("audio/")) {
        return;
      }
      if (accept.includes("docx") && !file.name.endsWith(".docx")) {
        return;
      }
      setSelectedFileName(file.name);
      onFileSelect(file);
    }
  };

  const isGlowing = isDragActive || isHovered;
  const activeColor = selectedFileName ? "#10b981" : "#6366f1";

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <input
        type="file"
        ref={fileInputRef}
        accept={accept}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        style={{ width: "100%" }}
      >
        <Pressable
          onPress={handlePress}
          onHoverIn={() => setIsHovered(true)}
          onHoverOut={() => setIsHovered(false)}
          style={({ pressed }) => [
            styles.dropzone,
            selectedFileName ? styles.dropzoneActive : styles.dropzoneInactive,
            isGlowing && { boxShadow: `0 0 22px ${activeColor}38` },
            {
              transform: [{ scale: pressed ? 0.98 : isHovered ? 1.01 : 1 }],
            },
          ]}
          className={cn(
            selectedFileName ? "bg-white/[0.05]" : "bg-white/[0.03]",
            "border border-white/[0.08] rounded-[20px] p-5",
          )}
        >
          {selectedFileName ? (
            <View style={styles.fileSelectedWrap}>
              <View style={styles.successIconWrapper}>
                <CheckCircle color="#10b981" size={24} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fileLabel}>UPLOADED DOCUMENT</Text>
                <Text style={styles.fileName} numberOfLines={1}>
                  {selectedFileName}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyWrap}>
              <CloudUpload color={isGlowing ? "#6366f1" : "#64748b"} size={28} />
              <Text style={[styles.instruction, isGlowing && { color: "#cbd5e1" }]}>
                {isDragActive ? "Drop the file here..." : "Choose document or drag file here"}
              </Text>
              <Text style={styles.formatTip}>Supported format: {accept}</Text>
            </View>
          )}
        </Pressable>
      </div>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    gap: 8,
  },
  label: {
    color: "#64748b",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    paddingLeft: 4,
  },
  dropzone: {
    width: "100%",
    minHeight: 110,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: "dashed",
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  } as any,
  dropzoneInactive: {
    borderColor: "rgba(99, 102, 241, 0.18)",
  },
  dropzoneActive: {
    borderColor: "#10b981",
  },
  emptyWrap: {
    alignItems: "center",
    gap: 8,
  },
  instruction: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    transition: "color 0.2s ease",
  } as any,
  formatTip: {
    color: "#475569",
    fontSize: 11,
    fontWeight: "500",
  },
  fileSelectedWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    width: "100%",
    paddingHorizontal: 8,
  },
  successIconWrapper: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    padding: 10,
    borderRadius: 99,
  },
  fileLabel: {
    color: "#10b981",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  fileName: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 4,
  },
});
