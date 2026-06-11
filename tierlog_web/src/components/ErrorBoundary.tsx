import React from "react";
import { View, Text } from "react-native";

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
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: "#020617", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ color: "#F8FAFC", fontSize: 20, fontWeight: "800", marginBottom: 12 }}>
            Something went wrong
          </Text>
          <Text style={{ color: "#94A3B8", fontSize: 14, textAlign: "center", marginBottom: 24, lineHeight: 22 }}>
            {this.state.error?.message || "An unexpected error occurred."}
          </Text>
          <Text
            onPress={() => this.setState({ hasError: false, error: null })}
            style={{ color: "#6366F1", fontSize: 14, fontWeight: "700" }}
          >
            Try Again
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}
