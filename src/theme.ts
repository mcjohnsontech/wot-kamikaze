import { createTheme, rem } from '@mantine/core';

export const theme = createTheme({
    primaryColor: 'blue',
    defaultRadius: 'md',
    cursorType: 'pointer',

    components: {
        Button: {
            defaultProps: {
                size: 'md',
            },
            styles: (_theme: any, params: any, _context: any) => ({
                root: {
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                    '&:hover': !params.disabled ? {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    } : undefined,
                    '&:active': !params.disabled ? {
                        transform: 'translateY(0)',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                    } : undefined,
                },
            }),
        },
        Card: {
            defaultProps: {
                shadow: 'sm',
                radius: 'md',
                withBorder: true,
            },
        }
    },
});
