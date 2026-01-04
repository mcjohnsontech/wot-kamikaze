import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { Title, Text, Button, Container, Stack, Code } from '@mantine/core';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <Container size="md" py="xl">
                    <Stack align="center" mt="xl">
                        <Title order={2}>Something went wrong</Title>
                        <Text>The application crashed due to an unknown error.</Text>

                        {this.state.error && (
                            <Code block color="red" style={{ width: '100%', overflow: 'auto', maxHeight: '400px' }}>
                                {this.state.error.toString()}
                                {this.state.errorInfo?.componentStack}
                            </Code>
                        )}

                        <Button onClick={() => window.location.reload()} variant="light" color="blue">
                            Reload Page
                        </Button>
                        <Button onClick={() => window.location.href = '/'} variant="subtle" color="gray">
                            Go to Home
                        </Button>
                    </Stack>
                </Container>
            );
        }

        return this.props.children;
    }
}
