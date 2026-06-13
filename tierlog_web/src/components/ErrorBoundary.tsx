import React from "react";
import { ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error: Error | null };

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} onReset={() => this.setState({ hasError: false, error: null })} />;
    }
    return this.props.children;
  }
}

function ErrorFallback({ error, onReset }: { error: Error | null; onReset: () => void }) {
  const router = useRouter();

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        backgroundColor: "#020617",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <View style={{ alignItems: "center", gap: 12, maxWidth: 400 }}>
        <Text style={{ color: "#F8FAFC", fontSize: 20, fontWeight: "800", marginBottom: 4 }}>
          Something went wrong
        </Text>
        <ScrollView
          style={{
            maxHeight: 160,
            width: "100%",
            backgroundColor: "rgba(255,255,255,0.03)",
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.06)",
            padding: 12,
          }}
          nestedScrollEnabled
        >
          <Text style={{ color: "#94A3B8", fontSize: 13, textAlign: "center", lineHeight: 20 }}>
            {error?.message || "An unexpected error occurred."}
          </Text>
        </ScrollView>

        <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
          <Text
            onPress={onReset}
            style={{
              color: "#F8FAFC",
              fontSize: 14,
              fontWeight: "700",
              backgroundColor: "#4F46E5",
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            Try Again
          </Text>
          <Text
            onPress={() => router.replace("/")}
            style={{
              color: "#F8FAFC",
              fontSize: 14,
              fontWeight: "700",
              backgroundColor: "rgba(255,255,255,0.06)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.08)",
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            Go Home
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
