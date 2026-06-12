import React, { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { CloudUpload, CheckCircle } from "lucide-react-native";
import { cn } from "@/src/lib/utils";

type MobileFileInputProps = {
  label: string;
  accept?: string;
  onFileSelect: (file: any | null) => void;
  nativeAccept?: string[];
};

export function MobileFileInput({
  label,
  accept = "*/*",
  onFileSelect,
  nativeAccept,
}: MobileFileInputProps) {
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const handlePress = async () => {
    if (Platform.OS === "web") {
      return;
    }

    try {
      const DocumentPicker = require("expo-document-picker");
      const result = await DocumentPicker.getDocumentAsync({
        type: nativeAccept || accept.split(",").map((a) => a.trim()),
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
      console.error("Document picker error:", err);
    }
  };

  const activeColor = selectedFileName ? "#10b981" : "#6366f1";

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
            <Text style={styles.formatTip}>Supported: {accept}</Text>
          </View>
        )}
      </Pressable>
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
    textTransform: "uppercase" as const,
    paddingLeft: 4,
  },
  dropzone: {
    width: "100%",
    minHeight: 110,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: "dashed" as const,
    padding: 20,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  dropzoneInactive: {
    borderColor: "rgba(99, 102, 241, 0.18)",
  },
  dropzoneActive: {
    borderColor: "#10b981",
  },
  emptyWrap: {
    alignItems: "center" as const,
    gap: 8,
  },
  instruction: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center" as const,
  },
  formatTip: {
    color: "#475569",
    fontSize: 11,
    fontWeight: "500",
  },
  fileSelectedWrap: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
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
